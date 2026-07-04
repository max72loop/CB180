// lib/card-brand.ts
// Identité visuelle par carte pour le rendu « fidèle à la marque » : couleurs,
// wordmark de l'émetteur, teinte de puce ET motif distinctif. Utilisé par
// ProductCardVisual comme REPLI tant qu'aucune image officielle (card.image)
// n'est fournie.
//
// Important : ce sont des visuels ORIGINAUX (dessinés en CSS/SVG) qui reprennent
// les couleurs et l'esprit de chaque carte, PAS des reproductions des visuels
// officiels copyrightés. Aucun logo de marque/réseau n'est reproduit.

import type { Card } from "./types";
import { toneForTier, type CardTone } from "./card-display";

/** Motif de fond distinctif rendu par-dessus la couleur de la carte. */
export type CardPatternKind =
  | "plain"
  | "diagonal"
  | "waves"
  | "guilloche"
  | "edge"
  | "geo"
  | "airfrance";

export interface CardBrand {
  /** Fond CSS (dégradé ou couleur). */
  background: string;
  /** Couleur du texte sur ce fond. */
  foreground: string;
  /** Nom court de l'émetteur, affiché en haut de la carte. */
  wordmark: string;
  /** Teinte de la puce EMV. */
  chip: "gold" | "silver";
  /** Motif de fond. */
  pattern: CardPatternKind;
  /** Couleur d'accent du motif (défaut : blanc translucide). */
  accent?: string;
}

const WHITE = "#ffffff";

/** Config par identifiant de carte (couleurs de marque publiques, motif original). */
export const CARD_BRAND: Record<string, CardBrand> = {
  "boursobank-welcome": {
    background: "linear-gradient(135deg,#ff2e7e 0%,#c40064 100%)",
    foreground: WHITE,
    wordmark: "BoursoBank",
    chip: "gold",
    pattern: "geo",
    accent: "rgba(255,255,255,0.5)",
  },
  "boursobank-ultim": {
    background: "linear-gradient(135deg,#22222e 0%,#0d0d15 100%)",
    foreground: WHITE,
    wordmark: "BoursoBank",
    chip: "gold",
    pattern: "geo",
    accent: "#ff2e7e",
  },
  "boursobank-metal": {
    background: "linear-gradient(135deg,#5a5a63 0%,#1b1b21 100%)",
    foreground: WHITE,
    wordmark: "BoursoBank",
    chip: "silver",
    pattern: "guilloche",
  },
  "fortuneo-fosfo": {
    background: "linear-gradient(135deg,#00c2cb 0%,#0091a6 100%)",
    foreground: WHITE,
    wordmark: "Fortuneo",
    chip: "gold",
    pattern: "waves",
  },
  "fortuneo-gold": {
    background: "linear-gradient(135deg,#c9a24a 0%,#8a6d1f 100%)",
    foreground: WHITE,
    wordmark: "Fortuneo",
    chip: "gold",
    pattern: "guilloche",
  },
  "fortuneo-world-elite": {
    background: "linear-gradient(135deg,#26262b 0%,#050507 100%)",
    foreground: WHITE,
    wordmark: "Fortuneo",
    chip: "silver",
    pattern: "guilloche",
  },
  "hellobank-prime": {
    background: "linear-gradient(135deg,#00c389 0%,#00845f 100%)",
    foreground: WHITE,
    wordmark: "Hello bank!",
    chip: "gold",
    pattern: "diagonal",
  },
  "monabanq-uniq-plus": {
    background: "linear-gradient(135deg,#7b4bd6 0%,#452a94 100%)",
    foreground: WHITE,
    wordmark: "Monabanq",
    chip: "gold",
    pattern: "geo",
    accent: "rgba(255,255,255,0.45)",
  },
  "revolut-standard": {
    background: "linear-gradient(135deg,#2b2e35 0%,#111318 100%)",
    foreground: WHITE,
    wordmark: "Revolut",
    chip: "silver",
    pattern: "diagonal",
  },
  "revolut-premium": {
    background: "linear-gradient(135deg,#3b4048 0%,#15171c 100%)",
    foreground: WHITE,
    wordmark: "Revolut",
    chip: "silver",
    pattern: "diagonal",
  },
  "n26-standard": {
    background: "linear-gradient(135deg,#f5fbfa 0%,#dcefec 100%)",
    foreground: "#04302b",
    wordmark: "N26",
    chip: "silver",
    pattern: "edge",
    accent: "#1fb6a6",
  },
  "amex-gold": {
    background: "linear-gradient(180deg,#e6c869 0%,#b7891f 100%)",
    foreground: "#2a1e00",
    wordmark: "American Express",
    chip: "gold",
    pattern: "guilloche",
  },
  "amex-afklm-gold": {
    background: "linear-gradient(180deg,#dcbd63 0%,#7a5c1e 100%)",
    foreground: "#241a00",
    wordmark: "Air France KLM",
    chip: "gold",
    pattern: "airfrance",
  },
};

/** Replis génériques par gamme, si une carte n'est pas dans la table ci-dessus. */
const TONE_FALLBACK: Record<CardTone, string> = {
  brand: "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)",
  dark: "linear-gradient(135deg,#334155 0%,#020617 100%)",
  emerald: "linear-gradient(135deg,#10b981 0%,#0f766e 100%)",
  slate: "linear-gradient(135deg,#64748b 0%,#334155 100%)",
};

/** Identité de marque d'une carte, avec repli par gamme si non répertoriée. */
export function cardBrand(card: Card): CardBrand {
  const known = CARD_BRAND[card.id];
  if (known) return known;
  return {
    background: TONE_FALLBACK[toneForTier(card.tier)],
    foreground: WHITE,
    wordmark: card.issuer.split(" (")[0],
    chip: "gold",
    pattern: "plain",
  };
}
