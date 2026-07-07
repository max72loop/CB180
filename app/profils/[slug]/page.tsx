// app/profils/[slug]/page.tsx
// Landing pages par PROFIL (voyageur longue durée : PVT, expat, étudiant…).
// Page SERVEUR : l'écart annuel du hero est calculé en direct par le moteur pur
// à partir des hypothèses pré-remplies du profil (aucun chiffre codé en dur),
// puis le CTA ouvre le simulateur pré-rempli sur ces mêmes réponses.
//
// Le chiffre reprend la vue RÉCURRENTE (hors prime de bienvenue), exactement
// comme l'écran express du simulateur (QuickResult) : même barème, même chiffre.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { PROFILS, getProfil } from "@/lib/profils";
import { answersToProfileLenient } from "@/lib/answers";
import { computeCurrentSituationCost, rankCards } from "@/lib/engine";
import { cards } from "@/lib/cards";
import { formatEur } from "@/lib/format";
import { cardHighlights } from "@/lib/card-display";

export function generateStaticParams() {
  return PROFILS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profil = getProfil(slug);
  if (!profil) return {};
  return {
    title: profil.seo.title,
    description: profil.seo.description,
    openGraph: { title: profil.seo.title, description: profil.seo.description },
  };
}

export default async function ProfilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profil = getProfil(slug);
  if (!profil) notFound();

  // Calcul en direct : mêmes réponses que le simulateur recevra, même moteur.
  const profile = answersToProfileLenient(profil.answers);
  const current = computeCurrentSituationCost(profile);
  const ranked = rankCards(cards, profile, { onlyEligible: false });
  const best = ranked[0];

  // Vue récurrente (hors prime), cohérente avec l'écran express du simulateur.
  const currentCost = current.netAnnualCostWithoutBonusEur;
  const bestCost = best.breakdown.netAnnualCostWithoutBonusEur;
  const gain = Math.round(currentCost - bestCost);
  const topThree = ranked.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Profil voyageur longue durée
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {profil.h1}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {profil.intro}
        </p>

        {/* Le chiffre spectaculaire, d'abord. */}
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <p className="text-sm text-slate-600">
            Écart annuel estimé entre une carte française classique et la carte
            la moins chère sur ce profil
          </p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight text-emerald-700 sm:text-6xl">
            ~{formatEur(gain)}
            <span className="text-xl font-semibold text-emerald-600"> / an</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            Sur ce profil, une carte de réseau classique revient à environ{" "}
            <span className="font-semibold">{formatEur(currentCost)}/an</span>{" "}
            (surtout des frais de change et de retrait). La moins chère du panel,{" "}
            <span className="font-semibold">{best.card.name}</span>, ressort à{" "}
            <span className="font-semibold">{formatEur(bestCost)}/an</span>.
          </p>

          <Link
            href={`/simulateur?profil=${profil.slug}`}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5"
          >
            Affiner sur ma situation réelle
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            Simulateur pré-rempli sur ce profil · ajustez vos usages en 1 min ·
            aucune donnée enregistrée.
          </p>
        </div>

        {/* Les 3 cartes les moins chères sur ce profil (transparence du classement). */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Les cartes les moins chères sur ce profil
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Classement trié objectivement par coût annuel récurrent, hors prime
            de bienvenue.
          </p>
          <ol className="mt-4 space-y-2">
            {topThree.map((r, i) => {
              const cost = r.breakdown.netAnnualCostWithoutBonusEur;
              return (
                <li
                  key={r.card.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {r.card.name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {cardHighlights(r.card).map((h) => (
                          <span
                            key={h}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-right text-sm font-semibold text-emerald-700">
                    {cost <= 0 ? "0 € de frais/an" : `${formatEur(cost)}/an`}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Transparence : les hypothèses derrière le chiffre, repliées par défaut. */}
        <section className="mt-10">
          <p className="text-sm text-slate-500">
            L&apos;estimation ci-dessus repose sur un profil PVT type. Vos usages
            réels peuvent différer — le simulateur les ajuste.
          </p>
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700 marker:content-['']">
              Les hypothèses de ce chiffrage
            </summary>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
              {profil.hypotheses.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </details>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Un écart chiffré, pas un conseil.{" "}
            <Link
              href="/comment-ca-marche"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Comment le classement est établi
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
