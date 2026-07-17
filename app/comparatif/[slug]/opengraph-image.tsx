import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getCard, publicCards } from "@/lib/cards";
import { comparisonPairs, parseComparisonSlug } from "@/lib/card-display";

// Image de partage social dédiée à chaque comparaison « A vs B ».
export const alt = "Comparatif de cartes : CB180";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Doit rester aligné sur le generateStaticParams de page.tsx : même source.
export function generateStaticParams() {
  return comparisonPairs(publicCards()).map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Même garde que resolvePair (page.tsx) : sans ce filtre d'affiliation, une
  // paire dont la PAGE renvoie 404 rendait quand même son image de partage, en
  // y affichant le nom d'une carte non publique.
  const parsed = parseComparisonSlug(slug);
  const [a, b] = parsed ? [getCard(parsed[0]), getCard(parsed[1])] : [];
  if (!a || !b || a.affiliate.network == null || b.affiliate.network == null) {
    notFound();
  }

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
          <span>{a.name}</span>
          <span style={{ fontSize: 40, opacity: 0.8 }}>vs</span>
          <span>{b.name}</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 26, opacity: 0.9 }}>
          Coûts et frais comparés sur données officielles
        </div>
      </div>
    ),
    { ...size },
  );
}
