import test from "node:test";
import assert from "node:assert/strict";
import {
  availableWorkspaces,
  canAccessPath,
  defaultPortalPath,
  isPartnerActive,
  normalizeRegistrySurname,
  professionalProfileState,
  visibleCommissions,
  visibleMemberDirectory,
  type PortalAccessContext,
  type PortalDataset,
  type PortalWorkspace,
} from "../lib/capital/portal-access.ts";
import { PROFESSIONAL_WORKSPACE_ENABLED } from "../lib/capital/feature-flags.ts";
import {
  DEMO_PERSONA_USER_IDS,
  demoUserForPersona,
  initialPortalDataset,
} from "./fixtures/portal-personas.ts";

/**
 * The professional / partner middle layer is paused this phase, so
 * `canUseWorkspace` withholds it from everyone — staff included. That changes
 * which workspaces are *handed out*, not who has earned one: `isPartnerActive`,
 * `professionalProfileState` and every activation gate still run, and are
 * asserted directly below.
 *
 * Expectations that name the professional workspace go through this helper so
 * the suite states the same invariant in both states, and flipping
 * PROFESSIONAL_WORKSPACE_ENABLED back on needs no edit here.
 */
function granted(workspaces: PortalWorkspace[]) {
  return PROFESSIONAL_WORKSPACE_ENABLED
    ? workspaces
    : workspaces.filter((workspace) => workspace !== "professional");
}

function datasetCopy(): PortalDataset {
  return structuredClone(initialPortalDataset);
}

function context(
  persona: Parameters<typeof demoUserForPersona>[0],
  dataset = datasetCopy(),
): PortalAccessContext {
  return { user: demoUserForPersona(persona), dataset };
}

test("every verified user starts with investor access only unless another workspace is approved", () => {
  assert.deepEqual(availableWorkspaces(context("investor")), ["investor"]);
  assert.deepEqual(availableWorkspaces(context("applicant")), ["investor"]);
});

test("partner access requires application, SPL, firm, organization, and account gates together", () => {
  const active = context("partner");
  assert.equal(isPartnerActive(active), true);
  assert.deepEqual(availableWorkspaces(active), granted(["investor", "professional"]));

  const withoutFirm = datasetCopy();
  withoutFirm.affiliations = withoutFirm.affiliations.map((item) =>
    item.userId === DEMO_PERSONA_USER_IDS.partner
      ? { ...item, status: "pending_firm" }
      : item,
  );
  assert.equal(isPartnerActive(context("partner", withoutFirm)), false);

  const withoutLicence = datasetCopy();
  withoutLicence.licenseVerifications = withoutLicence.licenseVerifications.map((item) =>
    item.userId === DEMO_PERSONA_USER_IDS.partner
      ? { ...item, result: "suspended" }
      : item,
  );
  assert.equal(isPartnerActive(context("partner", withoutLicence)), false);
});

test("professional profile presentation covers every application and activation state", () => {
  assert.equal(professionalProfileState(context("investor")), "not_applied");
  assert.equal(professionalProfileState(context("applicant")), "in_review");
  assert.equal(professionalProfileState(context("partner")), "active");

  const actionRequired = datasetCopy();
  actionRequired.partnerApplications = actionRequired.partnerApplications.map((application) =>
    application.userId === DEMO_PERSONA_USER_IDS.applicant
      ? { ...application, status: "changes_requested" }
      : application,
  );
  assert.equal(
    professionalProfileState(context("applicant", actionRequired)),
    "action_required",
  );

  const rejected = datasetCopy();
  rejected.partnerApplications = rejected.partnerApplications.map((application) =>
    application.userId === DEMO_PERSONA_USER_IDS.applicant
      ? { ...application, status: "rejected" }
      : application,
  );
  assert.equal(
    professionalProfileState(context("applicant", rejected)),
    "action_required",
  );

  const approvedPending = datasetCopy();
  approvedPending.partnerApplications = approvedPending.partnerApplications.map((application) =>
    application.userId === DEMO_PERSONA_USER_IDS.applicant
      ? { ...application, status: "approved" }
      : application,
  );
  assert.equal(
    professionalProfileState(context("applicant", approvedPending)),
    "approved_pending_activation",
  );

  const inactive = datasetCopy();
  inactive.partnerAccounts = inactive.partnerAccounts.map((account) =>
    account.userId === DEMO_PERSONA_USER_IDS.partner
      ? { ...account, status: "suspended" }
      : account,
  );
  assert.equal(professionalProfileState(context("partner", inactive)), "inactive");
});

test("firm records remain internal and firm administrators receive no firm workspace", () => {
  const firmAdmin = context("firm-admin");
  const directory = visibleMemberDirectory(firmAdmin);
  assert.deepEqual(directory, []);
  assert.equal(canAccessPath(firmAdmin, "/equity-market/firm/members"), true);
  assert.equal(canAccessPath(firmAdmin, "/equity-market/clients"), false);
  assert.equal(canAccessPath(firmAdmin, "/equity-market/partner-program"), false);
});

test("commission visibility follows the beneficiary instead of the firm association", () => {
  const partnerEntries = visibleCommissions(context("partner"));
  assert.deepEqual(
    partnerEntries.map((entry) => entry.id),
    ["commission-selin-1"],
  );

  const firmEntries = visibleCommissions(context("firm-admin"));
  assert.deepEqual(firmEntries, []);

  const withVoidEntry = datasetCopy();
  withVoidEntry.commissions.push({
    ...withVoidEntry.commissions[0],
    id: "commission-void",
    status: "void",
  });
  assert.deepEqual(
    visibleCommissions(context("partner", withVoidEntry)).map((entry) => entry.id),
    ["commission-selin-1"],
  );
});

test("master admins can open every workspace, but that is visibility only — not partner status", () => {
  const admin = context("hnc-admin");
  // Changed deliberately: admins previously saw Operations alone and needed a
  // separate approval to open the investor or professional workspaces. Staff
  // now see all three, because operating the platform means being able to see
  // what each audience sees.
  assert.deepEqual(availableWorkspaces(admin), granted(["investor", "professional", "operations"]));
  assert.equal(canAccessPath(admin, "/equity-market/admin"), true);
  assert.equal(canAccessPath(admin, "/equity-market/admin/license-verifications"), true);
  // /operations survives only as a redirect into the console.
  assert.equal(canAccessPath(admin, "/equity-market/operations"), true);
  assert.equal(canAccessPath(admin, "/equity-market/portfolio"), true);
  // /clients is a professional route, so it closes with the middle layer.
  assert.equal(canAccessPath(admin, "/equity-market/clients"), PROFESSIONAL_WORKSPACE_ENABLED);

  // The load-bearing half: seeing the professional workspace must never imply
  // the admin is a licensed, firm-affiliated partner. Everything that acts on
  // partner status still refuses.
  assert.equal(isPartnerActive(admin), false, "an admin is not a partner");
  assert.equal(professionalProfileState(admin), "not_applied");
});

test("a suspended or unverified account opens nothing, even with the master admin role", () => {
  const suspended = context("hnc-admin");
  suspended.user = { ...suspended.user, accountStatus: "suspended" };
  assert.deepEqual(availableWorkspaces(suspended), []);

  const unverified = context("hnc-admin");
  unverified.user = { ...unverified.user, emailVerified: false };
  assert.deepEqual(availableWorkspaces(unverified), []);
});

test("investor qualification is available to verified investors and active professionals", () => {
  assert.equal(canAccessPath(context("partner"), "/equity-market/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("investor"), "/equity-market/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("applicant"), "/equity-market/resources/investor-readiness"), true);
  // Staff can open it too, now that master admins hold every workspace.
  assert.equal(canAccessPath(context("hnc-admin"), "/equity-market/resources/investor-readiness"), true);
});

test("all resource routes are shared by investors and active professionals", () => {
  assert.equal(canAccessPath(context("investor"), "/equity-market/resources/learning"), true);
  assert.equal(canAccessPath(context("partner"), "/equity-market/resources/learning/core-strategies"), true);
  assert.equal(canAccessPath(context("hnc-admin"), "/equity-market/resources/learning"), true);
});

test("the Admin console is closed to everyone without the operations workspace", () => {
  for (const persona of ["investor", "applicant", "partner", "firm-admin"] as const) {
    const who = context(persona);
    assert.equal(canAccessPath(who, "/equity-market/admin"), false, `${persona} reached the console`);
    assert.equal(canAccessPath(who, "/equity-market/admin?section=users"), false, `${persona} reached Users & roles`);
    assert.equal(canAccessPath(who, "/equity-market/operations"), false, `${persona} reached the old route`);
  }
});

test("nobody lands in the console — staff open it from Profile", () => {
  // While the middle layer is paused everyone lands in /portfolio; the point
  // that holds either way is that no one is dropped into /admin by signing in.
  const professionalLanding = PROFESSIONAL_WORKSPACE_ENABLED ? "/professional" : "/portfolio";
  assert.equal(defaultPortalPath(context("hnc-admin")), professionalLanding);
  assert.equal(defaultPortalPath(context("partner")), professionalLanding);
  assert.equal(defaultPortalPath(context("investor")), "/portfolio");
  for (const persona of ["hnc-admin", "partner", "investor"] as const) {
    assert.doesNotMatch(defaultPortalPath(context(persona)), /admin|operations/);
  }
});

test("registry surnames retain submitted text while duplicate matching uses Turkish normalization", () => {
  assert.equal(normalizeRegistrySurname("  ışık  "), "IŞIK");
  assert.equal(normalizeRegistrySurname("Yıldız"), "YILDIZ");
});
