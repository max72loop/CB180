"use client";

// components/marketing/HeroSimulator.tsx
// Chantier 02 de l'audit : rendre le hook INTERACTIF dès le hero. Au lieu d'un
// « +269 € » illustratif et statique, deux curseurs (cotisation actuelle, part
// des dépenses hors zone euro) produisent un écart annuel qui bouge en direct.
// Le visiteur voit « SON chiffre » immédiatement, avant même le simulateur.
//
// Même moteur pur (lib/engine) que le simulateur complet : le chiffre est
// cohérent avec ce que l'utilisateur obtiendra en affinant. Wording IOBSP :
// un écart chiffré illustratif, jamais « recommandé ».

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { computeCurrentSituationCost, rankCards } from "@/lib/engine";
import { buildProfile } from "@/lib/scenarios";
import { formatEur, formatSignedEur } from "@/lib/format";
import type { Card } from "@/lib/types";

interface HeroSimulatorProps {
  /** Catalogue comparé (cartes publiques) pour trouver la moins chère en direct. */
  cards: Card[];
}

/** Dépenses mensuelles supposées pour l'illustration (annoncées en clair). */
const ASSUMED_MONTHLY_SPENDING = 1500;

/** Envoie un event de funnel « hero_sim » au premier réglage (mesure du hook). */
function logHeroInteraction() {
  fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: null, eventType: "hero_sim" }),
    keepalive: true,
  }).catch(() => {});
}

export default function HeroSimulator({ cards }: HeroSimulatorProps) {
  // Valeurs de départ représentatives : cotisation « moyenne de marché » et une
  // part modérée de dépenses en devises, pour afficher d'emblée un écart parlant.
  const [fee, setFee] = useState(130);
  const [share, setShare] = useState(10); // en %
  const interacted = useRef(false);

  const onInteract = () => {
    if (interacted.current) return;
    interacted.current = true;
    logHeroInteraction();
  };

  const { gain, bestName } = useMemo(() => {
    const profile = buildProfile({
      monthlySpendingEur: ASSUMED_MONTHLY_SPENDING,
      foreignSpendingShare: share / 100,
      currentAnnualFeeEur: fee,
    });
    const current = computeCurrentSituationCost(profile);
    const ranked = rankCards(cards, profile, { onlyEligible: false });
    const best = ranked[0] ?? null;
    // Vue récurrente (hors prime) : chiffre honnête, cohérent avec le simulateur.
    const currentCost = current.netAnnualCostWithoutBonusEur;
    const bestCost = best?.breakdown.netAnnualCostWithoutBonusEur ?? currentCost;
    return {
      gain: Math.round((currentCost - bestCost) * 100) / 100,
      bestName: best?.card.name ?? null,
    };
  }, [cards, fee, share]);

  const improves = gain > 0;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Halo de marque derrière la carte */}
      <div className="brand-glow pointer-events-none absolute -inset-6 -z-10 opacity-50 blur-xl" />

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Estimez votre écart
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            en direct
          </span>
        </div>

        {/* Le chiffre, en grand, qui bouge avec les curseurs */}
        <div
          className={[
            "mt-4 rounded-2xl border p-5 text-center transition-colors",
            improves
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-slate-50",
          ].join(" ")}
          aria-live="polite"
        >
          <p className="text-xs font-medium text-slate-500">
            {improves
              ? "Écart annuel avec la carte la moins chère"
              : "Votre carte est déjà bien placée"}
          </p>
          <p
            className={[
              "mt-1 text-5xl font-extrabold tracking-tight tabular-nums",
              improves ? "text-emerald-600" : "text-slate-900",
            ].join(" ")}
          >
            {improves ? formatSignedEur(gain) : formatEur(0)}
            <span className="text-lg font-semibold text-slate-400"> / an</span>
          </p>
          {improves && bestName && (
            <p className="mt-1 text-xs text-slate-500">
              soit l&apos;économie estimée avec {bestName}
            </p>
          )}
        </div>

        {/* Curseur 1 : part des dépenses hors zone euro */}
        <SliderRow
          label="Part de vos dépenses hors zone euro"
          value={`${share} %`}
          input={
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={share}
              onChange={(e) => {
                onInteract();
                setShare(Number(e.target.value));
              }}
              aria-label="Part de vos dépenses hors zone euro, en pourcentage"
              className="w-full accent-indigo-600"
            />
          }
        />

        {/* Curseur 2 : cotisation de la carte actuelle */}
        <SliderRow
          label="Cotisation de votre carte actuelle"
          value={fee === 0 ? "Gratuite" : `${formatEur(fee)} / an`}
          input={
            <input
              type="range"
              min={0}
              max={240}
              step={10}
              value={fee}
              onChange={(e) => {
                onInteract();
                setFee(Number(e.target.value));
              }}
              aria-label="Cotisation annuelle de votre carte actuelle, en euros"
              className="w-full accent-indigo-600"
            />
          }
        />

        <Link
          href="/simulateur"
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Affiner avec le simulateur
        </Link>

        <p className="mt-3 text-[11px] leading-tight text-slate-400">
          Estimation illustrative sur une base de {formatEur(ASSUMED_MONTHLY_SPENDING)}/mois
          de dépenses, hors prime de bienvenue. Le simulateur affine selon vos
          usages réels.
        </p>
      </div>
    </div>
  );
}

/** Ligne de réglage : libellé + valeur courante à droite, curseur dessous. */
function SliderRow({
  label,
  value,
  input,
}: {
  label: string;
  value: string;
  input: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {value}
        </span>
      </div>
      <div className="mt-1.5">{input}</div>
    </div>
  );
}
