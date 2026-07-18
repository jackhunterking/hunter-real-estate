import Image from "next/image";
import Link from "next/link";

export const NORTH_BASE = "/hunter-north-capital";

export function NorthBrand({
  compact = false,
  markOnlyOnDesktop = false,
  dark = false,
}: {
  compact?: boolean;
  markOnlyOnDesktop?: boolean;
  dark?: boolean;
}) {
  return (
    <Link
      href={NORTH_BASE}
      className="inline-flex min-w-0 items-center gap-3"
      aria-label="Hunter North Capital"
    >
      <Image
        src="/logos/HUNTER_Brandmark_Gold.png"
        alt=""
        width={44}
        height={44}
        className="size-9 shrink-0 object-contain"
        priority
      />
      <span
        className={markOnlyOnDesktop ? "min-w-0 leading-none lg:hidden" : "min-w-0 leading-none"}
      >
        <span className={`block truncate text-[15px] font-semibold ${dark ? "text-[#0a2d46]" : "text-white"}`}>
          Hunter North
        </span>
        {!compact && (
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8bf7a]">
            Capital
          </span>
        )}
      </span>
    </Link>
  );
}
