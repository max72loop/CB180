// components/questionnaire/StepRail.tsx
// Rail vivant du questionnaire (desktop uniquement) : stepper vertical des 6
// étapes, résumé « votre profil se dessine » qui se remplit à chaque réponse,
// puis rassurance + astuce clavier. Présentationnel pur, aucun état.

import {
  DISPLAY_ORDER,
  SHORT_LABELS,
  answerChips,
  type Answers,
} from "@/lib/answers";

interface StepRailProps {
  /** Toutes les réponses déjà données (alimente le bloc profil). */
  answers: Answers;
  /** Index 0-based de la question courante dans DISPLAY_ORDER. */
  stepIndex: number;
  /** Frontière de phase : les `quickCount` premières étapes = estimation express. */
  quickCount: number;
  /** Nombre d'options de la question courante (astuce clavier « 1-N »). */
  optionCount: number;
}

type StepState = "done" | "current" | "upcoming";

function stepState(i: number, stepIndex: number): StepState {
  if (i < stepIndex) return "done";
  if (i === stepIndex) return "current";
  return "upcoming";
}

/** Pastille d'étape : pleine + coche (done), anneau (current), creuse (upcoming). */
function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors"
        aria-hidden
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600 bg-white ring-4 ring-indigo-100 transition-colors"
        aria-hidden
      >
        <span className="h-2 w-2 rounded-full bg-indigo-600" />
      </span>
    );
  }
  return (
    <span
      className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-200 bg-white transition-colors"
      aria-hidden
    />
  );
}

/** Groupe d'étapes d'une phase, avec mini-intitulé de section et traits de liaison. */
function StepGroup({
  title,
  startIndex,
  count,
  stepIndex,
}: {
  title: string;
  startIndex: number;
  count: number;
  stepIndex: number;
}) {
  const ids = DISPLAY_ORDER.slice(startIndex, startIndex + count);
  return (
    <div>
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <ol className="mt-2">
        {ids.map((qid, k) => {
          const i = startIndex + k;
          const state = stepState(i, stepIndex);
          return (
            <li key={qid}>
              <div
                className={[
                  "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                  state === "current" ? "bg-indigo-50" : "",
                ].join(" ")}
                aria-current={state === "current" ? "step" : undefined}
              >
                <StepDot state={state} />
                <span
                  className={[
                    "text-sm transition-colors",
                    state === "current"
                      ? "font-semibold text-indigo-700"
                      : state === "done"
                        ? "text-slate-700"
                        : "text-slate-400",
                  ].join(" ")}
                >
                  {SHORT_LABELS[qid]}
                </span>
              </div>
              {/* Trait de liaison vers l'étape suivante (indigo une fois franchie). */}
              {k < ids.length - 1 && (
                <span
                  className={[
                    "ml-[19.5px] block h-3 w-px transition-colors",
                    i < stepIndex ? "bg-indigo-600" : "bg-slate-200",
                  ].join(" ")}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function StepRail({
  answers,
  stepIndex,
  quickCount,
  optionCount,
}: StepRailProps) {
  const chips = answerChips(answers);
  const total = DISPLAY_ORDER.length;

  return (
    <aside className="hidden md:sticky md:top-28 md:flex md:flex-col md:self-start">
      {/* 1. Stepper vertical, en deux phases. */}
      <nav aria-label="Étapes du questionnaire" className="space-y-4">
        <StepGroup
          title="Estimation express"
          startIndex={0}
          count={quickCount}
          stepIndex={stepIndex}
        />
        <StepGroup
          title="Affinage"
          startIndex={quickCount}
          count={total - quickCount}
          stepIndex={stepIndex}
        />
      </nav>

      {/* 2. Le profil qui se dessine : se remplit visiblement à chaque réponse. */}
      <div className="mt-8 border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-500">
          Votre profil se dessine
        </p>
        {chips.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            Vos réponses apparaîtront ici.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {chips.map((chip) => (
              <li
                key={chip.qid}
                className="animate-step flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="shrink-0 text-slate-400">{chip.label}</span>
                <span className="text-right font-medium text-slate-700">
                  {chip.value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Rassurance + astuce clavier. */}
      <div className="mt-8">
        <p className="text-xs leading-relaxed text-slate-400">
          Aucune donnée identifiante, aucun nom de banque demandé.
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-slate-500">
            1-{Math.min(optionCount, 9)}
          </kbd>
          <span>ou</span>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-slate-500">
            ↑
          </kbd>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-slate-500">
            ↓
          </kbd>
          <span>puis</span>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-slate-500">
            Entrée
          </kbd>
        </p>
      </div>
    </aside>
  );
}
