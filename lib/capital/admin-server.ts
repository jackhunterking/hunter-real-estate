import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LocalizedText } from "./types";

/**
 * Server-side reads for the Admin console's directory sections.
 *
 * Every one of these views is admin-gated in SQL (`where private.is_hunter_admin()`),
 * so a non-admin gets an empty array rather than an error — the UI renders its
 * empty state and nothing leaks. Each loader returns `[]` on error for the same
 * reason: one dropped table must not take the whole console down, which is the
 * failure mode `loadPortalSnapshot` has hit before.
 */

export type AdminUserRow = {
  userId: string;
  displayName: string;
  email: string;
  accountStatus: string;
  accountIntent: string | null;
  onboardingStatus: string | null;
  investorAccountType: string | null;
  investorQualificationCategory: string | null;
  emailVerified: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  platformRoles: string[];
  partnerIsActive: boolean;
  partnerApplicationStatus: string | null;
  licenseVerificationStatus: string | null;
};

export type AdminTaxonomyRow = {
  id: string;
  kind: string;
  key: string;
  label: LocalizedText;
  color: string | null;
  sortOrder: number;
  usageCount: number;
};

/** A directory section that is a plain table of records. */
export type AdminRecordRow = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string | null;
  details: Record<string, string | number | null | undefined>;
};

export type AdminDirectories = {
  users: AdminUserRow[];
  taxonomies: AdminTaxonomyRow[];
  interests: AdminRecordRow[];
  memberships: AdminRecordRow[];
  email: AdminRecordRow[];
  legal: AdminRecordRow[];
};

const EMPTY: AdminDirectories = {
  users: [], taxonomies: [], interests: [], memberships: [], email: [], legal: [],
};

export async function loadAdminDirectories(): Promise<AdminDirectories> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return EMPTY;

  const [users, taxonomies, interests, memberships, email, legal] = await Promise.all([
    supabase.from("admin_users").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_taxonomies").select("*").order("kind").order("sort_order"),
    supabase.from("admin_investment_interests").select("*").order("created_at", { ascending: false }).limit(250),
    supabase.from("admin_firm_memberships").select("*").order("requested_at", { ascending: false }).limit(250),
    supabase.from("admin_email_delivery").select("*").order("created_at", { ascending: false }).limit(250),
    supabase.from("admin_legal_documents").select("*").order("effective_at", { ascending: false }).limit(250),
  ]);

  return {
    users: (users.data ?? []).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
      accountStatus: row.account_status,
      accountIntent: row.account_intent,
      onboardingStatus: row.onboarding_status,
      investorAccountType: row.investor_account_type,
      investorQualificationCategory: row.investor_qualification_category,
      emailVerified: row.email_verified,
      lastSignInAt: row.last_sign_in_at,
      createdAt: row.created_at,
      platformRoles: row.platform_roles ?? [],
      partnerIsActive: row.partner_is_active,
      partnerApplicationStatus: row.partner_application_status,
      licenseVerificationStatus: row.license_verification_status,
    })),
    taxonomies: (taxonomies.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      key: row.key,
      label: (row.label ?? { en: "", tr: "" }) as unknown as LocalizedText,
      color: row.color,
      sortOrder: row.sort_order,
      usageCount: Number(row.usage_count ?? 0),
    })),
    interests: (interests.data ?? []).map((row) => ({
      id: row.id,
      title: row.display_name ?? row.email ?? row.user_id,
      subtitle: row.offering_id,
      status: row.status,
      date: row.created_at,
      details: {
        Investor: row.display_name, Email: row.email, Investment: row.offering_id,
        Message: row.message, "Preferred channel": row.preferred_channel,
        "Contact consent": row.contact_consent_at, "Reviewer notes": row.reviewer_notes,
      },
    })),
    memberships: (memberships.data ?? []).map((row) => ({
      id: row.id,
      title: row.display_name ?? row.registered_name ?? row.work_email ?? row.id,
      subtitle: row.organization_name ?? row.organization_id,
      status: row.status,
      date: row.requested_at,
      details: {
        Firm: row.organization_name, Roles: (row.roles ?? []).join(", "),
        "Work email": row.work_email, "Licence type": row.licence_type,
        "Licence number": row.masked_licence_number,
        "Verification": row.verification_status,
        Approved: row.approved_at, Ended: row.ended_at,
      },
    })),
    email: (email.data ?? []).map((row) => ({
      id: row.id,
      title: row.recipient,
      subtitle: `${row.category} · ${row.template_key}`,
      status: row.status,
      date: row.created_at,
      details: {
        Category: row.category, Template: row.template_key, Status: row.status,
        Attempts: row.attempt_count, "Last error": row.last_error_code,
        Sent: row.sent_at, Delivered: row.delivered_at, Failed: row.failed_at,
        Suppressed: row.suppression_reason,
      },
    })),
    legal: (legal.data ?? []).map((row) => ({
      id: row.id,
      title: `${row.document_key} · v${row.version}`,
      subtitle: row.language,
      status: row.status,
      date: row.effective_at,
      details: {
        Document: row.document_key, Language: row.language, Version: row.version,
        Effective: row.effective_at, Published: row.published_at, Withdrawn: row.withdrawal_at,
      },
    })),
  };
}
