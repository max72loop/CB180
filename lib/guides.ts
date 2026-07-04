// lib/guides.ts
// Guides éditoriaux SEO, data-driven : chaque guide définit un critère OBJECTIF
// (prédicat sur le catalogue) et présente les cartes qui le remplissent, classées
// par coût. Aucun jugement « recommandé pour vous » : on filtre et on trie.

import type { Card } from "./types";
import guidesContent from "../data/guides-content.json";

export interface Guide {
  slug: string;
  /** Titre H1 / balise <title>. */
  title: string;
  /** Meta description SEO. */
  metaDescription: string;
  /** Chapô affiché sous le titre. */
  intro: string;
  /** Phrase courte décrivant le critère de sélection (transparence). */
  criterion: string;
  /** Prédicat de sélection des cartes du catalogue. */
  match: (c: Card) => boolean;
  /** Tri d'affichage (défaut : cotisation puis nom). */
  sort?: (a: Card, b: Card) => number;
  /**
   * Corps éditorial : sections de fond (titre + paragraphe) affichées sous la
   * liste des cartes. Donne au guide une vraie profondeur (E-E-A-T) au-delà du
   * simple filtre. Wording IOBSP : descriptif et factuel, jamais prescriptif.
   */
  sections?: { h: string; body: string }[];
  /** Questions/réponses pour le bloc FAQ (données structurées FAQPage). */
  faq: { q: string; a: string }[];
}

const byFeeThenName = (a: Card, b: Card) =>
  a.annual_fee_eur - b.annual_fee_eur || a.name.localeCompare(b.name);

const byFxThenFee = (a: Card, b: Card) =>
  a.fx_fee_percent - b.fx_fee_percent ||
  a.annual_fee_eur - b.annual_fee_eur ||
  a.name.localeCompare(b.name);

/**
 * Guides « historiques », définis intégralement en TS (prédicat + éditorial court).
 * Les guides plus récents séparent le corps éditorial (data/guides-content.json)
 * du prédicat de sélection (EDITORIAL_PREDICATES ci-dessous), fusionnés par slug.
 */
const CORE_GUIDES: Guide[] = [
  {
    slug: "carte-sans-frais-etranger",
    title: "Carte bancaire sans frais à l'étranger",
    metaDescription:
      "Les cartes bancaires françaises sans frais de change ni frais de retrait hors zone euro, sur données officielles vérifiées. Comparez selon vos usages avec CB180.",
    intro:
      "Certaines cartes n'appliquent ni frais de change ni frais de retrait en dehors de la zone euro. Voici, sur données officielles, les cartes du catalogue qui remplissent ce critère.",
    criterion:
      "Frais de change à 0 % ET aucun frais de retrait en devises. Classement par cotisation croissante.",
    match: (c) =>
      c.fx_fee_percent === 0 && (c.foreign_withdrawal_fee_percent ?? 0) === 0,
    sort: byFeeThenName,
    faq: [
      {
        q: "« Sans frais à l'étranger », ça veut dire quoi exactement ?",
        a: "Ici, la banque n'ajoute ni commission de change sur vos paiements en devises, ni frais sur vos retraits hors zone euro. Le taux de change du réseau (Visa/Mastercard) s'applique toujours, et un distributeur étranger peut facturer ses propres frais.",
      },
      {
        q: "Ces cartes sont-elles gratuites ?",
        a: "Pas nécessairement : « sans frais à l'étranger » concerne les opérations en devises, pas la cotisation. Chaque fiche indique la cotisation annuelle.",
      },
      {
        q: "Comment savoir laquelle me coûte le moins cher ?",
        a: "Cela dépend de vos usages (dépenses, part en devises, retraits). Le simulateur CB180 chiffre le coût annuel de chaque carte selon vos réponses.",
      },
    ],
  },
  {
    slug: "carte-bancaire-gratuite",
    title: "Carte bancaire gratuite",
    metaDescription:
      "Les cartes bancaires à 0 € de cotisation en France, comparées sur données officielles : frais de change, retraits, conditions. Information objective, sans conseil.",
    intro:
      "Une carte « gratuite » a une cotisation de 0 €, parfois sous condition d'utilisation (un paiement par mois). Voici les cartes du catalogue à cotisation nulle, et ce qu'elles coûtent réellement à l'usage.",
    criterion:
      "Cotisation annuelle de 0 €. Classement par frais de change croissant, puis nom.",
    match: (c) => c.annual_fee_eur === 0,
    sort: byFxThenFee,
    faq: [
      {
        q: "Une carte gratuite est-elle vraiment sans frais ?",
        a: "La cotisation est nulle, mais des frais peuvent s'appliquer ailleurs : change à l'étranger, retraits en devises, ou frais d'inactivité si vous ne l'utilisez pas. Chaque fiche détaille ces postes.",
      },
      {
        q: "Y a-t-il une condition de revenu ?",
        a: "Certaines cartes gratuites en imposent une, d'autres non. La condition de revenu est indiquée sur chaque fiche.",
      },
    ],
  },
  {
    slug: "carte-bancaire-pour-voyager",
    title: "Carte bancaire pour voyager",
    metaDescription:
      "Cartes sans frais à l'étranger et avec assurances voyage, comparées sur données officielles. Trouvez le coût réel selon vos usages avec le simulateur CB180.",
    intro:
      "Pour voyager, deux choses comptent : ne pas payer de frais en devises, et disposer d'assurances/assistance. Voici les cartes du catalogue qui cumulent les deux.",
    criterion:
      "Frais de change à 0 %, aucun frais de retrait en devises, ET assurances de niveau Premier/Gold ou supérieur. Classement par cotisation croissante.",
    match: (c) =>
      c.fx_fee_percent === 0 &&
      (c.foreign_withdrawal_fee_percent ?? 0) === 0 &&
      (c.insurances_level === "premier_gold" || c.insurances_level === "elite"),
    sort: byFeeThenName,
    faq: [
      {
        q: "Les assurances voyage sont-elles suffisantes ?",
        a: "Le niveau varie d'une carte à l'autre (annulation, bagages, assistance médicale, responsabilité civile). Vérifiez toujours les plafonds et exclusions dans les conditions générales de la banque.",
      },
      {
        q: "Faut-il payer avec la carte pour être couvert ?",
        a: "Souvent oui : de nombreuses garanties ne s'activent que si le voyage ou la location a été réglé avec la carte. C'est précisé dans les conditions de l'assurance.",
      },
    ],
  },
  {
    slug: "carte-gratuite-sans-condition-revenu",
    title: "Carte gratuite sans condition de revenu",
    metaDescription:
      "Les cartes bancaires gratuites sans condition de revenu à la souscription, sur données officielles. Comparez le coût réel selon vos usages avec CB180.",
    intro:
      "Toutes les cartes gratuites n'exigent pas un revenu minimum. Voici celles du catalogue à cotisation nulle et sans condition de revenu annoncée à la souscription.",
    criterion:
      "Cotisation 0 € ET aucune condition de revenu. Classement par frais de change croissant, puis nom.",
    match: (c) => c.annual_fee_eur === 0 && c.min_monthly_income_eur == null,
    sort: byFxThenFee,
    faq: [
      {
        q: "Sans condition de revenu, y a-t-il d'autres conditions ?",
        a: "Il peut rester une condition d'utilisation (par exemple un paiement par mois pour éviter des frais d'inactivité) ou un dépôt à l'ouverture. Ces conditions sont indiquées sur chaque fiche.",
      },
      {
        q: "Puis-je l'obtenir en étant étudiant ou en début d'activité ?",
        a: "L'absence de condition de revenu facilite l'accès, mais la décision d'ouverture appartient à l'établissement. Reportez-vous à ses conditions générales.",
      },
    ],
  },
];

/** Sélection « sans frais de retrait » : la banque émettrice ne facture rien. */
const noForeignWithdrawalFee = (c: Card) =>
  (c.foreign_withdrawal_fee_percent ?? 0) === 0 &&
  (c.foreign_withdrawal_flat_eur ?? 0) === 0;

/** Émetteurs qualifiés de néobanques (100 % mobiles, sans agence). */
const isNeobank = (c: Card) => /Revolut|N26/.test(c.issuer);

/**
 * Prédicat de sélection + tri de chaque guide « éditorial », associé par slug au
 * corps rédactionnel de data/guides-content.json. Le prédicat porte l'objectivité
 * réglementaire (on filtre des faits) ; l'éditorial porte la profondeur SEO.
 */
const EDITORIAL_PREDICATES: Record<
  string,
  { match: (c: Card) => boolean; sort?: (a: Card, b: Card) => number }
> = {
  "carte-avec-assurances-voyage": {
    match: (c) =>
      c.insurances_level === "premier_gold" || c.insurances_level === "elite",
    sort: byFeeThenName,
  },
  "carte-sans-frais-retrait-etranger": {
    match: noForeignWithdrawalFee,
    sort: byFeeThenName,
  },
  "carte-pour-les-etats-unis": {
    match: (c) => c.fx_fee_percent === 0 && noForeignWithdrawalFee(c),
    sort: byFeeThenName,
  },
  "carte-gold-gratuite": {
    match: (c) =>
      c.annual_fee_eur === 0 &&
      (c.tier === "intermediaire" ||
        c.tier === "premium" ||
        c.tier === "haut_de_gamme"),
    sort: byFxThenFee,
  },
  "carte-mastercard-gratuite": {
    match: (c) => c.network.includes("Mastercard") && c.annual_fee_eur === 0,
    sort: byFxThenFee,
  },
  "carte-visa-gratuite": {
    match: (c) => c.network.includes("Visa") && c.annual_fee_eur === 0,
    sort: byFxThenFee,
  },
  "carte-avec-cashback": {
    match: (c) => c.cashback != null,
    sort: byFeeThenName,
  },
  "carte-avec-miles-aeriens": {
    match: (c) => c.miles_program != null,
    sort: byFeeThenName,
  },
  "carte-avec-prime-de-bienvenue": {
    match: (c) => c.welcome_bonus_eur > 0,
    sort: byFeeThenName,
  },
  "carte-neobanque": {
    match: isNeobank,
    sort: byFeeThenName,
  },
  "carte-pour-etudiant": {
    match: (c) =>
      c.annual_fee_eur === 0 &&
      c.min_monthly_income_eur == null &&
      c.tier === "entree",
    sort: byFxThenFee,
  },
  "carte-premium-haut-de-gamme": {
    match: (c) => c.tier === "premium" || c.tier === "haut_de_gamme",
    sort: byFeeThenName,
  },
};

interface GuideContent {
  slug: string;
  title: string;
  metaDescription: string;
  criterion: string;
  intro: string;
  sections: { h: string; body: string }[];
  faq: { q: string; a: string }[];
}

/** Fusionne l'éditorial JSON avec son prédicat pour produire des Guide complets. */
const EDITORIAL_GUIDES: Guide[] = (
  guidesContent.guides as GuideContent[]
).map((content) => {
  const pred = EDITORIAL_PREDICATES[content.slug];
  if (!pred) {
    throw new Error(
      `Guide « ${content.slug} » sans prédicat de sélection (EDITORIAL_PREDICATES).`,
    );
  }
  return {
    slug: content.slug,
    title: content.title,
    metaDescription: content.metaDescription,
    intro: content.intro,
    criterion: content.criterion,
    match: pred.match,
    sort: pred.sort,
    sections: content.sections,
    faq: content.faq,
  };
});

export const GUIDES: Guide[] = [...CORE_GUIDES, ...EDITORIAL_GUIDES];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
