import { ImageResponse } from "next/og";

// Generated rather than shipped as a binary: the card is the wordmark plus the
// Parvis co-brand, so it stays in step with the brand module instead of going
// stale in /public the next time the name or the dealer relationship changes.
export const alt = "Equity Market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071c2c",
          padding: "84px 88px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Equity Market
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#9eabb3", maxWidth: 820, lineHeight: 1.35 }}>
            A clearer view of Canadian private real estate and alternative investments.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#71808a",
            }}
          >
            Powered by
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.16em", color: "#e7ecef" }}>
            PARVIS
          </div>
          <div style={{ marginLeft: "auto", fontSize: 20, color: "#71808a" }}>NRD #74000</div>
        </div>
      </div>
    ),
    size,
  );
}
