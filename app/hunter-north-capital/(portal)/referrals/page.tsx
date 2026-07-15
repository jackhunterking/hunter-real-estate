import { redirect } from "next/navigation";

function toQueryString(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export default async function HunterNorthReferralsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.new === "1") {
    const { new: _new, ...rest } = params;
    void _new;
    redirect(`/hunter-north-capital/clients/new${toQueryString(rest)}`);
  }
  redirect(`/hunter-north-capital/clients${toQueryString(params)}`);
}
