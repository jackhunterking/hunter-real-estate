import test from "node:test";
import assert from "node:assert/strict";
import {
  availableWorkspaces,
  canAccessPath,
  isPartnerActive,
  normalizeRegistrySurname,
  visibleCommissions,
  visibleMemberDirectory,
  type PortalAccessContext,
  type PortalDataset,
} from "../lib/capital/portal-access.ts";
import {
  DEMO_PERSONA_USER_IDS,
  demoUserForPersona,
  initialPortalDataset,
} from "../lib/capital/portal-demo.ts";

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
  assert.deepEqual(availableWorkspaces(active), ["investor", "partner"]);

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

test("firm administrators receive a limited member directory but no partner routes", () => {
  const firmAdmin = context("firm-admin");
  const directory = visibleMemberDirectory(firmAdmin);
  assert.ok(directory.length > 0);
  assert.equal(canAccessPath(firmAdmin, "/hunter-north-capital/firm/members"), true);
  assert.equal(canAccessPath(firmAdmin, "/hunter-north-capital/clients"), false);
  assert.equal(canAccessPath(firmAdmin, "/hunter-north-capital/partner-program"), false);
});

test("commission visibility follows the beneficiary instead of the firm association", () => {
  const partnerEntries = visibleCommissions(context("partner"));
  assert.deepEqual(
    partnerEntries.map((entry) => entry.id),
    ["commission-selin-1"],
  );

  const firmEntries = visibleCommissions(context("firm-admin"));
  assert.deepEqual(
    firmEntries.map((entry) => entry.id),
    ["commission-firm-1"],
  );

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

test("Hunter North administrators can review every workspace without changing firm privacy", () => {
  const admin = context("hnc-admin");
  assert.deepEqual(availableWorkspaces(admin), ["investor", "admin"]);
  assert.equal(canAccessPath(admin, "/hunter-north-capital/admin/license-verifications"), true);
  assert.equal(canAccessPath(admin, "/hunter-north-capital/clients"), true);
});

test("registry surnames retain submitted text while duplicate matching uses Turkish normalization", () => {
  assert.equal(normalizeRegistrySurname("  ışık  "), "IŞIK");
  assert.equal(normalizeRegistrySurname("Yıldız"), "YILDIZ");
});
