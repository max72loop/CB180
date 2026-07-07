// components/cartes/CardsExplorer.tsx
// Île CLIENT de la page /cartes : barre de tri + filtres objectifs et rendu de
// la grille. Le calcul (moteur) et les visuels (ProductCardVisual) restent côté
// SERVEUR : la page passe des données déjà chiffrées + le nœud visuel (pattern
// « slots »). Le rendu initial contient donc toutes les cartes (SEO préservé) ;
// le client ne fait que filtrer/réordonner.
//
// Wording IOBSP : les filtres et le tri portent sur des FAITS objectifs (coût,
// gratuité, frais de change, condition de revenu, type de débit). Aucun
// « recommandé », aucune carte mise en avant autrement que par le coût.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEur } from "@/lib/format";

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

export default function CardsExplorer({ items }: { items: CardListItem[] }) {
  const [sort, setSort] = useState<SortKey>("cout");
  const [active, setActive] = useState<Set<FilterKey>>(new Set());

  const shown = useMemo(() => {
    const filtered = items.filter((it) => [...active].every((k) => it[k]));
    return [...filtered].sort((a, b) =>
      sort === "cout"
        ? a.minCost - b.minCost || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    );
  }, [items, active, sort]);

  function toggle(key: FilterKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="mt-12">
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
          {active.size > 0 && (
            <button
              type="button"
              onClick={() => setActive(new Set())}
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

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        {shown.length} carte{shown.length > 1 ? "s" : ""}
        {active.size > 0 ? " correspondant à vos filtres" : ""}
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
          {shown.map((it) => (
            <li key={it.id}>
              <Link
                href={`/cartes/${it.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5"
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
            </li>
          ))}
        </ul>
      )}
    </section>
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
