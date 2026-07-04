// components/questionnaire/ProgressBar.tsx
// Priorité 3 : barre de progression concrète et permanente. Purement présentationnel.
//
// Le libellé montre un PAS CONCRET (« Question 3 sur 8 ») plutôt qu'un pourcentage
// abstrait. Le remplissage suit le nombre de réponses données (`current`) pour
// avancer visiblement à CHAQUE réponse : renforcement positif.

interface ProgressBarProps {
  /** Nombre de réponses déjà données (pilote le remplissage). */
  current: number;
  /** Numéro de la question affichée, 1-indexé (pilote le libellé). */
  step: number;
  total: number;
}

export default function ProgressBar({ current, step, total }: ProgressBarProps) {
  const answered = Math.max(0, Math.min(current, total));
  const stepLabel = Math.min(Math.max(step, 1), total);
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-700">
          Question {stepLabel} sur {total}
        </span>
        <span className="text-slate-400">
          {answered}/{total} répondu{answered > 1 ? "es" : "e"}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Question ${stepLabel} sur ${total}`}
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
