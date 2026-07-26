import Link from "next/link";
import { routing } from "@/i18n/routing";

/**
 * The 404 for URLs that match no route at all.
 *
 * It renders its own <html>/<body> because the root layout is a passthrough —
 * the document shell lives in app/[locale]/layout.tsx so <html lang> can be
 * server-authoritative per URL. Without this, Next has no document to render an
 * unmatched URL into and fails with "Missing <html> and <body> tags in the root
 * layout" instead of showing a 404.
 *
 * Deliberately brand-neutral: this file is shared by two businesses on
 * different domains, and it cannot tell which host the request arrived on, so
 * naming either one would be wrong half the time.
 */
export default function NotFound() {
  return (
    <html lang={routing.defaultLocale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f5ef",
          color: "#14232d",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "-apple-system, Segoe UI, Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8a7333",
            }}
          >
            404
          </p>
          <h1 style={{ margin: "14px 0 0", fontSize: "30px", fontWeight: 500 }}>
            This page could not be found.
          </h1>
          <p
            style={{
              margin: "14px 0 28px",
              fontFamily: "-apple-system, Segoe UI, Arial, sans-serif",
              fontSize: "15px",
              lineHeight: 1.65,
              color: "#465761",
            }}
          >
            The link may be out of date, or the page may have moved.
          </p>
          <Link
            href={`/${routing.defaultLocale}`}
            style={{
              display: "inline-block",
              background: "#071c2c",
              color: "#fff",
              padding: "13px 24px",
              textDecoration: "none",
              fontFamily: "-apple-system, Segoe UI, Arial, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Go to the homepage
          </Link>
        </main>
      </body>
    </html>
  );
}
