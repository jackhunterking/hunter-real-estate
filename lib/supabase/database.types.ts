// Generated from the hosted `api` schema and referenced `app` enums through
// the authenticated Supabase MCP connection.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EmptySchema = {
  Tables: { [_ in never]: never };
  Views: { [_ in never]: never };
  Functions: { [_ in never]: never };
  Enums: { [_ in never]: never };
  CompositeTypes: { [_ in never]: never };
};

type ApiView<Row> = {
  Row: Row;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: EmptySchema;
  app: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      account_intent: "investor" | "turkiye_licensed_professional_or_firm";
      commission_beneficiary_type: "representative" | "organization";
      commission_status: "draft" | "approved" | "paid" | "void";
      document_access:
        | "private_user"
        | "approved_partner"
        | "organization_assigned"
        | "internal";
      email_deliverability_status:
        | "unknown"
        | "deliverable"
        | "bounced"
        | "complained"
        | "suppressed";
      email_job_status:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "delayed"
        | "failed"
        | "bounced"
        | "complained"
        | "suppressed"
        | "cancelled";
      firm_affiliation_status:
        | "pending_firm"
        | "approved_by_firm"
        | "approved_by_hnc_fallback"
        | "rejected"
        | "suspended"
        | "ended";
      firm_membership_role:
        | "representative"
        | "membership_admin"
        | "finance_admin";
      firm_offering_status:
        | "proposed"
        | "due_diligence"
        | "approved"
        | "on_shelf"
        | "paused";
      investment_application_status:
        | "draft"
        | "submitted"
        | "compliance_review"
        | "approved_for_subscription"
        | "accepted"
        | "funded"
        | "declined"
        | "withdrawn"
        | "closed";
      investment_interest_status: "new" | "contacted" | "qualified" | "closed";
      investor_account_type: "individual" | "entity";
      onboarding_status: "pending" | "completed";
      contact_channel: "email" | "phone" | "whatsapp";
      lead_status:
        | "new"
        | "reviewing"
        | "contacted"
        | "qualified"
        | "converted"
        | "closed"
        | "spam";
      lead_submission_type: "guide" | "capital_intake" | "investor_readiness";
      license_verification_status:
        | "pending"
        | "verified"
        | "mismatch"
        | "not_found"
        | "suspended"
        | "expired"
        | "revoked"
        | "manual_review";
      membership_status: "pending" | "active" | "suspended" | "ended";
      organization_status: "pending" | "active" | "suspended" | "terminated";
      partner_account_status:
        | "pending"
        | "active"
        | "suspended"
        | "expired"
        | "terminated";
      partner_application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "changes_requested"
        | "approved"
        | "rejected";
      partner_tier: "associate" | "principal" | "managing_partner";
      platform_role: "compliance_admin" | "finance_admin" | "platform_admin";
      publication_status:
        | "draft"
        | "in_review"
        | "approved"
        | "published"
        | "superseded"
        | "withdrawn";
    };
    CompositeTypes: { [_ in never]: never };
  };
  api: {
    Tables: { [_ in never]: never };
    Views: {
      admin_leads: ApiView<{
        id: string;
        submission_type: Database["app"]["Enums"]["lead_submission_type"];
        status: Database["app"]["Enums"]["lead_status"];
        source: string;
        assigned_to: string | null;
        follow_up_at: string | null;
        submitted_at: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        preferred_language: string | null;
        country: string | null;
        city: string | null;
        email_deliverability: Database["app"]["Enums"]["email_deliverability_status"];
      }>;
      audit_events: ApiView<{
        id: string;
        actor_user_id: string;
        action: string;
        entity_type: string;
        entity_id: string;
        summary: string;
        before_state: Json | null;
        after_state: Json | null;
        request_id: string | null;
        occurred_at: string;
      }>;
      commission_entries: ApiView<{
        id: string;
        beneficiary_type: Database["app"]["Enums"]["commission_beneficiary_type"];
        beneficiary_user_id: string | null;
        beneficiary_organization_id: string | null;
        introducing_representative_id: string;
        referral_id: string | null;
        redacted_referral_reference: string;
        offering_id: string;
        gross_distribution_commission_amount: number;
        allocation_percentage: number;
        tier_at_funding: Database["app"]["Enums"]["partner_tier"];
        amount: number;
        currency: string;
        earning_period: string;
        funded_at: string;
        distribution_commission_received_at: string;
        description: string;
        status: Database["app"]["Enums"]["commission_status"];
        approved_by: string | null;
        approved_at: string | null;
        paid_at: string | null;
        payment_reference: string | null;
        created_by: string;
        created_at: string;
        updated_at: string;
        fund_commission_schedule_id: string | null;
      }>;
      document_records: ApiView<{
        id: string;
        owner_user_id: string | null;
        organization_id: string | null;
        partner_application_id: string | null;
        referral_id: string | null;
        bucket_id: string;
        storage_path: string;
        filename: string;
        document_category: string | null;
        mime_type: string | null;
        byte_size: number | null;
        access: Database["app"]["Enums"]["document_access"];
        created_at: string;
      }>;
      firm_affiliations: ApiView<{
        id: string;
        organization_id: string;
        user_id: string;
        status: Database["app"]["Enums"]["firm_affiliation_status"];
        is_primary: boolean;
        approved_by: string | null;
        approval_reason: string | null;
        approved_at: string | null;
        ended_at: string | null;
        created_at: string;
      }>;
      firm_membership_directory: ApiView<{
        id: string;
        organization_id: string;
        user_id: string;
        registered_name: string;
        work_email: string;
        licence_type: string | null;
        masked_licence_number: string | null;
        verification_status: Database["app"]["Enums"]["license_verification_status"];
        status: Database["app"]["Enums"]["membership_status"];
        roles: Database["app"]["Enums"]["firm_membership_role"][];
        requested_at: string;
        approved_at: string | null;
        ended_at: string | null;
      }>;
      fund_commission_schedules: ApiView<{
        id: string;
        offering_id: string;
        gross_commission_bps: number;
        status: Database["app"]["Enums"]["publication_status"];
        effective_from: string;
        effective_to: string | null;
        published_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      investment_applications: ApiView<{
        id: string;
        user_id: string;
        offering_id: string;
        amount: number;
        account_type: Database["app"]["Enums"]["investor_account_type"] | null;
        preferred_contact_channel: Database["app"]["Enums"]["contact_channel"] | null;
        contact_consent_at: string | null;
        note: string | null;
        submitted_at: string | null;
        status: Database["app"]["Enums"]["investment_application_status"];
        created_at: string;
        updated_at: string;
        client_id: string | null;
        share_class_id: string | null;
        share_quantity: number | null;
        account_preference: string | null;
        consent_snapshot: Json;
      }>;
      investment_interest_requests: ApiView<{
        id: string;
        user_id: string;
        offering_id: string;
        message: string | null;
        preferred_channel: Database["app"]["Enums"]["contact_channel"];
        contact_consent_at: string;
        status: Database["app"]["Enums"]["investment_interest_status"];
        created_at: string;
        updated_at: string;
      }>;
      operations_queue: ApiView<{
        id: string;
        module: string;
        title: string;
        summary: string;
        status: string;
        occurred_at: string;
        required_role: string;
        payload: Json;
      }>;
      license_verification_events: ApiView<{
        id: string;
        application_id: string;
        user_id: string;
        queried_licence_number: string;
        queried_registry_last_name: string;
        source_url: string;
        result: Database["app"]["Enums"]["license_verification_status"];
        returned_licence_types: string[];
        returned_status: string | null;
        renewal_information: string | null;
        employment_information: string | null;
        reviewer_id: string;
        reviewer_notes: string | null;
        evidence_storage_path: string | null;
        verified_at: string;
      }>;
      organization_offering_access: ApiView<{
        id: string;
        organization_id: string;
        offering_id: string;
        status: Database["app"]["Enums"]["firm_offering_status"];
        effective_at: string | null;
        paused_at: string | null;
        assigned_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      organization_private_details: ApiView<{
        organization_id: string;
        spk_registration: string | null;
        registered_address: string | null;
        authorized_contact: string | null;
        compliance_contact: string | null;
        reviewer_notes: string | null;
        updated_at: string;
      }>;
      organizations: ApiView<{
        id: string;
        legal_name: string;
        trading_name: string | null;
        firm_type: string;
        website: string | null;
        business_domain: string | null;
        status: Database["app"]["Enums"]["organization_status"];
        created_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      partner_accounts: ApiView<{
        id: string;
        user_id: string;
        organization_id: string;
        status: Database["app"]["Enums"]["partner_account_status"];
        tier: Database["app"]["Enums"]["partner_tier"];
        annual_cleared_capital: number;
        relationship_since: string | null;
        created_at: string;
        updated_at: string;
      }>;
      partner_applications: ApiView<{
        id: string;
        user_id: string;
        organization_id: string;
        registered_first_names: string;
        registry_last_name: string;
        normalized_registry_last_name: string;
        licence_document_number: string;
        licence_type: string;
        professional_title: string;
        firm_work_email: string;
        evidence_storage_path: string | null;
        lookup_consent_at: string;
        accuracy_consent_at: string;
        status: Database["app"]["Enums"]["partner_application_status"];
        submitted_at: string | null;
        reviewed_by: string | null;
        reviewed_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      platform_role_assignments: ApiView<{
        id: string;
        user_id: string;
        role: Database["app"]["Enums"]["platform_role"];
        assigned_by: string | null;
        assigned_at: string;
      }>;
      profiles: ApiView<{
        user_id: string;
        first_name: string;
        middle_names: string | null;
        last_name: string;
        display_name: string;
        email: string;
        locale: string;
        account_status: string;
        account_intent: Database["app"]["Enums"]["account_intent"] | null;
        investor_account_type: Database["app"]["Enums"]["investor_account_type"] | null;
        onboarding_status: Database["app"]["Enums"]["onboarding_status"];
        residence_jurisdiction: string | null;
        investment_objective: string | null;
        time_horizon: string | null;
        risk_acknowledged_at: string | null;
        contact_consent_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      learning_resource_admin: ApiView<{
        id: string;
        slug: string;
        resource_type: string;
        category_key: string;
        audience: string;
        current_version_id: string | null;
        version_id: string;
        version: number;
        status: Database["app"]["Enums"]["publication_status"];
        title: Json;
        summary: Json;
        body_markdown: Json;
        disclaimer: Json;
        reading_minutes: Json;
        author_id: string;
        reviewer_id: string | null;
        compliance_owner_id: string | null;
        review_notes: string | null;
        reviewed_at: string | null;
        effective_at: string | null;
        published_at: string | null;
        withdrawal_at: string | null;
        created_at: string;
        sources: Json;
      }>;
      published_guide_assets: ApiView<{
        guide_key: string;
        language: string;
        version: string;
        bucket_id: string;
        storage_path: string;
      }>;
      published_offerings: ApiView<{
        id: string;
        slug: string;
        manager_id: string;
        version_id: string;
        version: string;
        content_snapshot: Json;
        effective_at: string;
        published_at: string | null;
      }>;
      published_learning_resources: ApiView<{
        id: string;
        slug: string;
        resource_type: string;
        category_key: string;
        audience: string;
        version_id: string;
        version: number;
        title: Json;
        summary: Json;
        body_markdown: Json;
        disclaimer: Json;
        reading_minutes: Json;
        effective_at: string;
        published_at: string | null;
        reviewed_at: string;
        sources: Json;
      }>;
      referral_qualification_assessments: ApiView<{
        id: string;
        referral_id: string;
        assessor_user_id: string;
        jurisdiction: string;
        account_type: string;
        answers: Json;
        result: string;
        financial_result: string | null;
        jurisdiction_review: string | null;
        residence_country_code: string | null;
        residence_region_code: string | null;
        qualifying_criteria: Json;
        om_context: Json;
        candidate_routes: Json;
        review_reasons: Json;
        om_calculation: Json;
        assessment_input: Json;
        ruleset_id: string;
        source_urls: Json;
        reassessment_triggers: Json;
        acknowledgement_at: string;
        created_at: string;
      }>;
      referrals: ApiView<{
        id: string;
        owner_user_id: string;
        firm_id: string;
        client_account_type: "individual" | "entity";
        client_first_name: string;
        client_last_name: string;
        client_display_name: string;
        client_organization: string | null;
        client_email: string;
        client_phone: string | null;
        country: string;
        region: string | null;
        city: string | null;
        offering_id: string | null;
        indicative_amount: number | null;
        status:
          | "introduced"
          | "contacted"
          | "compliance-review"
          | "accepted"
          | "funded";
        contact_consent_at: string;
        accuracy_consent_at: string;
        created_at: string;
        updated_at: string;
      }>;
    };
    Functions: {
      add_lead_note: {
        Args: { p_lead_id: string; p_note: string };
        Returns: string;
      };
      complete_hnc_onboarding: {
        Args: {
          p_account_intent: Database["app"]["Enums"]["account_intent"];
          p_investor_account_type: Database["app"]["Enums"]["investor_account_type"] | null;
          p_residence_jurisdiction: string;
          p_investment_objective: string;
          p_time_horizon: string;
          p_risk_acknowledged: boolean;
          p_contact_consent: boolean;
        };
        Returns: undefined;
      };
      create_learning_resource: {
        Args: { p_input: Json };
        Returns: Json;
      };
      create_referral_qualification_assessment: {
        Args: { p_referral_id: string; p_input: Json };
        Returns: string;
      };
      create_investment_interest: {
        Args: {
          p_offering_id: string;
          p_message: string;
          p_preferred_channel: Database["app"]["Enums"]["contact_channel"];
          p_contact_consent: boolean;
        };
        Returns: string;
      };
      create_investment_request: {
        Args: {
          p_offering_id: string;
          p_amount: number;
          p_account_type: Database["app"]["Enums"]["investor_account_type"];
          p_preferred_contact_method: Database["app"]["Enums"]["contact_channel"];
          p_contact_consent: boolean;
          p_note: string;
        };
        Returns: string;
      };
      create_fund_commission_schedule: {
        Args: {
          p_offering_id: string;
          p_gross_commission_bps: number;
          p_effective_from: string;
          p_internal_note?: string | null;
        };
        Returns: string;
      };
      publish_fund_commission_schedule: {
        Args: { p_schedule_id: string };
        Returns: undefined;
      };
      list_fund_commission_schedules_admin: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          offering_id: string;
          gross_commission_bps: number;
          status: Database["app"]["Enums"]["publication_status"];
          effective_from: string;
          effective_to: string | null;
          internal_note: string | null;
          created_by: string;
          published_by: string | null;
          published_at: string | null;
          superseded_by: string | null;
          created_at: string;
          updated_at: string;
        }>;
      };
      list_investment_interest_admin: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          user_id: string;
          offering_id: string;
          message: string | null;
          preferred_channel: Database["app"]["Enums"]["contact_channel"];
          status: Database["app"]["Enums"]["investment_interest_status"];
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        }>;
      };
      assign_firm_membership_roles: {
        Args: {
          p_membership_id: string;
          p_roles: Database["app"]["Enums"]["firm_membership_role"][];
          p_reason: string;
        };
        Returns: undefined;
      };
      claim_email_jobs: {
        Args: { p_limit?: number };
        Returns: { id: string }[];
      };
      create_commission_entry: {
        Args: {
          p_beneficiary_type: Database["app"]["Enums"]["commission_beneficiary_type"];
          p_beneficiary_user_id: string | null;
          p_beneficiary_organization_id: string | null;
          p_introducing_representative_id: string;
          p_referral_id: string | null;
          p_redacted_referral_reference: string;
          p_offering_id: string;
          p_gross_distribution_commission_amount: number;
          p_currency: string;
          p_earning_period: string;
          p_funded_at: string;
          p_distribution_commission_received_at: string;
          p_description: string;
          p_status?: Database["app"]["Enums"]["commission_status"];
        };
        Returns: string;
      };
      create_referral: {
        Args: {
          p_client_account_type: string;
          p_client_first_name: string;
          p_client_last_name: string;
          p_client_display_name: string;
          p_client_organization: string | null;
          p_client_email: string;
          p_client_phone: string | null;
          p_country: string;
          p_region: string | null;
          p_city: string | null;
          p_offering_id: string | null;
          p_indicative_amount: number | null;
        };
        Returns: string;
      };
      decide_firm_membership: {
        Args: {
          p_membership_id: string;
          p_decision: string;
          p_fallback_reason?: string | null;
          p_evidence_storage_path?: string | null;
        };
        Returns: undefined;
      };
      decide_organization: {
        Args: {
          p_organization_id: string;
          p_status: Database["app"]["Enums"]["organization_status"];
          p_reason: string;
        };
        Returns: undefined;
      };
      get_email_job: {
        Args: { p_job_id: string };
        Returns: Json;
      };
      mark_email_job_failed: {
        Args: { p_job_id: string; p_reason: string };
        Returns: undefined;
      };
      mark_email_job_sent: {
        Args: { p_job_id: string; p_resend_email_id: string };
        Returns: undefined;
      };
      mark_referral_contacted: {
        Args: { p_referral_id: string };
        Returns: undefined;
      };
      record_license_verification: {
        Args: {
          p_application_id: string;
          p_result: Database["app"]["Enums"]["license_verification_status"];
          p_returned_licence_types: string[];
          p_returned_status: string;
          p_renewal_information?: string | null;
          p_employment_information?: string | null;
          p_reviewer_notes?: string | null;
          p_evidence_storage_path?: string | null;
        };
        Returns: string;
      };
      record_resend_event: {
        Args: {
          p_event_id: string;
          p_event_type: string;
          p_event_at: string;
          p_resend_email_id: string;
          p_recipient: string | null;
          p_event_data: Json;
        };
        Returns: undefined;
      };
      register_referral_document: {
        Args: {
          p_referral_id: string;
          p_storage_path: string;
          p_filename: string;
          p_document_category: string;
          p_mime_type: string;
          p_byte_size: number;
        };
        Returns: string;
      };
      set_commission_status: {
        Args: {
          p_commission_id: string;
          p_status: Database["app"]["Enums"]["commission_status"];
          p_payment_reference?: string | null;
        };
        Returns: undefined;
      };
      set_platform_role: {
        Args: {
          p_user_id: string;
          p_role: Database["app"]["Enums"]["platform_role"];
          p_enabled: boolean;
        };
        Returns: undefined;
      };
      set_investment_interest_status: {
        Args: {
          p_interest_id: string;
          p_status: Database["app"]["Enums"]["investment_interest_status"];
          p_reviewer_notes: string;
        };
        Returns: undefined;
      };
      submit_capital_intake: {
        Args: { p_input: Json };
        Returns: Json;
      };
      submit_guide_request: {
        Args: { p_input: Json };
        Returns: Json;
      };
      submit_investor_readiness: {
        Args: { p_input: Json };
        Returns: Json;
      };
      submit_partner_application: {
        Args: {
          p_organization_id: string | null;
          p_registered_first_names: string;
          p_registry_last_name: string;
          p_normalized_registry_last_name: string;
          p_licence_document_number: string;
          p_licence_type: string;
          p_professional_title: string;
          p_firm_work_email: string;
          p_evidence_storage_path?: string | null;
          p_new_firm_legal_name?: string | null;
          p_new_firm_trading_name?: string | null;
          p_new_firm_type?: string | null;
          p_new_firm_website?: string | null;
          p_new_firm_business_domain?: string | null;
          p_new_firm_spk_registration?: string | null;
          p_new_firm_registered_address?: string | null;
          p_new_firm_authorized_contact?: string | null;
          p_new_firm_compliance_contact?: string | null;
          p_new_firm_evidence_storage_path?: string | null;
        };
        Returns: string;
      };
      transition_learning_resource: {
        Args: {
          p_resource_id: string;
          p_version_id: string;
          p_action: string;
          p_note?: string | null;
        };
        Returns: Json;
      };
      update_learning_resource_draft: {
        Args: { p_resource_id: string; p_version_id: string; p_input: Json };
        Returns: undefined;
      };
      update_lead: {
        Args: {
          p_lead_id: string;
          p_status: Database["app"]["Enums"]["lead_status"];
          p_assigned_to: string | null;
          p_follow_up_at: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals["api"];

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName] extends {
  Row: infer Row;
}
  ? Row
  : never;

export type Enums<
  EnumName extends keyof DatabaseWithoutInternals["app"]["Enums"],
> = DatabaseWithoutInternals["app"]["Enums"][EnumName];

export const Constants = {
  app: {
    Enums: {
      commission_beneficiary_type: ["representative", "organization"],
      commission_status: ["draft", "approved", "paid", "void"],
      document_access: [
        "private_user",
        "approved_partner",
        "organization_assigned",
        "internal",
      ],
      email_deliverability_status: [
        "unknown",
        "deliverable",
        "bounced",
        "complained",
        "suppressed",
      ],
      email_job_status: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "delayed",
        "failed",
        "bounced",
        "complained",
        "suppressed",
        "cancelled",
      ],
      firm_affiliation_status: [
        "pending_firm",
        "approved_by_firm",
        "approved_by_hnc_fallback",
        "rejected",
        "suspended",
        "ended",
      ],
      firm_membership_role: [
        "representative",
        "membership_admin",
        "finance_admin",
      ],
      firm_offering_status: [
        "proposed",
        "due_diligence",
        "approved",
        "on_shelf",
        "paused",
      ],
      investment_application_status: [
        "draft",
        "submitted",
        "compliance_review",
        "approved_for_subscription",
        "accepted",
        "funded",
        "declined",
        "withdrawn",
        "closed",
      ],
      lead_status: [
        "new",
        "reviewing",
        "contacted",
        "qualified",
        "converted",
        "closed",
        "spam",
      ],
      lead_submission_type: ["guide", "capital_intake", "investor_readiness"],
      license_verification_status: [
        "pending",
        "verified",
        "mismatch",
        "not_found",
        "suspended",
        "expired",
        "revoked",
        "manual_review",
      ],
      membership_status: ["pending", "active", "suspended", "ended"],
      organization_status: ["pending", "active", "suspended", "terminated"],
      partner_account_status: [
        "pending",
        "active",
        "suspended",
        "expired",
        "terminated",
      ],
      partner_application_status: [
        "draft",
        "submitted",
        "under_review",
        "changes_requested",
        "approved",
        "rejected",
      ],
      partner_tier: ["associate", "principal", "managing_partner"],
      platform_role: ["compliance_admin", "finance_admin", "platform_admin"],
      publication_status: [
        "draft",
        "in_review",
        "approved",
        "published",
        "superseded",
        "withdrawn",
      ],
    },
  },
} as const;
