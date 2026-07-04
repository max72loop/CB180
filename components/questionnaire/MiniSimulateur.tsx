"use client";

// components/questionnaire/MiniSimulateur.tsx
// Widget de simulation EMBARQUÉ sur une fiche carte. Version compacte du
// simulateur : 3 réglages (dépenses / part en devises / cotisation actuelle),
// calcul instantané par le moteur pur (lib/engine), résultat centré sur LA
// carte de la fiche : son coût annuel estimé et l'écart vs la situation actuelle.
//
// Wording IOBSP : on affiche un coût chiffré et un écart factuel, jamais
// « recommandé ». Aucun stockage, aucun appel réseau : 100 % en mémoire.

import { useMemo, useState } from "react";
import Link from "next/link";
import { computeAnnualCost, computeCurrentSituationCost } from "@/lib/engine";
import { buildProfile, WIDGET_SPENDING, WIDGET_FOREIGN_SHARE, WIDGET_CURRENT_FEE } from "@/lib/scenarios";
import { formatEur, formatSignedEur } from "@/lib/format";
import type { Card } from "@/lib/types";

interface MiniSimulateurProps {
  /** La carte dont on chiffre le coût (celle de la fiche). */
  card: Card;
}

function Segmented<T extends number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: string; label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 " +
                (active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MiniSimulateur({ card }: MiniSimulateurProps) {
  const [spending, setSpending] = useState<number>(WIDGET_SPENDING[1].value);
  const [foreignShare, setForeignShare] = useState<number>(WIDGET_FOREIGN_SHARE[1].value);
  const [currentFee, setCurrentFee] = useState<number>(WIDGET_CURRENT_FEE[0].value);

  const { cardCost, savings } = useMemo(() => {
    const profile = buildProfile({
      monthlySpendingEur: spending,
      foreignSpendingShare: foreignShare,
      currentAnnualFeeEur: currentFee,
    });
    const breakdown = computeAnnualCost(card, profile);
    const current = computeCurrentSituationCost(profile);
    return {
      cardCost: breakdown.netAnnualCostEur,
      savings: current.netAnnualCostEur - breakdown.netAnnualCostEur,
    };
  }, [card, spending, foreignShare, currentFee]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Chiffrez le coût de {card.name} selon vos usages
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Trois réglages, résultat instantané. Aucune donnée enregistrée.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Segmented label="Dépenses / mois" options={WIDGET_SPENDING} value={spending} onChange={setSpending} />
        <Segmented label="Part en devises" options={WIDGET_FOREIGN_SHARE} value={foreignShare} onChange={setForeignShare} />
        <Segmented label="Ma carte actuelle" options={WIDGET_CURRENT_FEE} value={currentFee} onChange={setCurrentFee} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Coût annuel estimé
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {cardCost <= 0 ? formatEur(0) : formatEur(cardCost)}
          </p>
          {cardCost < 0 && (
            <p className="text-xs font-medium text-emerald-600">
              soit un gain net de {formatEur(Math.abs(cardCost))}/an (prime/cashback amortis)
            </p>
          )}
        </div>
        <div
          className={
            "rounded-xl p-4 " + (savings >= 0 ? "bg-emerald-50" : "bg-amber-50")
          }
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Écart vs votre situation actuelle
          </p>
          <p
            className={
              "mt-1 text-3xl font-extrabold " +
              (savings >= 0 ? "text-emerald-700" : "text-amber-700")
            }
          >
            {formatSignedEur(savings)}
          </p>
          <p className="text-xs text-slate-500">
            {savings >= 0 ? "d'économie estimée par an" : "de surcoût estimé par an"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Estimation sur données officielles et hypothèses explicites (retrait
        moyen 100 €, prime amortie sur 3 ans). La « situation actuelle » modélise
        une carte de réseau traditionnel avec la cotisation indiquée. Pour un
        chiffrage complet sur vos 8 usages,{" "}
        <Link href="/simulateur" className="font-medium text-indigo-600 hover:text-indigo-700">
          lancez la simulation détaillée
        </Link>
        .
      </p>
    </section>
  );
}
