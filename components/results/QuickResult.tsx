"use client";

// components/results/QuickResult.tsx
// Écran « quick win » du simulateur en deux phases : après SEULEMENT 3 questions
// (dépenses, part hors zone euro, cotisation actuelle), on affiche immédiatement
// un écart estimé personnalisé, « SON chiffre », pour prouver la valeur avant
// de demander les 5 questions restantes. Partagé par les deux entrées du
// parcours (/simulateur et les pages /profils/[slug]).
//
// Leviers assumés sur cet écran de bascule (marketing + logique + UX) :
//   • Reveal — le chiffre « compte » de 0 à sa valeur : récompense de l'effort
//     des 3 questions, moment de bascule émotionnel (désactivé si reduced-motion).
//   • Ancrage visuel — deux barres « aujourd'hui » vs « la moins chère » : l'écart
//     se lit d'un coup d'œil, bien mieux qu'en prose.
//   • Magnitude — projection factuelle sur 3 ans : l'écart annuel paraît petit,
//     cumulé il pèse (aversion à la perte, sans jamais conseiller).
//   • Raison d'affiner — une jauge de précision 3/8 montre que l'estimation est
//     partielle : compléter la jauge devient la motivation logique du CTA.
//
// Le chiffre reste explicitement « Estimation » : hypothèses prudentes par défaut
// (cf. DEFAULT_DEFERRED_ANSWERS) que l'affinage précise. Wording IOBSP : un écart
// chiffré factuel, jamais « recommandé ».

import { useEffect, useState } from "react";
import type { CostBreakdown, RankedCard } from "@/lib/types";
import { formatEur, formatSignedEur } from "@/lib/format";
import ShareResult from "@/components/results/ShareResult";

interface QuickResultProps {
  current: CostBreakdown;
  /** Carte la moins chère du panel selon les 3 réponses (vue récurrente). */
  best: RankedCard | null;
  onRefine: () => void;
  onSeeAll: () => void;
}

/** Nombre de réponses déjà données / restantes (cohérent avec le quick win). */
const ANSWERED = 3;
const REMAINING = 5;
const TOTAL = ANSWERED + REMAINING;

/**
 * Compte de 0 à `target` sur `durationMs`, en easeOut. Rend la valeur finale
 * immédiatement côté serveur ou si l'utilisateur préfère moins d'animations.
 */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/** Barre de coût proportionnelle (ancrage visuel de l'écart). */
function CostBar({
  label,
  amount,
  widthPct,
  tone,
}: {
  label: string;
  amount: number;
  widthPct: number;
  tone: "current" | "best";
}) {
  const track = tone === "best" ? "bg-emerald-500" : "bg-slate-400";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-bold tabular-nums text-slate-900">
          {formatEur(Math.max(amount, 0))}
          <span className="font-medium text-slate-400"> /an</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={"h-full rounded-full transition-[width] duration-700 ease-out " + track}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
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

  // Reveal : on anime le chiffre héros (l'écart s'il y en a un, sinon le coût).
  const heroTarget = improves ? gain : currentCost;
  const heroValue = useCountUp(heroTarget);

  // Barres : largeurs relatives au coût le plus élevé (min. 6 % pour rester lisible).
  const basis = Math.max(currentCost, bestCost, 1);
  const currentW = Math.max(6, Math.round((Math.max(currentCost, 0) / basis) * 100));
  const bestW = Math.max(6, Math.round((Math.max(bestCost, 0) / basis) * 100));

  const threeYear = Math.round(gain * 3);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center space-y-5">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <SparkIcon className="h-3.5 w-3.5" />
          Votre première estimation · {ANSWERED} questions
        </div>

        {improves ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm text-slate-600">
              Écart estimé avec la carte la moins chère du panel
            </p>
            <p
              className="mt-1 text-5xl font-extrabold tracking-tight text-emerald-700"
              aria-hidden
            >
              {formatSignedEur(Math.round(heroValue))}
              <span className="text-lg font-semibold text-emerald-600"> / an</span>
            </p>
            <p className="sr-only">
              Écart estimé de {formatSignedEur(gain)} par an.
            </p>

            {/* Ancrage visuel : le vide entre les deux barres EST l'économie. */}
            <div className="mt-5 space-y-3">
              <CostBar
                label="Votre carte aujourd'hui"
                amount={currentCost}
                widthPct={currentW}
                tone="current"
              />
              <CostBar
                label={`La moins chère · ${best!.card.name}`}
                amount={bestCost}
                widthPct={bestW}
                tone="best"
              />
            </div>

            {threeYear > 0 && (
              <p className="mt-4 border-t border-emerald-200 pt-4 text-sm text-slate-700">
                Sur 3 ans, l&apos;écart cumulé atteint{" "}
                <span className="font-semibold text-emerald-700">
                  {formatEur(threeYear)}
                </span>{" "}
                à usage constant.
              </p>
            )}

            <div className="mt-4 border-t border-emerald-200 pt-4">
              <ShareResult gainEur={gain} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">
              Selon vos {ANSWERED} réponses, votre carte actuelle est déjà
              compétitive
            </p>
            <p
              className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900"
              aria-hidden
            >
              {formatEur(Math.max(Math.round(heroValue), 0))}
              <span className="text-base font-semibold text-slate-500"> / an</span>
            </p>
            <p className="sr-only">
              Coût estimé de {formatEur(currentCost)} par an.
            </p>
            {best && (
              <div className="mt-5 space-y-3">
                <CostBar
                  label="Votre carte aujourd'hui"
                  amount={currentCost}
                  widthPct={currentW}
                  tone="current"
                />
                <CostBar
                  label={`La moins chère · ${best.card.name}`}
                  amount={bestCost}
                  widthPct={bestW}
                  tone="best"
                />
              </div>
            )}
            <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-600">
              L&apos;écart est faible sur ces 3 réponses. Vos voyages, retraits et
              avantages peuvent le faire bouger : affinez pour trancher.
            </p>
          </div>
        )}

        {/* Jauge de précision : rend visible que l'estimation est partielle.
            Compléter la jauge = motivation logique du CTA « affiner ». */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Précision de l&apos;estimation</span>
            <span className="tabular-nums text-slate-400">
              {ANSWERED} / {TOTAL} réponses
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.round((ANSWERED / TOTAL) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Calcul prudent pour le reste (aucun voyage, aucun retrait à
            l&apos;étranger, miles non comptés). Les {REMAINING} questions
            suivantes complètent le tableau.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={onRefine}
          className="w-full rounded-xl bg-brand px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Obtenir mon chiffre précis
          <span className="ml-1 font-normal text-indigo-200">
            · {REMAINING} questions · ~30 s
          </span>
        </button>
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Voir directement le classement
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
