"use client";

// components/results/TiebreakByFeatures.tsx
// Mini-parcours de DÉPARTAGE branché après le classement quand plusieurs cartes
// ressortent à COÛT ÉGAL (souvent 0 €/an sur un profil simple). Le coût ne tranche
// plus rien : on laisse l'utilisateur cocher les fonctionnalités qui comptent
// (chéquier, sous-comptes, dépôt d'espèces…) et on RECLASSE les seules cartes ex
// æquo selon ces critères. On n'expose que les fonctionnalités qui les
// différencient réellement (distinguishingFeatures), donc chaque case a un effet.
//
// Wording IOBSP : le classement principal reste trié objectivement par coût. Ici
// on décrit des faits (« telle carte offre le chéquier ») et on réordonne à la
// demande de l'utilisateur ; jamais « recommandé pour vous ».

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCardVisual } from "@/components/brand/CardVisual";
import { comparisonSlug } from "@/lib/card-display";
import {
  distinguishingFeatures,
  featureMatchCount,
  type BoolFeatureKey,
} from "@/lib/card-features";
import type { RankedCard } from "@/lib/types";
import { formatEur } from "@/lib/format";

interface TiebreakByFeaturesProps {
  /** Cartes à coût égal (≥ 2), déjà filtrées et triées par le parent. */
  cards: RankedCard[];
  /** Coût annuel récurrent commun à ces cartes (pour l'intitulé). */
  costEur: number;
}

export default function TiebreakByFeatures({
  cards,
  costEur,
}: TiebreakByFeaturesProps) {
  // Fonctionnalités qui séparent RÉELLEMENT ces cartes ex æquo (sinon la case
  // n'aurait aucun effet). Ordre stable, calculé une fois.
  const options = useMemo(
    () => distinguishingFeatures(cards.map((r) => r.card)),
    [cards],
  );

  const [selected, setSelected] = useState<Set<BoolFeatureKey>>(new Set());
  const selectedKeys = useMemo(() => [...selected], [selected]);

  // Reclassement des ex æquo : plus la carte coche de critères sélectionnés,
  // plus elle remonte. Sort stable ⇒ à score égal, l'ordre d'entrée est conservé.
  const ordered = useMemo(() => {
    if (selectedKeys.length === 0) return cards;
    return [...cards].sort(
      (a, b) =>
        featureMatchCount(b.card, selectedKeys) -
        featureMatchCount(a.card, selectedKeys),
    );
  }, [cards, selectedKeys]);

  function toggle(key: BoolFeatureKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Deux meilleures cartes ex æquo « offrables » pour le lien comparatif SEO.
  const comparable = cards
    .map((r) => r.card)
    .filter((c) => c.affiliate.network != null);
  const compareHref =
    comparable.length >= 2
      ? `/comparatif/${comparisonSlug(comparable[0].id, comparable[1].id)}`
      : null;

  // Rien à départager (une seule vraie différence absente) ⇒ le parent ne monte
  // pas ce bloc, mais on reste défensif.
  if (cards.length < 2 || options.length === 0) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
      <div className="space-y-1">
        <p className="text-sm font-medium text-indigo-600">
          Départager les cartes à coût égal
        </p>
        <h3 className="text-lg font-semibold text-slate-900">
          {cards.length} cartes ressortent à {formatEur(costEur)}/an
        </h3>
        <p className="text-xs leading-relaxed text-slate-600">
          À coût identique, ce qui les distingue, ce sont leurs fonctionnalités.
          Cochez celles qui comptent pour vous : les cartes qui les offrent
          remontent. Un tri à la demande, pas un conseil.
        </p>
      </div>

      {/* Cases de critères : uniquement celles qui séparent ces cartes. */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.has(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(opt.key)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1",
                on
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  on ? "border-white/70 bg-white/20" : "border-slate-300",
                ].join(" ")}
                aria-hidden
              >
                {on && <CheckIcon className="h-3 w-3" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Cartes ex æquo, reclassées en direct. */}
      <ol className="space-y-2.5">
        {ordered.map((row) => {
          const matched = options.filter(
            (o) => selected.has(o.key) && featureMatchCount(row.card, [o.key]) === 1,
          );
          const fullMatch =
            selectedKeys.length > 0 &&
            featureMatchCount(row.card, selectedKeys) === selectedKeys.length;
          return (
            <li
              key={row.card.id}
              className={[
                "rounded-xl border bg-white p-3.5 transition-colors",
                fullMatch
                  ? "border-emerald-300 ring-1 ring-emerald-200"
                  : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <ProductCardVisual card={row.card} size="sm" className="mt-0.5" />
                  <div className="min-w-0">
                    <Link
                      href={`/cartes/${row.card.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-600"
                    >
                      {row.card.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate-500">{row.card.issuer}</p>
                    {matched.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {matched.map((m) => (
                          <li
                            key={m.key}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          >
                            <CheckIcon className="h-3 w-3 shrink-0" />
                            {m.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatEur(costEur)}
                    <span className="text-xs font-normal text-slate-500"> / an</span>
                  </p>
                  {fullMatch && (
                    <p className="mt-0.5 text-xs font-medium text-emerald-600">
                      offre tout ce que vous avez coché
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {compareHref && (
        <Link
          href={compareHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Comparer ces cartes en détail
          <span aria-hidden>→</span>
        </Link>
      )}
    </section>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
