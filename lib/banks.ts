// lib/banks.ts
// Regroupement des cartes par établissement (marque), pour les pages SEO
// /banques/[slug] qui captent les requêtes de marque (« carte Fortuneo »…).
// Data-driven : les cartes d'une banque sont retrouvées depuis le catalogue.

import type { Card } from "./types";
import { publicCards } from "./cards";

export interface Bank {
  slug: string;
  /** Nom d'affichage court. */
  name: string;
  /** Mot-clé recherché dans `issuer` pour rattacher les cartes. */
  issuerKeyword: string;
  /** Description factuelle courte. */
  blurb: string;
}

export const BANKS: Bank[] = [
  {
    slug: "boursobank",
    name: "BoursoBank",
    issuerKeyword: "boursobank",
    blurb:
      "Banque en ligne du groupe Société Générale, connue pour ses cartes à cotisation gratuite.",
  },
  {
    slug: "fortuneo",
    name: "Fortuneo",
    issuerKeyword: "fortuneo",
    blurb:
      "Banque en ligne (groupe Crédit Mutuel Arkéa), réputée pour ses cartes sans frais à l'étranger.",
  },
  {
    slug: "hello-bank",
    name: "Hello bank!",
    issuerKeyword: "hello bank",
    blurb: "Banque en ligne de BNP Paribas.",
  },
  {
    slug: "monabanq",
    name: "Monabanq",
    issuerKeyword: "monabanq",
    blurb:
      "Banque en ligne du groupe Crédit Mutuel Alliance Fédérale, positionnée sans condition de revenus.",
  },
  {
    slug: "revolut",
    name: "Revolut",
    issuerKeyword: "revolut",
    blurb: "Néobanque multi-devises, populaire pour les voyages.",
  },
  {
    slug: "n26",
    name: "N26",
    issuerKeyword: "n26",
    blurb: "Néobanque allemande, 100 % mobile.",
  },
  {
    slug: "american-express",
    name: "American Express",
    issuerKeyword: "american express",
    blurb:
      "Émetteur de cartes premium à programme de points (Membership Rewards, Flying Blue).",
  },
];

export function getBank(slug: string): Bank | undefined {
  return BANKS.find((b) => b.slug === slug);
}

/** Cartes publiques rattachées à une banque, triées par cotisation puis nom. */
export function cardsForBank(bank: Bank): Card[] {
  return publicCards()
    .filter((c) => c.issuer.toLowerCase().includes(bank.issuerKeyword))
    .sort(
      (a, b) => a.annual_fee_eur - b.annual_fee_eur || a.name.localeCompare(b.name),
    );
}
