// lib/card-brand.ts
// Identité visuelle par carte pour le rendu « fidèle à la marque » (couleurs,
// wordmark de l'émetteur, teinte de puce). Utilisé par ProductCardVisual comme
// REPLI tant qu'aucune image officielle (card.image) n'est fournie.
//
// Important : ce sont des couleurs/typos d'ambiance, PAS des reproductions des
// visuels officiels (qui sont copyrightés et fournis via les kits d'affiliation).

import type { Card } from "./types";
import { toneForTier, type CardTone } from "./card-display";

export interface CardBrand {
  /** Fond CSS (dégradé ou couleur). */
  background: string;
  /** Couleur du texte sur ce fond. */
  foreground: string;
  /** Nom court de l'émetteur, affiché en haut de la carte. */
  wordmark: string;
  /** Teinte de la puce EMV. */
  chip: "gold" | "silver";
}

const WHITE = "#ffffff";

/** Config par identifiant de carte (source : couleurs de marque publiques). */
export const CARD_BRAND: Record<string, CardBrand> = {
  "boursobank-welcome": {
    background: "linear-gradient(135deg,#ff2e7e 0%,#c40064 100%)",
    foreground: WHITE,
    wordmark: "BoursoBank",
    chip: "gold",
  },
  "boursobank-ultim": {
    background: "linear-gradient(135deg,#2a2a38 0%,#101018 100%)",
    foreground: WHITE,
    wordmark: "BoursoBank",
    chip: "gold",
  },
  "boursobank-metal": {
    background: "linear-gradient(135deg,#54545c 0%,#1b1b21 100%)",
    foreground: WHITE,
    wordmark: "BoursoBank",
    chip: "silver",
  },
  "fortuneo-fosfo": {
    background: "linear-gradient(135deg,#00c2cb 0%,#0091a6 100%)",
    foreground: WHITE,
    wordmark: "Fortuneo",
    chip: "gold",
  },
  "fortuneo-gold": {
    background: "linear-gradient(135deg,#c9a24a 0%,#8a6d1f 100%)",
    foreground: WHITE,
    wordmark: "Fortuneo",
    chip: "gold",
  },
  "fortuneo-world-elite": {
    background: "linear-gradient(135deg,#26262b 0%,#050507 100%)",
    foreground: WHITE,
    wordmark: "Fortuneo",
    chip: "silver",
  },
  "hellobank-prime": {
    background: "linear-gradient(135deg,#00c389 0%,#00845f 100%)",
    foreground: WHITE,
    wordmark: "Hello bank!",
    chip: "gold",
  },
  "monabanq-uniq-plus": {
    background: "linear-gradient(135deg,#7b4bd6 0%,#452a94 100%)",
    foreground: WHITE,
    wordmark: "Monabanq",
    chip: "gold",
  },
  "revolut-standard": {
    background: "linear-gradient(135deg,#2b2e35 0%,#111318 100%)",
    foreground: WHITE,
    wordmark: "Revolut",
    chip: "silver",
  },
  "revolut-premium": {
    background: "linear-gradient(135deg,#3b4048 0%,#15171c 100%)",
    foreground: WHITE,
    wordmark: "Revolut",
    chip: "silver",
  },
  "n26-standard": {
    background: "linear-gradient(135deg,#4be0c8 0%,#1fb0a3 100%)",
    foreground: "#04302b",
    wordmark: "N26",
    chip: "silver",
  },
  "amex-gold": {
    background: "linear-gradient(135deg,#d9b64e 0%,#b7891f 100%)",
    foreground: "#2a1e00",
    wordmark: "American Express",
    chip: "gold",
  },
  "amex-afklm-gold": {
    background: "linear-gradient(135deg,#caa24a 0%,#7a5c1e 100%)",
    foreground: "#241a00",
    wordmark: "Air France KLM",
    chip: "gold",
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
  };
}
