// components/questionnaire/QuestionStep.tsx
// Une question par écran : intitulé, aide, options en gros boutons tactiles.
// Présentationnel : ne gère pas l'état, remonte la sélection au parent.
// Accessibilité : groupe de type radio (choix unique), focus clavier visible.

import type { Question } from "@/lib/answers";

interface QuestionStepProps {
  question: Question;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  /** Désactive les options pendant la transition d'auto-avance. */
  disabled?: boolean;
}

export default function QuestionStep({
  question,
  selectedOptionId,
  onSelect,
  disabled = false,
}: QuestionStepProps) {
  const titleId = `q-${question.id}-title`;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 id={titleId} className="text-2xl font-bold tracking-tight text-slate-900">
          {question.title}
        </h2>
        {question.help && (
          <p className="text-sm leading-relaxed text-slate-500">
            {question.help}
          </p>
        )}
      </div>

      <ul role="radiogroup" aria-labelledby={titleId} className="space-y-3">
        {question.options.map((option) => {
          const selected = option.id === selectedOptionId;
          return (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onSelect(option.id)}
                className={[
                  "flex w-full min-h-[64px] items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
                  "disabled:cursor-default",
                  selected
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 active:bg-slate-100",
                ].join(" ")}
              >
                <span>
                  <span className="block text-base font-semibold text-slate-900">
                    {option.label}
                  </span>
                  {option.hint && (
                    <span className="block text-sm text-slate-500">
                      {option.hint}
                    </span>
                  )}
                </span>
                <span
                  className={[
                    "ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300",
                  ].join(" ")}
                  aria-hidden
                >
                  {selected && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
