export function getSupabaseAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_WEB_SECRET_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}
