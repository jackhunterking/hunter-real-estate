import test from "node:test";
import assert from "node:assert/strict";
import {
  availableWorkspaces,
  canAccessPath,
  isPartnerActive,
  normalizeRegistrySurname,
  professionalProfileState,
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
  assert.deepEqual(availableWorkspaces(active), ["investor", "professional"]);

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

test("Hunter North administrators start in Operations and require separate investing or professional approval", () => {
  const admin = context("hnc-admin");
  assert.deepEqual(availableWorkspaces(admin), ["operations"]);
  assert.equal(canAccessPath(admin, "/hunter-north-capital/admin/license-verifications"), true);
  assert.equal(canAccessPath(admin, "/hunter-north-capital/operations"), true);
  assert.equal(canAccessPath(admin, "/hunter-north-capital/portfolio"), false);
  assert.equal(canAccessPath(admin, "/hunter-north-capital/clients"), false);
});

test("investor qualification is available to verified investors and active professionals", () => {
  assert.equal(canAccessPath(context("partner"), "/hunter-north-capital/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("investor"), "/hunter-north-capital/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("applicant"), "/hunter-north-capital/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("hnc-admin"), "/hunter-north-capital/resources/investor-readiness"), false);
});

test("registry surnames retain submitted text while duplicate matching uses Turkish normalization", () => {
  assert.equal(normalizeRegistrySurname("  ışık  "), "IŞIK");
  assert.equal(normalizeRegistrySurname("Yıldız"), "YILDIZ");
});
