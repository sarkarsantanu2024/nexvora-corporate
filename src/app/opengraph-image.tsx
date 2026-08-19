import { ImageResponse } from "next/og";

// The card that shows up when the URL is pasted into WhatsApp, LinkedIn or
// Facebook. Drawn at request time by satori rather than shipped as a PNG, so
// editing the wording here is the only step needed to change it.
export const runtime = "edge";
export const alt =
  "Nexvora Technologies — getting your business online should not cost a fortune";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0a1128 0%, #131f52 55%, #2f1f6b 100%)",
          padding: 72,
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#96b0ff",
            }}
          />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#96b0ff",
              fontWeight: 700,
            }}
          >
            Nexvora Technologies
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 74,
              lineHeight: 1.08,
              fontWeight: 700,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            Getting your business online should not cost a fortune.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#c7d2fe",
              maxWidth: 900,
            }}
          >
            Websites · Online stores · Portfolios · Hosting · Digital marketing
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#94a3b8",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 28,
          }}
        >
          <div>nexvoratechnologies.co.in</div>
          <div>Kolkata, West Bengal · +91 98042 43159</div>
        </div>
      </div>
    ),
    size,
  );
}
