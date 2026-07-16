"use client";

import { useMemo, useState } from "react";
import { PageHeader, Panel } from "./PortalUI";

type Lead = {
  id: string;
  submission_type: string;
  status: string;
  source: string;
  assigned_to: string | null;
  follow_up_at: string | null;
  submitted_at: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
};

type Staff = { user_id: string; display_name: string; email: string };
const statuses = ["new", "reviewing", "contacted", "qualified", "converted", "closed", "spam"];

export function LeadInbox({ initialLeads, staff }: { initialLeads: Lead[]; staff: Staff[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [statusFilter, setStatusFilter] = useState("open");
  const [typeFilter, setTypeFilter] = useState("all");
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => leads.filter((lead) => {
    const statusMatch = statusFilter === "all" || (statusFilter === "open"
      ? !["converted", "closed", "spam"].includes(lead.status)
      : lead.status === statusFilter);
    return statusMatch && (typeFilter === "all" || lead.submission_type === typeFilter);
  }), [leads, statusFilter, typeFilter]);

  async function updateLead(lead: Lead, patch: Partial<Lead>) {
    const next = { ...lead, ...patch };
    const response = await fetch("/api/hnc-leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: next.id,
        status: next.status,
        assignedTo: next.assigned_to,
        followUpAt: next.follow_up_at,
      }),
    });
    if (!response.ok) return setMessage("Update failed.");
    setLeads((items) => items.map((item) => item.id === next.id ? next : item));
    setMessage("Lead updated.");
  }

  async function addNote(leadId: string) {
    const note = window.prompt("Internal note");
    if (!note) return;
    const response = await fetch("/api/hnc-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, note }),
    });
    setMessage(response.ok ? "Note added." : "Note could not be added.");
  }

  return (
    <div>
      <PageHeader eyebrow="Hunter North administration" title="Lead inbox" description="Assign, follow up, qualify, convert, or close durable Supabase submissions." />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="open">Open</option><option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">All submission types</option>
          <option value="guide">Guide</option><option value="capital_intake">Capital intake</option>
          <option value="investor_readiness">Investor readiness</option>
        </select>
        {message && <p className="self-center text-xs text-muted-foreground">{message}</p>}
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead><tr className="border-b bg-muted/40">{["Contact", "Type", "Source", "Status", "Assigned", "Follow up", "Submitted", "Actions"].map((item) => <th key={item} className="px-4 py-3 text-xs uppercase tracking-wide">{item}</th>)}</tr></thead>
          <tbody>{filtered.map((lead) => (
            <tr key={lead.id} className="border-b last:border-0">
              <td className="px-4 py-3"><strong>{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed"}</strong><div className="text-xs text-muted-foreground">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</div></td>
              <td className="px-4 py-3">{lead.submission_type.replaceAll("_", " ")}</td>
              <td className="px-4 py-3">{lead.source}</td>
              <td className="px-4 py-3"><select value={lead.status} onChange={(event) => updateLead(lead, { status: event.target.value })} className="rounded border px-2 py-1">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
              <td className="px-4 py-3"><select value={lead.assigned_to ?? ""} onChange={(event) => updateLead(lead, { assigned_to: event.target.value || null })} className="rounded border px-2 py-1"><option value="">Unassigned</option>{staff.map((user) => <option key={user.user_id} value={user.user_id}>{user.display_name || user.email}</option>)}</select></td>
              <td className="px-4 py-3"><input type="datetime-local" value={lead.follow_up_at?.slice(0, 16) ?? ""} onChange={(event) => updateLead(lead, { follow_up_at: event.target.value ? new Date(event.target.value).toISOString() : null })} className="rounded border px-2 py-1" /></td>
              <td className="px-4 py-3">{new Date(lead.submitted_at).toLocaleDateString()}</td>
              <td className="px-4 py-3"><button type="button" onClick={() => addNote(lead.id)} className="rounded border px-3 py-1.5 font-semibold">Add note</button></td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>
    </div>
  );
}
