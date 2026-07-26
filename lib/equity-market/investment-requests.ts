import type { InvestmentApplication } from "./portal-access";

export type RequestStage = "in-review" | "complete";

export function requestStage(status: InvestmentApplication["status"]): RequestStage {
  if (["funded", "declined", "withdrawn", "closed"].includes(status)) return "complete";
  return "in-review";
}

export function requestOutcome(status: InvestmentApplication["status"]): "funded" | "closed" | null {
  if (status === "funded") return "funded";
  if (["declined", "withdrawn", "closed"].includes(status)) return "closed";
  return null;
}

export function legacyInterestStatus(status: "new" | "contacted" | "qualified" | "closed"): InvestmentApplication["status"] {
  if (status === "new") return "submitted";
  if (status === "closed") return "closed";
  return "compliance_review";
}
