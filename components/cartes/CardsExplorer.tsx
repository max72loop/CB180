// components/cartes/CardsExplorer.tsx
// Île CLIENT de la page /cartes : barre de tri + filtres objectifs, rendu de la
// grille, ET sélection de cartes pour la comparaison côte à côte. Le calcul
// (moteur) et les visuels (ProductCardVisual) restent côté SERVEUR : la page
// passe des données déjà chiffrées + le nœud visuel (pattern « slots »). Le rendu
// initial contient donc toutes les cartes (SEO préservé) ; le client filtre,
// réordonne, et gère la sélection de comparaison (persistée en sessionStorage).
//
// Wording IOBSP : filtres, tri et comparaison portent sur des FAITS objectifs.
// Aucun « recommandé », aucune carte mise en avant autrement que par le coût.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatEur } from "@/lib/format";
import type { CardCompareData } from "@/lib/card-compare";
import type { Badge, BadgeId } from "@/lib/card-badges";
import { BADGE_FILTERS } from "@/lib/card-badges";
import type { Card } from "@/lib/types";
import ComparisonModal from "./ComparisonModal";
import CardBadges from "./CardBadges";
import CostEstimator from "./CostEstimator";

/** Donnée d'une carte pour la liste : tout est pré-calculé côté serveur. */
export interface CardListItem {
  id: string;
  name: string;
  issuer: string;
  /** Cotisation lisible (« Gratuite » / « 60 €/an »). */
  fee: string;
  /** Coût annuel net estimé, min et max sur les 3 scénarios d'usage (planchés à 0). */
  minCost: number;
  maxCost: number;
  /** Date de vérification lisible, ou null. */
  verified: string | null;
  /** Atouts de fonctionnalités marquants (déjà bornés côté serveur). */
  highlights: string[];
  // Drapeaux de filtre, dérivés de champs vérifiés.
  isFree: boolean;
  zeroFx: boolean;
  noIncomeCondition: boolean;
  deferredDebit: boolean;
  /** Badges « Best for » éligibles, ordonnés par priorité (affichage : 2 max). */
  badges: Badge[];
  /** Données prêtes à comparer (tableau côte à côte). */
  compare: CardCompareData;
  /** Carte brute, pour le widget d'estimation (calcul moteur côté client). */
  card: Card;
  /** Visuel de la carte, rendu côté serveur et passé tel quel. */
  visual: React.ReactNode;
}

type SortKey = "cout" | "nom";
type FilterKey = "isFree" | "zeroFx" | "noIncomeCondition" | "deferredDebit";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "isFree", label: "Gratuites" },
  { key: "zeroFx", label: "0 % à l'étranger" },
  { key: "noIncomeCondition", label: "Sans condition de revenu" },
  { key: "deferredDebit", label: "Débit différé" },
];

/** Nombre maximum de cartes comparables simultanément. */
const MAX_COMPARE = 3;
const STORAGE_KEY = "cb180:compare";

export default function CardsExplorer({ items }: { items: CardListItem[] }) {
  const [sort, setSort] = useState<SortKey>("cout");
  const [active, setActive] = useState<Set<FilterKey>>(new Set());
  const [activeBadges, setActiveBadges] = useState<Set<BadgeId>>(new Set());

  // Sélection de comparaison : liste d'ids ordonnée, persistée en sessionStorage.
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const loaded = useRef(false);

  // Restauration depuis sessionStorage, une seule fois (après montage, pas de SSR).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) {
        const valid = ids
          .filter((id) => items.some((it) => it.id === id))
          .slice(0, MAX_COMPARE);
        if (valid.length > 0) setSelected(valid);
      }
    } catch {
      /* sessionStorage indisponible : la comparaison marche sans persistance */
    }
  }, [items]);

  // Sauvegarde à chaque changement de sélection.
  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      /* ignore */
    }
  }, [selected]);

  // Message « max 3 » : auto-effacé après quelques secondes.
  useEffect(() => {
    if (!limitMsg) return;
    const t = setTimeout(() => setLimitMsg(null), 4000);
    return () => clearTimeout(t);
  }, [limitMsg]);

  // Ferme le modal si la sélection tombe à zéro (retraits successifs).
  useEffect(() => {
    if (modalOpen && selected.length === 0) setModalOpen(false);
  }, [modalOpen, selected]);

  const shown = useMemo(() => {
    const filtered = items.filter(
      (it) =>
        [...active].every((k) => it[k]) &&
        [...activeBadges].every((bid) => it.badges.some((b) => b.id === bid)),
    );
    return [...filtered].sort((a, b) =>
      sort === "cout"
        ? a.minCost - b.minCost || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
  }, [items, active, activeBadges, sort]);

  const filtersOn = active.size + activeBadges.size;

  function toggle(key: FilterKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleBadge(id: BadgeId) {
    setActiveBadges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setActive(new Set());
    setActiveBadges(new Set());
  }

  const toggleCompare = useCallback(
    (id: string) => {
      const isSel = selected.includes(id);
      if (!isSel && selected.length >= MAX_COMPARE) {
        setLimitMsg(
          `Maximum ${MAX_COMPARE} cartes pour la comparaison. Désélectionnez-en une d'abord.`,
        );
        return;
      }
      setLimitMsg(null);
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [selected],
  );

  const removeCompare = useCallback((id: string) => {
    setSelected((prev) => prev.filter((x) => x !== id));
  }, []);

  const selectedData = useMemo(
    () =>
      selected
        .map((id) => items.find((it) => it.id === id)?.compare)
        .filter((c): c is CardCompareData => Boolean(c)),
    [selected, items],
  );

  return (
    <section className={"mt-12" + (selected.length > 0 ? " pb-28" : "")}>
      {/* ─── Barre de contrôle : tri + filtres objectifs ─── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Affiner
          </span>
          {FILTERS.map((f) => {
            const on = active.has(f.key);
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(f.key)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 " +
                  (on
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-slate-800")
                }
              >
                {f.label}
              </button>
            );
          })}
          {filtersOn > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-sm font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-500">
          Trier&nbsp;:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <option value="cout">Coût réel (croissant)</option>
            <option value="nom">Nom (A→Z)</option>
          </select>
        </label>
      </div>

      {/* Filtres « cas d'usage » : sélection par badge (couleur de la catégorie). */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Cas d&apos;usage
        </span>
        {BADGE_FILTERS.map((b) => {
          const on = activeBadges.has(b.id);
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleBadge(b.id)}
              style={on ? { backgroundColor: b.bg, color: b.fg } : undefined}
              className={
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 " +
                (on
                  ? "border-transparent"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-slate-800")
              }
            >
              <span aria-hidden>{b.emoji}</span>
              {b.short}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        {shown.length} carte{shown.length > 1 ? "s" : ""}
        {filtersOn > 0 ? " correspondant à vos filtres" : ""}
      </p>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm text-slate-500">
            Aucune carte ne réunit tous ces critères. Retirez un filtre pour
            élargir la sélection.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((it) => {
            const isSel = selected.includes(it.id);
            return (
              <li key={it.id} className="relative flex flex-col">
                <Link
                  href={`/cartes/${it.id}`}
                  className={
                    "group flex flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5 " +
                    (isSel ? "border-indigo-400 ring-2 ring-indigo-400" : "border-slate-200")
                  }
                >
                  <div className="p-4">{it.visual}</div>
                  <div className="flex flex-1 flex-col px-4 pb-4">
                    <h2 className="font-semibold text-slate-900">{it.name}</h2>
                    <p className="text-sm text-slate-500">{it.issuer}</p>

                    {/* #1 — Coût réel estimé (le critère du site), en fourchette. */}
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Coût réel estimé
                      </p>
                      <p className="text-lg font-bold tracking-tight text-slate-900">
                        {it.minCost === it.maxCost
                          ? `${formatEur(it.minCost)}/an`
                          : `${formatEur(it.minCost)} – ${formatEur(it.maxCost)}/an`}
                        <span className="ml-1 text-xs font-medium text-slate-400">
                          selon l&apos;usage
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Cotisation {it.fee.toLowerCase()}
                      </p>
                    </div>

                    {/* #2 — Puces de fonctionnalités différenciantes (factuelles). */}
                    {it.highlights.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {it.highlights.map((h) => (
                          <li
                            key={h}
                            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          >
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4">
                      {it.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckIcon className="h-3.5 w-3.5" />
                          Vérifié le {it.verified}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Données indicatives
                        </span>
                      )}
                      <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Voir la fiche →
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bouton « Comparer » : sibling du lien (pas de navigation au clic). */}
                <button
                  type="button"
                  onClick={() => toggleCompare(it.id)}
                  aria-pressed={isSel}
                  aria-label={
                    isSel
                      ? `Retirer ${it.name} de la comparaison`
                      : `Ajouter ${it.name} à la comparaison`
                  }
                  className={
                    "absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 " +
                    (isSel
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white/95 text-slate-600 hover:border-indigo-300 hover:text-slate-800")
                  }
                >
                  {isSel ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ScaleIcon className="h-3.5 w-3.5" />
                  )}
                  {isSel ? "Sélectionnée" : "Comparer"}
                </button>

                {/* Badges « Best for » : 2 max, superposés au bord supérieur gauche. */}
                <CardBadges badges={it.badges.slice(0, 2)} />

                {/* Accordéon d'estimation : le widget n'est monté qu'à l'ouverture. */}
                <CostAccordion card={it.card} />
              </li>
            );
          })}
        </ul>
      )}

      {/* Message « max 3 » (toast, aria-live) */}
      {limitMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
        >
          <p className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {limitMsg}
          </p>
        </div>
      )}

      {/* Barre flottante de sélection (visible dès 1 carte) */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
          <div className="flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
            <p className="text-sm">
              <span className="font-semibold">
                {selected.length} carte{selected.length > 1 ? "s" : ""} sélectionnée
                {selected.length > 1 ? "s" : ""}
              </span>
              {selected.length < 2 && (
                <span className="ml-2 hidden text-slate-300 sm:inline">
                  Ajoutez-en une 2ᵉ pour comparer
                </span>
              )}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                disabled={selected.length < 2}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Voir la comparaison
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selectedData.length > 0 && (
        <ComparisonModal
          cards={selectedData}
          onClose={() => setModalOpen(false)}
          onRemove={removeCompare}
        />
      )}
    </section>
  );
}

/**
 * Accordéon « Estimez votre coût » sous chaque carte. Le widget d'estimation
 * n'est RENDU qu'à l'ouverture : on évite de monter 35 estimateurs d'un coup.
 */
function CostAccordion({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        Estimez votre coût
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={"h-4 w-4 shrink-0 transition-transform " + (open ? "rotate-90" : "")}
        >
          <path
            fillRule="evenodd"
            d="M7.3 4.3a1 1 0 011.4 0l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4-1.4L11.6 10 7.3 5.7a1 1 0 010-1.4z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="mt-2">
          <CostEstimator card={card} bare />
        </div>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16M6 20h12M3 8l3-4 3 4a3 3 0 01-6 0zM15 8l3-4 3 4a3 3 0 01-6 0z"
      />
    </svg>
  );
}
