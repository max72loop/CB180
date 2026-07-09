"use client";

// components/cartes/ComparisonModal.tsx
// Modal de comparaison côte à côte de 2 à 3 cartes sélectionnées sur /cartes.
// Une colonne par carte, une ligne par caractéristique (lib/card-compare). La
// meilleure valeur objective d'une ligne est mise en avant quand elle diffère.
// Accessibilité : role="dialog" + aria-modal, focus trap, Échap / clic overlay
// pour fermer, colonne de libellés fixe au scroll horizontal (mobile).

import { useEffect, useRef } from "react";
import {
  COMPARE_ROWS,
  bestIndices,
  rowHasData,
  type CardCompareData,
} from "@/lib/card-compare";

interface ComparisonModalProps {
  cards: CardCompareData[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export default function ComparisonModal({
  cards,
  onClose,
  onRemove,
}: ComparisonModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap + Échap + restitution du focus au déclencheur.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Empêche le scroll de l'arrière-plan pendant l'ouverture.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  // Colonnes = cartes ; lignes = caractéristiques renseignées par au moins une carte.
  const rows = COMPARE_ROWS.filter((r) => rowHasData(r, cards));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Comparaison de cartes"
        className="flex max-h-[90vh] w-[90vw] max-w-[1200px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête du modal */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Comparaison de {cards.length} carte{cards.length > 1 ? "s" : ""}
            </h2>
            <p className="text-xs text-slate-500">
              Caractéristiques factuelles. La meilleure valeur de chaque ligne est
              surlignée. Ce n&apos;est pas un conseil.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la comparaison"
            className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Indicateur de scroll horizontal (mobile) */}
        <p className="px-5 pt-3 text-xs text-slate-600 sm:hidden">
          Faites glisser le tableau horizontalement pour tout voir →
        </p>

        {/* Tableau comparatif, scrollable horizontalement */}
        <div className="overflow-auto px-5 py-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 min-w-[8.5rem] bg-white p-2 text-left align-bottom"
                >
                  <span className="sr-only">Caractéristique</span>
                </th>
                {cards.map((c) => (
                  <th
                    key={c.id}
                    scope="col"
                    className="min-w-[10rem] border-b border-slate-200 p-2 text-left align-bottom"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs font-medium text-slate-500">
                          {c.network}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(c.id)}
                        aria-label={`Retirer ${c.name} de la comparaison`}
                        className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const best = bestIndices(row, cards);
                const zebra = rowIdx % 2 === 1;
                return (
                  <tr key={row.id}>
                    <th
                      scope="row"
                      className={[
                        "sticky left-0 z-10 p-2 text-left align-top font-medium text-slate-600",
                        zebra ? "bg-slate-50" : "bg-white",
                      ].join(" ")}
                    >
                      {row.label}
                    </th>
                    {cards.map((c, colIdx) => {
                      const v = row.value(c);
                      const isBest = best.has(colIdx);
                      return (
                        <td
                          key={c.id}
                          className={[
                            "p-2 align-top",
                            isBest
                              ? "bg-emerald-50 font-bold text-emerald-800"
                              : zebra
                                ? "bg-slate-50 text-slate-700"
                                : "bg-white text-slate-700",
                          ].join(" ")}
                        >
                          <CellValue value={v} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Rendu d'une cellule : « — » si vide, liste à puces si avantages, texte sinon. */
function CellValue({ value }: { value: string | string[] | null }) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-slate-500">—</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((v) => (
          <li key={v} className="leading-snug">
            {v}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{value}</span>;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 01-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
