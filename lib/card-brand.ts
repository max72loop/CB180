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
  "nickel-standard": {
    background: "linear-gradient(135deg,#ff6a3d 0%,#e23900 100%)",
    foreground: WHITE,
    wordmark: "Nickel",
    chip: "gold",
    pattern: "diagonal",
  },
  "nickel-chrome": {
    background: "linear-gradient(135deg,#cdd2d9 0%,#7c828b 100%)",
    foreground: "#1a1d22",
    wordmark: "Nickel",
    chip: "silver",
    pattern: "guilloche",
  },
  "nickel-metal": {
    background: "linear-gradient(135deg,#3a3d42 0%,#101114 100%)",
    foreground: WHITE,
    wordmark: "Nickel",
    chip: "silver",
    pattern: "guilloche",
  },
  "trade-republic-card": {
    background: "linear-gradient(135deg,#1c1c1c 0%,#000000 100%)",
    foreground: WHITE,
    wordmark: "Trade Republic",
    chip: "silver",
    pattern: "edge",
    accent: "rgba(255,255,255,0.4)",
  },
  "wise-card": {
    background: "linear-gradient(135deg,#9fe870 0%,#5bc236 100%)",
    foreground: "#163300",
    wordmark: "Wise",
    chip: "gold",
    pattern: "geo",
    accent: "rgba(22,51,0,0.25)",
  },
  "bforbank-visa": {
    background: "linear-gradient(135deg,#2b2f36 0%,#0c0e12 100%)",
    foreground: WHITE,
    wordmark: "BforBank",
    chip: "silver",
    pattern: "edge",
    accent: "#12b3a6",
  },
  "bforbank-bforzen": {
    background: "linear-gradient(135deg,#12b3a6 0%,#0a6f66 100%)",
    foreground: WHITE,
    wordmark: "BforBank",
    chip: "gold",
    pattern: "edge",
    accent: "rgba(255,255,255,0.5)",
  },
  "revolut-metal": {
    background: "linear-gradient(135deg,#4a4f57 0%,#17191e 100%)",
    foreground: WHITE,
    wordmark: "Revolut",
    chip: "silver",
    pattern: "diagonal",
  },
  "n26-go": {
    background: "linear-gradient(135deg,#1fb6a6 0%,#0c7d72 100%)",
    foreground: WHITE,
    wordmark: "N26",
    chip: "silver",
    pattern: "edge",
    accent: "rgba(255,255,255,0.55)",
  },
  "n26-smart": {
    background: "linear-gradient(135deg,#eafbf8 0%,#bfe9e2 100%)",
    foreground: "#04302b",
    wordmark: "N26",
    chip: "silver",
    pattern: "edge",
    accent: "#1fb6a6",
  },
  "n26-metal": {
    background: "linear-gradient(135deg,#33363c 0%,#0d0e11 100%)",
    foreground: WHITE,
    wordmark: "N26",
    chip: "silver",
    pattern: "guilloche",
    accent: "rgba(31,182,166,0.6)",
  },
  "bunq-free": {
    background: "linear-gradient(135deg,#7be0c3 0%,#12b98a 100%)",
    foreground: "#053528",
    wordmark: "bunq",
    chip: "gold",
    pattern: "geo",
    accent: "rgba(5,53,40,0.28)",
  },
  "bunq-core": {
    background: "linear-gradient(135deg,#5b6bff 0%,#2b32c9 100%)",
    foreground: WHITE,
    wordmark: "bunq",
    chip: "silver",
    pattern: "diagonal",
    accent: "rgba(255,255,255,0.5)",
  },
  "bunq-pro": {
    background: "linear-gradient(135deg,#2c2f5a 0%,#12132b 100%)",
    foreground: WHITE,
    wordmark: "bunq",
    chip: "gold",
    pattern: "geo",
    accent: "#7be0c3",
  },
  "bunq-elite": {
    background: "linear-gradient(135deg,#4a4d55 0%,#141519 100%)",
    foreground: WHITE,
    wordmark: "bunq",
    chip: "silver",
    pattern: "guilloche",
    accent: "rgba(123,224,195,0.5)",
  },
  "monabanq-pratiq-plus": {
    background: "linear-gradient(135deg,#9a74e6 0%,#5b3bb0 100%)",
    foreground: WHITE,
    wordmark: "Monabanq",
    chip: "gold",
    pattern: "geo",
    accent: "rgba(255,255,255,0.4)",
  },
  "monabanq-uniq": {
    background: "linear-gradient(135deg,#8657e0 0%,#4e2fa0 100%)",
    foreground: WHITE,
    wordmark: "Monabanq",
    chip: "gold",
    pattern: "geo",
    accent: "rgba(255,255,255,0.42)",
  },
  "trade-republic-virtual": {
    background: "linear-gradient(135deg,#2a2a2a 0%,#0b0b0b 100%)",
    foreground: WHITE,
    wordmark: "Trade Republic",
    chip: "silver",
    pattern: "diagonal",
    accent: "rgba(255,255,255,0.32)",
  },
  "trade-republic-mirror": {
    background: "linear-gradient(135deg,#d7dade 0%,#8a8f97 100%)",
    foreground: "#14161a",
    wordmark: "Trade Republic",
    chip: "silver",
    pattern: "guilloche",
    accent: "rgba(20,22,26,0.35)",
  },
  "amex-blue": {
    background: "linear-gradient(135deg,#2f6fd0 0%,#123f86 100%)",
    foreground: WHITE,
    wordmark: "American Express",
    chip: "silver",
    pattern: "guilloche",
    accent: "rgba(255,255,255,0.4)",
  },
  "amex-platinum": {
    background: "linear-gradient(135deg,#e7e9ec 0%,#a9b0b8 100%)",
    foreground: "#1f2937",
    wordmark: "American Express",
    chip: "silver",
    pattern: "guilloche",
  },
  "hellobank-one": {
    background: "linear-gradient(135deg,#4fd1a5 0%,#00a878 100%)",
    foreground: WHITE,
    wordmark: "Hello bank!",
    chip: "gold",
    pattern: "diagonal",
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
