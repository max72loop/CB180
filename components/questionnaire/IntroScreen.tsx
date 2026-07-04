// components/questionnaire/IntroScreen.tsx
// Priorité 1 — écran d'accroche avant la première question.
// Pose la promesse et un contrat borné (nb de questions, durée, aucune donnée
// bancaire) pour augmenter le taux de démarrage. Un seul appel à l'action.
// Wording : on informe, on ne conseille pas ; on rassure sur la confidentialité.

interface IntroScreenProps {
  /** Nombre de questions du quick win (première estimation), annoncé en clair. */
  quickCount: number;
  /** Nombre de cartes du panel comparé (dérivé du catalogue, évite la dérive). */
  cardCount: number;
  onStart: () => void;
}

/** Petit repère du contrat (icône + texte court). */
function ContractChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
        aria-hidden
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-slate-700">{children}</span>
    </li>
  );
}

export default function IntroScreen({
  quickCount,
  cardCount,
  onStart,
}: IntroScreenProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-indigo-600">
            Simulateur gratuit et anonyme
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
            Découvrez en 30 secondes si votre carte vous coûte de l&apos;argent
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            {quickCount} questions suffisent pour un premier écart chiffré. On le
            compare, en toute transparence, à {cardCount} cartes du marché. Une
            information claire, pas un conseil.
          </p>
        </div>

        {/* Contrat borné : ce que l'utilisateur s'engage à faire, sans surprise. */}
        <ul className="mt-8 space-y-3">
          <ContractChip
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 4a1 1 0 10-2 0v4a1 1 0 00.3.7l2.5 2.5a1 1 0 001.4-1.4L11 9.6V6z" />
              </svg>
            }
          >
            {quickCount} questions pour une première estimation (≈ 30 s)
          </ContractChip>
          <ContractChip
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M10 1l7 3v5c0 4.4-3 8.4-7 9.9C6 17.4 3 13.4 3 9V4l7-3zm3.7 6.3a1 1 0 00-1.4-1.4L9 9.2 7.7 7.9a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            Aucune donnée bancaire, aucun numéro de carte demandé
          </ContractChip>
          <ContractChip
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            Anonyme : ni identité, ni nom de banque enregistrés
          </ContractChip>
        </ul>
      </div>

      <div className="mt-10 space-y-3">
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-xl bg-brand px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Commencer la simulation
        </button>
        <p className="text-center text-xs leading-relaxed text-slate-500">
          Vos réponses restent sur votre appareil le temps de la simulation.
          Aucun compte à créer.
        </p>
      </div>
    </div>
  );
}
