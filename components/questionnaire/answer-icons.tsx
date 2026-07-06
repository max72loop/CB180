// components/questionnaire/answer-icons.tsx
// Bibliothèque d'icônes SVG inline pour les cartes-réponses du simulateur.
//
// Zéro dépendance externe (cohérent avec l'auto-suffisance du repo et le style
// de IntroScreen). Toutes les icônes héritent de `currentColor` : la couleur est
// pilotée par la tuile d'AnswerCard (indigo au repos, blanc si sélectionné).
//
// Deux familles :
//   • un « mètre » à barres (magnitude/fréquence) qui encode visiblement le
//     niveau : plus de barres pleines = plus élevé. Réutilisé par les questions
//     ordinales (dépenses, part hors euro, retraits, revenu, cotisation), ce qui
//     forme un langage cohérent tout au long du parcours.
//   • des glyphes dédiés pour les options qualitatives (récompenses) et les
//     options « à part » (gratuite / je ne sais pas / je préfère ne pas répondre).
//
// La correspondance (questionId, optionId) → icône est purement présentationnelle
// et vit ici, séparée de la table métier de lib/answers.ts.

import type { QuestionId } from "@/lib/answers";

interface GlyphProps {
  className?: string;
}

/** Cadre SVG commun : trait, coins arrondis, hérite de la couleur du parent. */
function Svg({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/**
 * Mètre à barres : `level` barres pleines sur `count`, les autres en creux.
 * Encode une magnitude ou une fréquence de façon immédiatement lisible.
 */
function BarsGlyph({ level, count = 5, className }: GlyphProps & { level: number; count?: number }) {
  const bars = Array.from({ length: count }, (_, i) => i);
  const minH = 4;
  const maxH = 15;
  return (
    <Svg className={className}>
      {bars.map((i) => {
        const h = count === 1 ? maxH : minH + (i * (maxH - minH)) / (count - 1);
        const x = 3.5 + i * (17 / count);
        const y = 20 - h;
        const filled = i < level;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={17 / count - 1.6}
            height={h}
            rx={1}
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={filled ? 0 : 1.4}
            opacity={filled ? 1 : 0.35}
          />
        );
      })}
    </Svg>
  );
}

/** Point d'interrogation (« je ne sais pas »). */
function QuestionGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 015.4 1c0 1.9-2.6 2.2-2.6 4" />
      <circle cx="12" cy="17.4" r="0.4" fill="currentColor" stroke="currentColor" />
    </Svg>
  );
}

/** Œil barré (confidentialité, « je préfère ne pas répondre »). */
function EyeOffGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M4 12s3-6 8-6c1.3 0 2.5.4 3.6 1" />
      <path d="M20 12s-3 6-8 6c-1.3 0-2.5-.4-3.6-1" />
      <path d="M9.5 9.7a3.2 3.2 0 004.6 4.4" />
      <path d="M4 4l16 16" />
    </Svg>
  );
}

/** Cadeau (miles / cashback : « oui, j'optimise »). */
function GiftGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="9.5" width="16" height="4" rx="1" />
      <path d="M5.5 13.5V20h13v-6.5" />
      <path d="M12 9.5V20" />
      <path d="M12 9.5C9 9.5 8 8 8 6.7A2.2 2.2 0 0112 5.5a2.2 2.2 0 014 1.2c0 1.3-1 2.8-4 2.8z" />
    </Svg>
  );
}

/** Tirelire (« payer le moins possible »). */
function PiggyGlyph({ className }: GlyphProps) {
  return (
    <Svg className={className}>
      <path d="M20 12.5c0 3-2.9 5.3-6.5 5.3-.7 0-1.4-.1-2-.3L9 19v-2.1A5 5 0 015.5 12.5C5.5 9.5 8.4 7 12 7s8 1.7 8 5.5z" />
      <path d="M20 11.5c.8 0 1.3.7 1.3 1.4s-.5 1.4-1.3 1.4" />
      <circle cx="15.5" cy="11.5" r="0.5" fill="currentColor" stroke="currentColor" />
      <path d="M10 8.5c.6-1 2.4-1 3 0" />
      <path d="M7.5 15.5V18" />
    </Svg>
  );
}

/**
 * Résout l'icône d'une option. La magnitude des questions ordinales est encodée
 * par le nombre de barres pleines ; les options qualitatives et « à part » ont
 * un glyphe dédié. Un mètre à mi-niveau sert de repli défensif.
 */
export function AnswerIcon({
  qid,
  optionId,
  className,
}: {
  qid: QuestionId;
  optionId: string;
  className?: string;
}) {
  switch (qid) {
    // Questions ordinales : le suffixe numérique de l'id = le niveau du mètre.
    case "monthlySpending": // s1..s5
    case "foreignShare": // f1..f5
    case "foreignWithdrawals": // w1..w5 (w1 = jamais → 0 barre)
    case "income": {
      if (optionId === "i_skip") return <EyeOffGlyph className={className} />;
      const n = Number(optionId.slice(1));
      // w1 « Jamais » : niveau 0 (toutes barres en creux).
      const zeroFirst = qid === "foreignWithdrawals";
      const level = Number.isFinite(n) ? (zeroFirst ? n - 1 : n) : 3;
      return <BarsGlyph level={level} className={className} />;
    }
    case "currentFee": {
      if (optionId === "c1") return <BarsGlyph level={0} className={className} />; // gratuite
      if (optionId === "c6") return <QuestionGlyph className={className} />; // je ne sais pas
      const n = Number(optionId.slice(1)); // c2..c5 → 1..4
      return <BarsGlyph level={Number.isFinite(n) ? n - 1 : 3} count={4} className={className} />;
    }
    case "rewardsInterest":
      return optionId === "r1" ? (
        <GiftGlyph className={className} />
      ) : (
        <PiggyGlyph className={className} />
      );
    default:
      return <BarsGlyph level={3} className={className} />;
  }
}
