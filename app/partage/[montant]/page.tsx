// app/partage/[montant]/page.tsx
// Page d'atterrissage de la boucle virale (audit, chantier 05). Quand un
// utilisateur partage son économie, le lien pointe ici : l'image Open Graph
// (voir opengraph-image.tsx) affiche « J'économise X €/an », et la page
// ré-injecte le visiteur dans le simulateur. Le chiffre est présenté comme le
// résultat d'UN autre profil, jamais comme une promesse — wording IOBSP.

import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

/** Borne le montant partagé à une fourchette crédible (évite les URLs absurdes). */
function parseMontant(raw: string): number | null {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 3000) return null;
  return n;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ montant: string }>;
}): Promise<Metadata> {
  const { montant } = await params;
  const amount = parseMontant(montant);
  // Le titre est complété par le gabarit « %s : CB180 » du layout racine.
  const title = amount
    ? `Économiser ${amount} €/an sur sa carte bancaire`
    : "Combien coûte vraiment votre carte";
  const description = amount
    ? `Un utilisateur de CB180 a estimé ${amount} €/an d'économie sur sa carte. Calculez le vôtre en 3 questions, gratuitement et sans donnée identifiante.`
    : "Le coût annuel chiffré de votre carte, comparé objectivement au marché français.";
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PartagePage({
  params,
}: {
  params: Promise<{ montant: string }>;
}) {
  const { montant } = await params;
  const amount = parseMontant(montant);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="brand-glow pointer-events-none absolute inset-0 -z-10 opacity-70" />
          <div className="dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

          <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Résultat partagé via CB180
            </p>

            {amount ? (
              <>
                <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                  Quelqu&apos;un vient d&apos;estimer{" "}
                  <span className="text-gradient tabular-nums">
                    {amount.toLocaleString("fr-FR")}&nbsp;€ / an
                  </span>{" "}
                  d&apos;économie sur sa carte
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                  Ce montant dépend d&apos;un usage précis, ce n&apos;est pas une
                  promesse. Le vôtre peut être plus haut, ou plus bas. La seule
                  façon de savoir&nbsp;: le calculer sur vos propres réponses, en
                  3 questions.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                  Combien vous coûte{" "}
                  <span className="text-gradient">vraiment</span> votre carte
                  bancaire&nbsp;?
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                  Le coût annuel réel de votre carte, comparé objectivement aux
                  alternatives du marché français. En 3 questions, sans donnée
                  identifiante.
                </p>
              </>
            )}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/simulateur"
                className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto"
              >
                Calculer mon économie, gratuit
              </Link>
              <Link
                href="/comment-ca-marche"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
              >
                Comment ça marche
              </Link>
            </div>

            <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-slate-500">
              CB180 est un outil d&apos;information et de comparaison, financé par
              affiliation transparente. Il ne vend aucune carte et ne délivre
              aucun conseil personnalisé.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
