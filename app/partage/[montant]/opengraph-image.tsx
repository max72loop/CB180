import { ImageResponse } from "next/og";

// Image de partage social personnalisée (audit, chantier 05) : « J'économise
// X €/an ». Générée à la volée à partir du montant présent dans l'URL. C'est
// ce visuel qui rend le chiffre viralisable sur les réseaux et messageries.
export const alt = "J'économise sur ma carte bancaire avec CB180";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Même borne que la page : montant crédible ou repli neutre. */
function parseMontant(raw: string): number | null {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 3000) return null;
  return n;
}

export default async function Image({
  params,
}: {
  params: Promise<{ montant: string }>;
}) {
  const { montant } = await params;
  const amount = parseMontant(montant);

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
          background:
            "linear-gradient(120deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 34, opacity: 0.9 }}>
            {amount ? "J'économise" : "Combien vous coûte vraiment"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 20,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            {amount ? (
              <>
                <span style={{ fontSize: 150 }}>
                  {amount.toLocaleString("fr-FR")} €
                </span>
                <span style={{ fontSize: 48, opacity: 0.85 }}>/ an</span>
              </>
            ) : (
              <span style={{ fontSize: 88 }}>votre carte bancaire&nbsp;?</span>
            )}
          </div>
          <div style={{ fontSize: 30, opacity: 0.9, maxWidth: 900 }}>
            {amount
              ? "sur ma carte bancaire, calculé objectivement par CB180."
              : "Le coût annuel chiffré de votre carte, comparé au marché français."}
          </div>
        </div>

        <div style={{ fontSize: 24, opacity: 0.85 }}>
          Et vous, combien&nbsp;? · cb180.xyz · information chiffrée, sans conseil
        </div>
      </div>
    ),
    { ...size },
  );
}
