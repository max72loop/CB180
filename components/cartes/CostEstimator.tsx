"use client";

// components/cartes/CostEstimator.tsx
// Mini-widget « Estimez votre coût » embarqué sur une carte : deux sliders
// (dépenses mensuelles + part en devises) et le coût annuel RÉEL de la carte,
// recalculé en direct. Le calcul passe par le moteur pur (lib/engine), la MÊME
// source que le classement et la fiche : les chiffres restent cohérents partout.
//
// Wording IOBSP : un coût chiffré et sa décomposition, jamais « recommandé ».
// Aucun appel réseau, aucun stockage : 100 % en mémoire.

import { useEffect, useMemo, useRef, useState } from "react";
import { computeAnnualCost } from "@/lib/engine";
import { buildProfile } from "@/lib/scenarios";
import { formatEur } from "@/lib/format";
import type { Card } from "@/lib/types";

interface CostEstimatorProps {
  card: Card;
  /** Fond/ombre allégés quand le widget vit déjà dans un encart (accordéon). */
  bare?: boolean;
}

const SPENDING_MIN = 200;
const SPENDING_MAX = 10000;
const SPENDING_STEP = 100;
const SPENDING_DEFAULT = 1500;
const FOREIGN_DEFAULT = 10; // en %

/** Couleurs du remplissage de piste (primaire → gris). */
const FILL = "#4f46e5";
const TRACK = "#e2e8f0";

/** Détecte la préférence « animations réduites ». */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

/** Anime la valeur affichée de l'ancienne vers la nouvelle (easeOut), instantané si motion réduite. */
function useTween(target: number, ms = 220): number {
  const reduce = usePrefersReducedMotion();
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduce) {
      setVal(target);
      from.current = target;
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const initial = from.current;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(initial + (target - initial) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduce]);
  return val;
}

/** Style de piste avec remplissage jusqu'à `pct` (couleur primaire), reste en gris. */
function trackStyle(pct: number): React.CSSProperties {
  return {
    background: `linear-gradient(to right, ${FILL} 0%, ${FILL} ${pct}%, ${TRACK} ${pct}%, ${TRACK} 100%)`,
  };
}

export default function CostEstimator({ card, bare = false }: CostEstimatorProps) {
  const [spending, setSpending] = useState(SPENDING_DEFAULT);
  const [foreignPct, setForeignPct] = useState(FOREIGN_DEFAULT);
  const [showDetail, setShowDetail] = useState(false);

  // Décomposition via le moteur pur. On suppose 1 retrait/mois hors zone euro
  // dès qu'il y a des dépenses en devises (0 sinon), aligné sur l'esprit du widget.
  const breakdown = useMemo(() => {
    const profile = buildProfile({
      monthlySpendingEur: spending,
      foreignSpendingShare: foreignPct / 100,
      foreignWithdrawalsPerMonth: foreignPct > 0 ? 1 : 0,
    });
    return computeAnnualCost(card, profile);
  }, [card, spending, foreignPct]);

  const perks =
    breakdown.cashbackValueEur +
    breakdown.welcomeBonusAmortizedEur +
    breakdown.rewardsValueEur;
  const net = breakdown.netAnnualCostEur;
  const tweened = useTween(net);
  const shownCost = Math.max(0, Math.round(tweened));

  // Annonce lecteur d'écran, débouncée 500 ms pour ne pas spammer au drag.
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    const id = setTimeout(
      () => setAnnounce(`Coût annuel estimé : ${formatEur(Math.max(0, Math.round(net)))}`),
      500,
    );
    return () => clearTimeout(id);
  }, [net]);

  const spendingPct = ((spending - SPENDING_MIN) / (SPENDING_MAX - SPENDING_MIN)) * 100;

  return (
    <div
      className={
        bare
          ? "rounded-xl bg-slate-50 p-4"
          : "rounded-xl border border-slate-200 bg-slate-50 p-4"
      }
    >
      <h3 className="text-sm font-semibold text-slate-900">
        Combien cette carte vous coûterait réellement
      </h3>

      {/* Slider 1 : dépenses mensuelles */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`spend-${card.id}`} className="text-xs font-medium text-slate-600">
            Dépenses mensuelles par carte
          </label>
          <span className="text-sm font-bold tabular-nums text-slate-900">
            {formatEur(spending)}
          </span>
        </div>
        <input
          id={`spend-${card.id}`}
          type="range"
          min={SPENDING_MIN}
          max={SPENDING_MAX}
          step={SPENDING_STEP}
          value={spending}
          onChange={(e) => setSpending(Number(e.target.value))}
          style={trackStyle(spendingPct)}
          aria-valuetext={`${formatEur(spending)} par mois`}
          className="cb-range mt-2"
        />
      </div>

      {/* Slider 2 : part en devises */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`fx-${card.id}`} className="text-xs font-medium text-slate-600">
            Part en devises étrangères
          </label>
          <span className="text-sm font-bold tabular-nums text-slate-900">
            {foreignPct} %
          </span>
        </div>
        <input
          id={`fx-${card.id}`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={foreignPct}
          onChange={(e) => setForeignPct(Number(e.target.value))}
          style={trackStyle(foreignPct)}
          aria-valuetext={`${foreignPct} % en devises`}
          className="cb-range mt-2"
        />
      </div>

      {/* Résultat */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Votre coût annuel estimé
        </p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">
          {formatEur(shownCost)}
          <span className="text-sm font-medium text-slate-400"> / an</span>
        </p>
        {net < 0 && (
          <p className="text-xs font-medium text-emerald-600">
            soit un gain estimé de {formatEur(Math.abs(Math.round(net)))}/an (prime et cashback amortis)
          </p>
        )}

        {/* Détail du calcul : masqué par défaut sur mobile (bouton), visible dès sm. */}
        <button
          type="button"
          onClick={() => setShowDetail((v) => !v)}
          aria-expanded={showDetail}
          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 sm:hidden"
        >
          {showDetail ? "Masquer le détail" : "Voir le détail"}
        </button>
        <dl
          className={
            (showDetail ? "block " : "hidden ") +
            "mt-2 space-y-1 text-xs text-slate-500 sm:block"
          }
        >
          <Row label="Cotisation" value={formatEur(breakdown.annualFeeEur)} />
          <Row label="Frais de change estimés" value={formatEur(breakdown.fxFeeEur)} />
          {breakdown.foreignWithdrawalFeeEur > 0 && (
            <Row
              label="Frais retrait DAB estimés"
              value={formatEur(breakdown.foreignWithdrawalFeeEur)}
            />
          )}
          {perks > 0 && (
            <div className="flex justify-between font-medium text-emerald-600">
              <dt>Avantages estimés</dt>
              <dd>−{formatEur(Math.round(perks))}</dd>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        Estimation sur les frais officiels de la carte. Hypothèses : retrait moyen
        100 €, ~1 retrait/mois hors zone euro, prime amortie sur 3 ans.
      </p>

      {/* Annonce lecteur d'écran (débouncée). */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums text-slate-600">{value}</dd>
    </div>
  );
}
