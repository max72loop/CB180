// components/questionnaire/CalculatingScreen.tsx
// Priorité 8 — écran de transition (quelques secondes) entre la dernière
// question et le résultat. Aucune publicité : ce temps sert à renforcer
// l'attente positive et la valeur perçue du résultat. Wording informatif.

interface CalculatingScreenProps {
  /** Nombre de cartes du panel comparé (dérivé du catalogue, évite la dérive). */
  cardCount: number;
}

export default function CalculatingScreen({ cardCount }: CalculatingScreenProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center"
      role="status"
      aria-live="polite"
    >
      {/* Anneau de progression indéterminé (désactivé si reduced-motion). */}
      <span className="calc-spinner" aria-hidden>
        <svg viewBox="0 0 48 48" className="h-14 w-14">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-200"
          />
          <path
            d="M24 4a20 20 0 0120 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-indigo-600"
          />
        </svg>
      </span>

      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
        On calcule votre audit…
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
        On chiffre le coût réel de votre situation et on le compare aux{" "}
        {cardCount} cartes du marché, poste par poste.
      </p>
      <p className="mt-6 text-xs font-medium text-slate-400">
        Classement établi objectivement, sans « recommandé pour vous ».
      </p>
    </div>
  );
}
