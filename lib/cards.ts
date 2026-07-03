// lib/cards.ts
// Chargement des données cartes côté serveur.
// cards.json est importé statiquement (bundlé côté serveur) et validé au type Card.

import cardsData from "../data/cards.json";
import type { Card } from "./types";

interface CardsFile {
  project: string;
  version: string;
  note?: string;
  cards: Card[];
}

const file = cardsData as CardsFile;

/** Toutes les cartes du jeu de données. */
export const cards: Card[] = file.cards;

/** Cartes vérifiées uniquement (last_verified renseigné et to_verify !== true). */
export function verifiedCards(): Card[] {
  return cards.filter((c) => c.last_verified != null && c.to_verify !== true);
}

/** Récupère une carte par id. */
export function getCard(id: string): Card | undefined {
  return cards.find((c) => c.id === id);
}
