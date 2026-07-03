import { ImageResponse } from "next/og";
import { getCard, publicCards } from "@/lib/cards";
import { feeLabel, fxLabel, toneForTier } from "@/lib/card-display";

// Image de partage social dédiée à chaque fiche carte.
export const alt = "Fiche carte — CB180";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return publicCards().map((c) => ({ id: c.id }));
}

const GRAD: Record<string, string> = {
  brand: "linear-gradient(120deg,#4f46e5,#7c3aed,#d946ef)",
  dark: "linear-gradient(120deg,#1f2937,#020617)",
  emerald: "linear-gradient(120deg,#10b981,#0f766e)",
  slate: "linear-gradient(120deg,#64748b,#334155)",
};

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCard(id);
  const tone = card ? toneForTier(card.tier) : "brand";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: GRAD[tone],
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M9 18a7 7 0 1 0 7-7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M9 18l1.6-3.4M9 18l3.4 1.6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>CB180</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 30, opacity: 0.85 }}>
            {card?.issuer ?? ""}
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 950,
            }}
          >
            {card?.name ?? "Carte bancaire"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {card && (
            <>
              <span
                style={{
                  fontSize: 26,
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.16)",
                }}
              >
                Cotisation : {feeLabel(card)}
              </span>
              <span
                style={{
                  fontSize: 26,
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.16)",
                }}
              >
                Change hors € : {fxLabel(card)}
              </span>
            </>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
