/**
 * HubSpot integration helpers
 *
 * Setup steps in HubSpot before this works:
 * 1. Settings → Integrations → Private Apps → Create a private app
 * 2. Name: "Jack Hunter Website Lead Capture"
 * 3. Scopes: crm.objects.contacts.read, crm.objects.contacts.write
 * 4. Copy the access token → add to .env as HUBSPOT_ACCESS_TOKEN
 *
 * Optional but recommended, create custom contact properties for clean segmentation:
 *  - lead_source (single-line text)
 *  - lead_type (dropdown: buyer, seller)
 *  - guide_requested (single-line text)
 */

type GuideType = "alici" | "satici";
type CapitalIntakeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  country: string;
  meetingPreference: string;
  preferredLanguage: string;
  investableRange: string;
  timeline: string;
  objective: string;
  riskComfort: string;
  investorStatus: string;
  interestedProducts: string[];
  message?: string;
};

interface CreateContactInput {
  email: string;
  guide: GuideType;
  source?: string;
  firstName?: string;
  lastName?: string;
}

const HUBSPOT_API = "https://api.hubapi.com";

export async function upsertContact(input: CreateContactInput): Promise<{
  ok: boolean;
  contactId?: string;
  error?: string;
}> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    console.warn("HUBSPOT_ACCESS_TOKEN not set, skipping HubSpot write");
    return { ok: false, error: "HubSpot not configured" };
  }

  const properties = {
    email: input.email,
    lead_source: input.source ?? "Instagram - ManyChat",
    lead_type: input.guide === "alici" ? "buyer" : "seller",
    guide_requested: input.guide === "alici" ? "Ev Alma Rehberi" : "Ev Satma Rehberi",
    hs_lead_status: "NEW",
    ...(input.firstName ? { firstname: input.firstName } : {}),
    ...(input.lastName ? { lastname: input.lastName } : {}),
  };

  try {
    // HubSpot's "create or update" pattern: try to create; on 409 (already exists), patch by email
    const createRes = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (createRes.ok) {
      const data = (await createRes.json()) as { id: string };
      return { ok: true, contactId: data.id };
    }

    if (createRes.status === 409) {
      // Contact exists, update by email
      const updateRes = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/contacts/${encodeURIComponent(input.email)}?idProperty=email`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ properties }),
        }
      );

      if (updateRes.ok) {
        const data = (await updateRes.json()) as { id: string };
        return { ok: true, contactId: data.id };
      }

      const errorText = await updateRes.text();
      return { ok: false, error: `HubSpot update failed: ${errorText}` };
    }

    const errorText = await createRes.text();
    return { ok: false, error: `HubSpot create failed: ${errorText}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown HubSpot error",
    };
  }
}

export async function upsertCapitalInvestor(
  input: CapitalIntakeInput
): Promise<{
  ok: boolean;
  contactId?: string;
  error?: string;
}> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    console.warn("HUBSPOT_ACCESS_TOKEN not set, skipping HubSpot write");
    return { ok: false, error: "HubSpot not configured" };
  }

  const properties = {
    email: input.email,
    firstname: input.firstName,
    lastname: input.lastName,
    phone: input.phone ?? "",
    city: input.city,
    country: input.country,
    lead_source: "Hunter North Capital",
    lead_type: "capital_investor",
    guide_requested: "Capital investor intake",
    hs_lead_status: "NEW",
  };

  try {
    const createRes = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (createRes.ok) {
      const data = (await createRes.json()) as { id: string };
      return { ok: true, contactId: data.id };
    }

    if (createRes.status === 409) {
      const updateRes = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/contacts/${encodeURIComponent(input.email)}?idProperty=email`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ properties }),
        }
      );

      if (updateRes.ok) {
        const data = (await updateRes.json()) as { id: string };
        return { ok: true, contactId: data.id };
      }

      const errorText = await updateRes.text();
      return { ok: false, error: `HubSpot update failed: ${errorText}` };
    }

    const errorText = await createRes.text();
    return { ok: false, error: `HubSpot create failed: ${errorText}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown HubSpot error",
    };
  }
}
