// components/questionnaire/AnswerCard.tsx
// Carte-réponse illustrée : tuile d'icône + libellé + précision, en grand bouton
// tactile. Présentationnel pur (aucun état). Sert mobile ET desktop via la même
// structure : pleine largeur empilée sur mobile, la grille est gérée par le parent.
//
// Trois états visuels distincts :
//   • sélectionné  : aplat indigo, tuile pleine, coche.
//   • focus clavier : anneau indigo clair (navigation ↑ ↓, sans souris).
//   • repos/hover  : bordure neutre, tuile indigo pâle.
//
// Le badge numéroté (1..9), visible seulement sur desktop, annonce le raccourci
// clavier sans jamais l'imposer : le tap reste la voie principale.

import { AnswerIcon } from "./answer-icons";
import type { QuestionId } from "@/lib/answers";

interface AnswerCardProps {
  qid: QuestionId;
  optionId: string;
  label: string;
  hint?: string;
  /** Rang 1-indexé dans la liste (badge de raccourci clavier). */
  index: number;
  selected: boolean;
  /** Ciblé par la navigation clavier (flèches), sans être encore validé. */
  focused: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export default function AnswerCard({
  qid,
  optionId,
  label,
  hint,
  index,
  selected,
  focused,
  disabled = false,
  onSelect,
}: AnswerCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={-1}
      disabled={disabled}
      data-focused={focused || undefined}
      onClick={onSelect}
      className={[
        "group flex w-full min-h-[68px] items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all sm:px-5",
        "focus:outline-none disabled:cursor-default",
        selected
          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600"
          : focused
            ? "border-indigo-400 bg-white ring-2 ring-indigo-300"
            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 active:bg-slate-100",
      ].join(" ")}
    >
      {/* Tuile d'icône : indigo pâle au repos, pleine si sélectionnée. */}
      <span
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
          selected
            ? "bg-indigo-600 text-white"
            : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
        ].join(" ")}
        aria-hidden
      >
        <AnswerIcon qid={qid} optionId={optionId} className="h-6 w-6" />
      </span>

      {/* Libellé + précision */}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-slate-900">
          {label}
        </span>
        {hint && <span className="block text-sm text-slate-500">{hint}</span>}
      </span>

      {/* À droite : coche si sélectionné, sinon badge de raccourci (desktop). */}
      {selected ? (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white"
          aria-hidden
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      ) : (
        index <= 9 && (
          <span
            className={[
              "hidden h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold md:flex",
              focused
                ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-500",
            ].join(" ")}
            aria-hidden
          >
            {index}
          </span>
        )
      )}
    </button>
  );
}
