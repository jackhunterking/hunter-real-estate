import type { ReferralStatus } from "@/lib/capital/types";
import type { ReactNode } from "react";

const STAGE_ORDER: ReferralStatus[] = [
  "introduced",
  "contacted",
  "compliance-review",
  "accepted",
  "funded",
];

type StageIndicatorProps = {
  status: ReferralStatus;
  label: ReactNode;
  labels: Record<ReferralStatus, string>;
  className?: string;
};

function currentStepColor(status: ReferralStatus) {
  if (status === "funded" || status === "accepted") return "bg-[#3d7257]";
  if (status === "compliance-review") return "bg-[#b18327]";
  return "bg-[#3c5d75]";
}

/** A compact, accessible version of the client funding journey for dense tables. */
export function StageIndicator({ status, label, labels, className = "" }: StageIndicatorProps) {
  const currentIndex = STAGE_ORDER.indexOf(status);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="flex items-center"
        role="img"
        aria-label={`Current stage ${currentIndex + 1} of ${STAGE_ORDER.length}`}
      >
        {STAGE_ORDER.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;
          return (
            <span key={step} className="flex items-center">
              <span
                title={labels[step]}
                className={`block size-2 rounded-full ring-1 ring-inset ${
                  isCurrent
                    ? `${currentStepColor(status)} ring-transparent`
                    : isComplete
                      ? "bg-[#0a2d46] ring-transparent"
                      : "bg-white ring-[#cbd4da]"
                }`}
              />
              {index < STAGE_ORDER.length - 1 && (
                <span className={`mx-0.5 h-px w-2 ${isComplete ? "bg-[#0a2d46]" : "bg-[#d8dfe4]"}`} />
              )}
            </span>
          );
        })}
      </span>
      <span className="min-w-0">{label}</span>
    </span>
  );
}
