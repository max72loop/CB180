import { ImageResponse } from "next/og";
import { getCard, publicCards } from "@/lib/cards";
import { comparisonSlug, parseComparisonSlug } from "@/lib/card-display";

// Image de partage social dédiée à chaque comparaison « A vs B ».
export const alt = "Comparatif de cartes — CB180";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  const cards = publicCards();
  const params: { slug: string }[] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      params.push({ slug: comparisonSlug(cards[i].id, cards[j].id) });
    }
  }
  return params;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug);
  const a = parsed ? getCard(parsed[0]) : undefined;
  const b = parsed ? getCard(parsed[1]) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(120deg,#4f46e5,#7c3aed,#d946ef)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 20 }}>
          CB180 · Comparatif
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          <span>{a?.name ?? "Carte A"}</span>
          <span style={{ fontSize: 40, opacity: 0.8 }}>vs</span>
          <span>{b?.name ?? "Carte B"}</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 26, opacity: 0.9 }}>
          Coûts et frais comparés sur données officielles
        </div>
      </div>
    ),
    { ...size },
  );
}
