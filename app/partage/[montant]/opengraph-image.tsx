import { ImageResponse } from "next/og";
import { parseShareSlug, type ShareCompo } from "@/lib/share";

// Image de partage social personnalisée (chantier 05). Deux visuels selon le
// lien reçu :
//   • lien enrichi (`/partage/269-120-80-40`) → le grand chiffre « J'économise
//     X €/an » ACCOMPAGNÉ du radar de coût (cotisation / change / retrait) : la
//     « forme » du coût actuel, bien plus partageable qu'un nombre seul ;
//   • lien historique ou montant seul → l'ancien visuel centré, inchangé.
// Générée à la volée depuis le slug de l'URL (les opengraph-image ne reçoivent
// pas les searchParams, d'où l'encodage de la compo dans le chemin).
export const alt = "J'économise sur ma carte bancaire avec CB180";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ─── Géométrie du radar (triangle à 3 axes) ────────────────────────────────
const RADAR = 360; // côté de la boîte du radar
const CENTER = RADAR / 2;
const R = 118; // rayon des axes
const SCALE_FLOOR = 0.16; // rayon minimal d'un sommet, pour qu'un poste nul reste visible

/** Axes du radar : vecteur unité + couleur (éclaircie pour contraster sur le fond). */
const AXES = [
  { key: "cotisation", label: "Cotisation", ux: 0, uy: -1, color: "#e2e8f0" },
  { key: "change", label: "Change", ux: 0.8660254, uy: 0.5, color: "#c7d2fe" },
  { key: "retrait", label: "Retrait", ux: -0.8660254, uy: 0.5, color: "#fde68a" },
] as const;

/** Coordonnée d'un sommet sur un axe, pour une échelle [0..1]. */
function vertex(ux: number, uy: number, scale: number): [number, number] {
  return [CENTER + R * scale * ux, CENTER + R * scale * uy];
}

/** Chaîne `x,y x,y x,y` des trois sommets d'un polygone à l'échelle donnée. */
function polygonPoints(scales: number[]): string {
  return AXES.map((a, i) => {
    const [x, y] = vertex(a.ux, a.uy, scales[i]);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

/** Le radar de coût : grille, données remplies, sommets et libellés chiffrés. */
function CostRadar({ compo }: { compo: ShareCompo }) {
  const amounts = [compo.cotisation, compo.change, compo.retrait];
  const max = Math.max(...amounts, 1);
  const dataScales = amounts.map((a) => Math.max(SCALE_FLOOR, a / max));

  const gridOuter = polygonPoints([1, 1, 1]);
  const gridMid = polygonPoints([0.5, 0.5, 0.5]);
  const dataPoly = polygonPoints(dataScales);

  // Positions des libellés, calées près de chaque sommet extérieur.
  const labelBox = {
    cotisation: { top: 4, left: 0, width: RADAR, align: "center" },
    change: { top: 250, left: 208, width: 156, align: "flex-start" },
    retrait: { top: 250, left: -4, width: 156, align: "flex-end" },
  } as const;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 600, opacity: 0.9 }}>
        D&apos;où vient mon coût actuel
      </div>
      <div style={{ position: "relative", width: RADAR, height: RADAR, display: "flex" }}>
        <svg width={RADAR} height={RADAR} viewBox={`0 0 ${RADAR} ${RADAR}`}>
          <polygon points={gridOuter} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
          <polygon points={gridMid} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
          {AXES.map((a) => {
            const [x, y] = vertex(a.ux, a.uy, 1);
            return <line key={a.key} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />;
          })}
          <polygon points={dataPoly} fill="rgba(255,255,255,0.3)" stroke="#ffffff" strokeWidth={3} />
          {AXES.map((a, i) => {
            const [x, y] = vertex(a.ux, a.uy, dataScales[i]);
            return <circle key={a.key} cx={x} cy={y} r={7} fill={a.color} stroke="#ffffff" strokeWidth={2} />;
          })}
        </svg>

        {AXES.map((a, i) => {
          const pos = labelBox[a.key];
          return (
            <div
              key={a.key}
              style={{
                position: "absolute",
                top: pos.top,
                left: pos.left,
                width: pos.width,
                display: "flex",
                flexDirection: "column",
                alignItems: pos.align,
              }}
            >
              <div style={{ fontSize: 21, fontWeight: 600, color: a.color }}>{a.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{`${amounts[i]} €`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ montant: string }>;
}) {
  const { montant } = await params;
  const { amount, compo } = parseShareSlug(montant);

  const header = (
    <div key="header" style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
  );

  const footer = (
    <div key="footer" style={{ fontSize: 24, opacity: 0.85 }}>
      Et vous, combien&nbsp;? · cb180.xyz · information chiffrée, sans conseil
    </div>
  );

  // Satori (next/og) n'aplatit pas les Fragments : passer `<>…</>` comme unique
  // enfant les regroupe dans un conteneur `row` par défaut, ce qui casse
  // l'empilement vertical. On passe donc un TABLEAU d'enfants (avec clés), traité
  // comme des enfants directs du conteneur `column`.
  const shell = (children: React.ReactNode) => (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(120deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </div>
  );

  // ─── Visuel enrichi : grand chiffre + radar de coût ───
  if (amount != null && compo) {
    return new ImageResponse(
      shell([
        header,
        <div key="mid" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
            <div style={{ fontSize: 32, opacity: 0.9 }}>J&apos;économise</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
              <span style={{ fontSize: 128 }}>{amount.toLocaleString("fr-FR")} €</span>
              <span style={{ fontSize: 42, opacity: 0.85 }}>/ an</span>
            </div>
            <div style={{ fontSize: 27, opacity: 0.9 }}>
              sur ma carte bancaire, calculé objectivement par CB180.
            </div>
          </div>
          <CostRadar compo={compo} />
        </div>,
        footer,
      ]),
      { ...size },
    );
  }

  // ─── Visuel historique : montant seul, ou accroche neutre ───
  return new ImageResponse(
    shell([
      header,
      <div key="mid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 34, opacity: 0.9 }}>
          {amount != null ? "J'économise" : "Combien vous coûte vraiment"}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
          {amount != null ? (
            <>
              <span style={{ fontSize: 150 }}>{amount.toLocaleString("fr-FR")} €</span>
              <span style={{ fontSize: 48, opacity: 0.85 }}>/ an</span>
            </>
          ) : (
            <span style={{ fontSize: 88 }}>votre carte bancaire&nbsp;?</span>
          )}
        </div>
        <div style={{ fontSize: 30, opacity: 0.9, maxWidth: 900 }}>
          {amount != null
            ? "sur ma carte bancaire, calculé objectivement par CB180."
            : "Le coût annuel chiffré de votre carte, comparé au marché français."}
        </div>
      </div>,
      footer,
    ]),
    { ...size },
  );
}
