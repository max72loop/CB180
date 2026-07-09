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

/**
 * Toutes les cartes du jeu de données, `verif_note` retiré.
 *
 * `verif_note` est un audit interne (raccourcis, arbitrages de modélisation).
 * Les fiches passent la carte à des composants clients : tout champ laissé ici
 * finit sérialisé dans le HTML envoyé au navigateur. La note destinée aux
 * lecteurs est `verif_public`.
 */
export const cards: Card[] = file.cards.map(({ verif_note: _internal, ...card }) => card);

/** Cartes vérifiées uniquement (last_verified renseigné et to_verify !== true). */
export function verifiedCards(): Card[] {
  return cards.filter((c) => c.last_verified != null && c.to_verify !== true);
}

/**
 * Cartes « publiques » : cartes réelles présentables sur des pages produit
 * (exclut les cartes de référence génériques, non monétisées et sans source
 * officielle unique, elles servent de baseline interne, pas de fiche publique).
 */
export function publicCards(): Card[] {
  return cards.filter((c) => c.affiliate.network != null);
}

/** Récupère une carte par id. */
export function getCard(id: string): Card | undefined {
  return cards.find((c) => c.id === id);
}
