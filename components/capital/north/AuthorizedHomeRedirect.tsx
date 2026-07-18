"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultPortalPath } from "@/lib/capital/portal-access";
import { usePortalAccess } from "./PortalAccessProvider";
import { NORTH_BASE } from "./NorthBrand";

export function AuthorizedHomeRedirect() {
  const router = useRouter();
  const { context } = usePortalAccess();
  useEffect(() => {
    router.replace(`${NORTH_BASE}${defaultPortalPath(context)}`);
  }, [context, router]);
  return <p className="p-8 text-sm text-[#65737e]">Redirecting…</p>;
}
