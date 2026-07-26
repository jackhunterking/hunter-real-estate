"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultPortalPath } from "@/lib/equity-market/portal-access";
import { usePortalAccess } from "./PortalAccessProvider";
import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

export function AuthorizedHomeRedirect() {
  const router = useRouter();
  const { context } = usePortalAccess();
  useEffect(() => {
    router.replace(`${INVESTMENT_BASE_PATH}${defaultPortalPath(context)}`);
  }, [context, router]);
  return <p className="p-8 text-sm text-[#65737e]">Redirecting…</p>;
}
