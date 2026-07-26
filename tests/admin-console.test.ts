import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_SECTIONS,
  ADMIN_SECTION_GROUPS,
  adminSection,
  adminSectionsByGroup,
  isAdminSectionId,
} from "../lib/capital/admin-sections.ts";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/**
 * The registry is the console's single source of truth: it drives the rail, the
 * `?section=` allowlist, the overview's counts and the legacy redirect targets.
 * If it drifts, a section silently disappears from navigation while its route
 * still resolves — so it is pinned here rather than trusted.
 */

test("every section has a unique id, a declared group and bilingual labels", () => {
  const ids = ADMIN_SECTIONS.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "section ids must be unique");

  const groups = new Set(ADMIN_SECTION_GROUPS.map((group) => group.id));
  for (const section of ADMIN_SECTIONS) {
    assert.ok(groups.has(section.group), `${section.id} sits in an undeclared group`);
    assert.ok(section.label.en.trim(), `${section.id} needs an English label`);
    assert.ok(section.label.tr.trim(), `${section.id} needs a Turkish label`);
  }
});

test("every declared group actually holds sections", () => {
  for (const group of ADMIN_SECTION_GROUPS) {
    assert.ok(adminSectionsByGroup(group.id).length > 0, `${group.id} renders an empty heading`);
  }
});

test("queue sections name a module the operations_queue view emits", () => {
  // The view is last recreated (trimmed to the investor relationship) by
  // 20260725120200; these are the `module` literals it now selects. A queue
  // section naming anything else renders empty.
  const emitted = new Set(["requests", "leads", "audit", "freshness"]);
  for (const section of ADMIN_SECTIONS) {
    if (section.kind !== "queue") continue;
    assert.ok(section.queueModule, `${section.id} is a queue section with no module`);
    assert.ok(emitted.has(section.queueModule!), `${section.id} filters on an unknown module`);
  }
});

test("panel sections never claim a queue module", () => {
  for (const section of ADMIN_SECTIONS) {
    if (section.kind === "queue") continue;
    assert.equal(section.queueModule, undefined, `${section.id} is a panel but names a queue module`);
  }
});

test("an unknown or missing section falls back to the overview", () => {
  assert.equal(adminSection(undefined).id, "overview");
  assert.equal(adminSection("not-a-section").id, "overview");
  assert.equal(adminSection("users").id, "users");
  assert.equal(isAdminSectionId("taxonomies"), true);
  assert.equal(isAdminSectionId("nope"), false);
});

test("the retired operations inbox and legacy /admin/* stubs are gone", () => {
  const gone = [
    "app/[locale]/equity-market/(portal)/operations/page.tsx",
    ...["audit", "commissions", "firm-memberships", "firms", "interests", "leads", "license-verifications", "partner-applications"]
      .map((name) => `app/[locale]/equity-market/(portal)/admin/${name}/page.tsx`),
  ];
  for (const path of gone) {
    assert.throws(() => read(path), `${path} should have been deleted, not left as a redirect stub`);
  }
});

test("the console mounts a component for every section in the registry", () => {
  const console_ = read("components/capital/north/AdminConsole.tsx");
  for (const section of ADMIN_SECTIONS) {
    if (section.kind === "queue") continue; // rendered by the shared queue branch
    if (section.id === "overview") {
      assert.match(console_, /<AdminOverview/, "overview has no component");
      continue;
    }
    assert.match(
      console_,
      new RegExp(`active\\.id === "${section.id}"`),
      `${section.id} appears in the rail but nothing renders it`,
    );
  }
});

test("the console is reached from Profile, never from the sidebar", () => {
  const shell = read("components/capital/north/NorthShell.tsx");
  // No rail entry at all: the nav reads the same for staff and investors.
  assert.doesNotMatch(shell, /"\/admin"/);
  assert.doesNotMatch(shell, /"\/operations"/);

  const profile = read("components/capital/north/ProfileView.tsx");
  assert.match(profile, /canUseWorkspace\(context, "operations"\)/);
  assert.match(profile, /\$\{NORTH_BASE\}\/admin/);
  // Gated on the operations workspace, so a non-staff profile never renders it.
  assert.match(profile, /\{staff && \(/);

  assert.throws(
    () => read("components/capital/north/OperationsInbox.tsx"),
    "the retired inbox should have been deleted, not left alongside the console",
  );
});

test("signing in never lands anyone in the console", () => {
  assert.doesNotMatch(read("lib/capital/portal-access.ts"), /return "\/admin"/);
});

test("admin directory views are read through the admin-gated api views", () => {
  const server = read("lib/capital/admin-server.ts");
  for (const view of [
    "admin_users",
    "admin_taxonomies",
    "admin_investment_interests",
    "admin_email_delivery",
    "admin_legal_documents",
  ]) {
    assert.match(server, new RegExp(`from\\("${view}"\\)`), `${view} is never read`);
  }
});

test("the platform-role guard is enforced in SQL, not only in the console", () => {
  const migration = read("supabase/migrations/20260723200000_admin_console.sql");
  // Both lockout routes: removing the last admin, and revoking your own role.
  assert.match(migration, /At least one platform administrator must remain/);
  assert.match(migration, /You cannot remove your own platform administrator role/);
  // The service role keeps an escape hatch so a real lockout can be repaired.
  assert.match(migration, /not p_enabled and not v_is_service_role/);
});

test("views over the private schema are gated by the admin predicate", () => {
  const migration = read("supabase/migrations/20260723200000_admin_console.sql");
  // admin_users and admin_email_delivery cannot use security_invoker — they read
  // auth.users and private.email_jobs — so the WHERE clause is the only gate.
  const gated = migration.split("create view api.admin_email_delivery")[1] ?? "";
  assert.match(gated, /where \(select private\.is_hunter_admin\(\)\)/);
  assert.match(migration, /create view api\.admin_users as[\s\S]*?where \(select private\.is_hunter_admin\(\)\)/);
  assert.match(migration, /revoke all on api\.admin_users from public, anon/);
  assert.match(migration, /revoke all on api\.admin_email_delivery from public, anon/);
});
