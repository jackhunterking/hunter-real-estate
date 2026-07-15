import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HunterNorthProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/hunter-north-capital/funds/${slug}`);
}
