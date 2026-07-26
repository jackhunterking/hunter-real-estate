import { redirect } from "next/navigation";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

export const dynamic = "force-dynamic";

export default async function EquityMarketProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`${INVESTMENT_BASE_PATH}/investments/${slug}`);
}
