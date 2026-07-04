"use client";

// components/results/QuickResult.tsx
// Écran « quick win » du simulateur en deux phases : après SEULEMENT 3 questions
// (dépenses, part hors zone euro, cotisation actuelle), on affiche immédiatement
// un écart estimé personnalisé, « SON chiffre », pour prouver la valeur avant
// de demander les 5 questions restantes.
//
// Le chiffre est explicitement badgé « Estimation » : il repose sur des
// hypothèses prudentes par défaut (cf. DEFAULT_DEFERRED_ANSWERS) que l'affinage
// vient préciser. Wording IOBSP : un écart chiffré factuel, jamais « recommandé ».

import type { CostBreakdown, RankedCard } from "@/lib/types";
import { formatEur, formatSignedEur } from "@/lib/format";

interface QuickResultProps {
  current: CostBreakdown;
  /** Carte la moins chère du panel selon les 3 réponses (vue récurrente). */
  best: RankedCard | null;
  onRefine: () => void;
  onSeeAll: () => void;
}

export default function QuickResult({
  current,
  best,
  onRefine,
  onSeeAll,
}: QuickResultProps) {
  // Vue récurrente (hors prime de bienvenue) : chiffre honnête, non gonflé par
  // une prime non récurrente, cohérent avec le hero par défaut des résultats.
  const currentCost = current.netAnnualCostWithoutBonusEur;
  const bestCost = best?.breakdown.netAnnualCostWithoutBonusEur ?? currentCost;
  const gain = Math.round((currentCost - bestCost) * 100) / 100;
  const improves = best != null && gain > 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center space-y-6">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <SparkIcon className="h-3.5 w-3.5" />
          Estimation express · 3 questions
        </div>

        {improves ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm text-slate-600">
              Écart estimé avec la carte la moins chère du panel
            </p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight text-emerald-700">
              {formatSignedEur(gain)}
              <span className="text-lg font-semibold text-emerald-600"> / an</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Votre situation actuelle est estimée à{" "}
              <span className="font-semibold">{formatEur(currentCost)}/an</span>.
              La moins chère selon vos réponses,{" "}
              <span className="font-semibold">{best!.card.name}</span>, ressort à{" "}
              <span className="font-semibold">{formatEur(bestCost)}/an</span>.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">
              Selon vos 3 réponses, votre carte actuelle est déjà compétitive
            </p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
              {formatEur(currentCost)}
              <span className="text-base font-semibold text-slate-500"> / an</span>
            </p>
            {best && (
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                La moins chère du panel, {best.card.name}, ressort à{" "}
                {formatEur(bestCost)}/an. L&apos;affinage peut faire bouger cet
                écart selon vos usages précis.
              </p>
            )}
          </div>
        )}

        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500">
          Estimation fondée sur 3 réponses et des hypothèses prudentes pour le
          reste (aucun voyage, aucun retrait à l&apos;étranger, miles non
          comptés). Elle se précise avec 5 questions de plus.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={onRefine}
          className="w-full rounded-xl bg-brand px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Affiner mon estimation
          <span className="ml-1 font-normal text-indigo-200">· 5 questions</span>
        </button>
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Voir le classement des cartes
        </button>
        <p className="text-center text-xs leading-relaxed text-slate-500">
          Un écart chiffré, pas un conseil. Le classement est trié objectivement
          par coût annuel.
        </p>
      </div>
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 1l1.8 5.2L17 8l-5.2 1.8L10 15l-1.8-5.2L3 8l5.2-1.8L10 1z" />
    </svg>
  );
}
