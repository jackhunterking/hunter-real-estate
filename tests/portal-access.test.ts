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
} from "../lib/capital/portal-access.ts";
import {
  DEMO_PERSONA_USER_IDS,
  demoUserForPersona,
  initialPortalDataset,
} from "./fixtures/portal-personas.ts";

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
  assert.equal(canAccessPath(firmAdmin, "/hunter-advisory/firm/members"), true);
  assert.equal(canAccessPath(firmAdmin, "/hunter-advisory/clients"), false);
  assert.equal(canAccessPath(firmAdmin, "/hunter-advisory/partner-program"), false);
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
  assert.deepEqual(availableWorkspaces(admin), ["investor", "professional", "operations"]);
  assert.equal(canAccessPath(admin, "/hunter-advisory/admin"), true);
  assert.equal(canAccessPath(admin, "/hunter-advisory/admin/license-verifications"), true);
  // /operations survives only as a redirect into the console.
  assert.equal(canAccessPath(admin, "/hunter-advisory/operations"), true);
  assert.equal(canAccessPath(admin, "/hunter-advisory/portfolio"), true);
  assert.equal(canAccessPath(admin, "/hunter-advisory/clients"), true);

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
  assert.equal(canAccessPath(context("partner"), "/hunter-advisory/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("investor"), "/hunter-advisory/resources/investor-readiness"), true);
  assert.equal(canAccessPath(context("applicant"), "/hunter-advisory/resources/investor-readiness"), true);
  // Staff can open it too, now that master admins hold every workspace.
  assert.equal(canAccessPath(context("hnc-admin"), "/hunter-advisory/resources/investor-readiness"), true);
});

test("all resource routes are shared by investors and active professionals", () => {
  assert.equal(canAccessPath(context("investor"), "/hunter-advisory/resources/learning"), true);
  assert.equal(canAccessPath(context("partner"), "/hunter-advisory/resources/learning/core-strategies"), true);
  assert.equal(canAccessPath(context("hnc-admin"), "/hunter-advisory/resources/learning"), true);
});

test("the Admin console is closed to everyone without the operations workspace", () => {
  for (const persona of ["investor", "applicant", "partner", "firm-admin"] as const) {
    const who = context(persona);
    assert.equal(canAccessPath(who, "/hunter-advisory/admin"), false, `${persona} reached the console`);
    assert.equal(canAccessPath(who, "/hunter-advisory/admin?section=users"), false, `${persona} reached Users & roles`);
    assert.equal(canAccessPath(who, "/hunter-advisory/operations"), false, `${persona} reached the old route`);
  }
});

test("nobody lands in the console — staff open it from Profile", () => {
  assert.equal(defaultPortalPath(context("hnc-admin")), "/professional");
  assert.equal(defaultPortalPath(context("partner")), "/professional");
  assert.equal(defaultPortalPath(context("investor")), "/portfolio");
});

test("registry surnames retain submitted text while duplicate matching uses Turkish normalization", () => {
  assert.equal(normalizeRegistrySurname("  ışık  "), "IŞIK");
  assert.equal(normalizeRegistrySurname("Yıldız"), "YILDIZ");
});
