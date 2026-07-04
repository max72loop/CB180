import { ImageResponse } from "next/og";

// Image de partage social (Open Graph / Twitter) générée à la volée.
export const runtime = "edge";
export const alt = "CB180 : Combien vous coûte vraiment votre carte bancaire ?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(120deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18a7 7 0 1 0 7-7"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M9 18l1.6-3.4M9 18l3.4 1.6"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            CB180
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Combien vous coûte vraiment votre carte bancaire ?
          </div>
          <div style={{ fontSize: 30, opacity: 0.9, maxWidth: 820 }}>
            Le coût annuel chiffré de votre carte, comparé objectivement au
            marché français.
          </div>
        </div>

        <div style={{ fontSize: 24, opacity: 0.85 }}>
          Information chiffrée · anonyme · sans conseil personnalisé
        </div>
      </div>
    ),
    { ...size },
  );
}
