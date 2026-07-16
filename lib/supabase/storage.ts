"use client";

import { createSupabaseBrowserClient } from "./browser";

function safeFilename(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
}

export async function uploadPartnerCredential(userId: string, file: File) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const path = `${userId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const result = await supabase.storage
    .from("partner-credentials")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (result.error) throw result.error;
  return result.data.path;
}

export async function uploadInvestorDocument(
  userId: string,
  referralId: string,
  file: File,
) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const path = `${userId}/${referralId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const result = await supabase.storage
    .from("client-documents")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (result.error) throw result.error;
  return result.data.path;
}
