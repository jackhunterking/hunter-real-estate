import { LeadInbox } from "@/components/capital/north/LeadInbox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <LeadInbox initialLeads={[]} staff={[]} />;
  const [leads, staff] = await Promise.all([
    supabase.from("admin_leads").select("*").order("submitted_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("user_id,display_name,email").order("display_name").limit(100),
  ]);
  return (
    <LeadInbox
      initialLeads={(leads.data ?? []) as never[]}
      staff={(staff.data ?? []) as never[]}
    />
  );
}
