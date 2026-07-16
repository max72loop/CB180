// app/profils/page.tsx
// Index des landing pages par profil. Page serveur statique, indexable : elle
// porte le maillage interne vers /profils/[slug] (sans elle, les pages profil
// n'étaient atteignables que par le sitemap).
//
// Comme les pages profil, l'écart annoncé pour chaque profil est calculé en
// direct par le moteur à partir de ses réponses pré-remplies : aucun chiffre
// codé en dur, et le même barème que la page de destination.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { PROFILS } from "@/lib/profils";
import { answersToProfileLenient } from "@/lib/answers";
import { computeCurrentSituationCost, rankCards } from "@/lib/engine";
import { cards } from "@/lib/cards";
import { formatEur } from "@/lib/format";

export const metadata: Metadata = {
  title: "Combien votre carte coûte selon votre projet",
  description:
    "PVT, expatriation, études à l'étranger : l'écart annuel entre une carte française classique et la moins chère, chiffré sur des hypothèses explicites. Simulateur pré-rempli.",
  alternates: { canonical: "/profils" },
};

/** Écart annuel récurrent (hors prime) entre la situation actuelle et la
 *  meilleure carte du panel, sur les hypothèses du profil. */
function ecartAnnuel(answers: (typeof PROFILS)[number]["answers"]): number {
  const profile = answersToProfileLenient(answers);
  const current = computeCurrentSituationCost(profile);
  const best = rankCards(cards, profile, { onlyEligible: false })[0];
  return Math.round(
    current.netAnnualCostWithoutBonusEur -
      best.breakdown.netAnnualCostWithoutBonusEur,
  );
}

export default function ProfilsIndex() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">Profils</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Combien votre carte coûte selon votre projet
          </h1>
          <p className="mt-4 text-slate-600">
            Partir un an à l&apos;étranger ne coûte pas la même chose avec une
            carte ou avec une autre. Chaque profil part d&apos;hypothèses
            d&apos;usage explicites et chiffre l&apos;écart annuel avec le même
            moteur que le simulateur. Vos usages réels peuvent différer — le
            simulateur les ajuste.
          </p>
        </header>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {PROFILS.map((profil) => {
            const gain = ecartAnnuel(profil.answers);
            return (
              <li key={profil.slug}>
                <Link
                  href={`/profils/${profil.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {profil.h1}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {profil.intro}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Écart annuel estimé ~
                      <span className="font-semibold text-emerald-700">
                        {formatEur(gain)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                      Voir le détail →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 text-xs leading-relaxed text-slate-600">
          Un écart chiffré, pas un conseil.{" "}
          <Link
            href="/comment-ca-marche"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Comment le classement est établi
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
