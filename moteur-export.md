# CB180 — Moteur de sélection (export complet pour audit)

Ce document contient **la totalité** de ce qui compose aujourd'hui le moteur de
sélection : le questionnaire, la couche de mapping, le moteur de calcul pur, le
schéma de données et le catalogue des 15 cartes. Il est auto-suffisant : on peut
le recopier tel quel pour un audit.

> **Version moteur** : intègre les priorités **P1 → P6** (amortissement de prime
> sur 3 ans, valorisation des miles/points, plancher de part hors euro impliqué
> par les voyages, séparation par éligibilité, montant de retrait paramétrable,
> décomposition du coût). Ces évolutions sont détaillées ci-dessous.
>
> **Données** : catalogue `data/cards.json` **version 1.0** — **13 des 15 cartes
> vérifiées sur source officielle le 2026-07-03** (`to_verify: false`), 2 cartes
> de référence génériques restent indicatives. La provenance complète (URL, dates,
> citations par champ) est dans `cards_v1_verified.json` et
> `rapport_verification_cartes.md`.

## Architecture & flux de données

```
Questionnaire (8 questions, fourchettes)          lib/answers.ts  (QUESTIONS)
        │  réponses = { questionId: optionId }
        ▼
answersToProfile()  fourchette → valeur représentative numérique
        │  UsageProfile (nombres)
        ▼
rankCards(cards, profile)                         lib/engine.ts   (moteur PUR)
   ├─ effectiveForeignShare(profile)   part hors euro relevée par les voyages (P3)
   ├─ computeAnnualCost(card, profile) pour chaque carte
   │     → prime amortie 3 ans (P1) + valeur miles/points (P2)
   ├─ computeCurrentSituationCost(profile)  (situation actuelle estimée)
   └─ tri objectif par coût annuel net croissant
        │  RankedCard[]  (breakdown chiffré + éligibilité + écart vs actuel)
        ▼
Affichage résultats (jamais "recommandé pour vous")
   ├─ splitByEligibility(ranked)   accessibles vs revenu insuffisant (P4)
   └─ costComposition(breakdown)   poids relatif de chaque poste de coût (P6)
```

Données : `data/cards.json` (15 cartes, 13 vérifiées) chargé par `lib/cards.ts`.

## Formule du coût annuel net (cœur de la sélection)

```
coût brut = cotisation annuelle (annual_fee_eur)
          + frais de change      (fx_fee_percent × dépenses annuelles hors zone euro)
          + frais de retrait étranger estimés

net (année 1)          = coût brut
                       − prime de bienvenue amortie (sur 3 ans par défaut, P1)
                       − cashback estimé (plafonné)
                       − valeur des miles/points (P2, seulement si l'utilisateur optimise)

net (vitesse croisière) = net (année 1) + prime amortie   (récurrent, sans la prime)
```

- **Dépenses hors euro** = dépenses annuelles × `effectiveForeignShare` où
  `effectiveForeignShare = max(part déclarée, plancher impliqué par les voyages)` (P3).
- **Frais de retrait** = `max(0, retraits/an − gratuits/an) × (flat + fee% × montant_moyen)`,
  `montant_moyen` = 100 € par défaut, paramétrable (P5).
- **Valeur miles/points** = `points_per_euro × point_value_eur × dépenses annuelles
  × facteur de réalisme (0,7)`, **uniquement si `valuesRewards` est vrai** (P2).
- **Tri** : coût net (année 1) croissant, puis cotisation, puis nom (déterministe).

## Hypothèses & décisions de conception (contexte pour l'audit)

- **Montant moyen d'un retrait étranger : 100 €** (constante `DEFAULT_ASSUMPTIONS`,
  paramétrable par appel — P5).
- **Prime amortie sur 3 ans (P1)** : une prime de bienvenue n'est pas récurrente.
  L'amortir sur 3 ans (au lieu de 100 % en année 1) évite que les grosses primes
  écrasent le classement de profils qui ne voyagent pas et ne visent pas le bonus.
  Le breakdown expose aussi `netAnnualCostWithoutBonusEur` (vue « vitesse de
  croisière », sans la prime) pour la transparence.
- **Miles/points valorisés (P2)** : `points_per_euro × point_value_eur` par euro
  dépensé, atténué par un **facteur de réalisme 0,7** (points expirés/non utilisés),
  et **compté uniquement si l'utilisateur déclare vouloir optimiser ses points**
  (`valuesRewards`). Les valeurs par carte (`point_value_eur`, `rewards_source`)
  sont des **estimations conservatrices**. Aujourd'hui seules **Amex Gold**
  (0,004 €/pt) et **Amex AF-KLM Gold** (0,01 €/mile, taux de base hors dépenses
  AF/KLM) portent une valeur > 0 ; les RevPoints Revolut ont un `points_per_euro`
  renseigné mais une valeur € non publiée → non créditée.
- **Le cashback en %** (`cashback_rate_percent`) est collecté et déduit, plafonné
  par `cashback_cap_eur`. Une carte en porte un réel : **BoursoBank Ultim Metal**
  (0,20 %, plafonné). Les programmes d'offres partenaires (The Corner, Amex Offers,
  Hello Extra) ne sont **pas** des taux % et restent à 0.
- **Plancher de part hors euro impliqué par les voyages (P3)** : un voyageur
  fréquent dépense rarement 0 en devises. `travelImpliedForeignShareFloor` relève
  la part déclarée (jamais à la baisse) : ≥ 6 voyages/an → 20 %, ≥ 4 → 12 %,
  ≥ 2 → 6 %. Fiabilise le chiffre central sans jamais sous-estimer les frais.
- **`profileType` est collecté mais non utilisé dans le calcul.** Seuls comptent :
  dépenses, part hors euro (éventuellement relevée par les voyages), retraits,
  cotisation, primes/récompenses, revenu (éligibilité).
- **Situation actuelle modélisée** sur une carte de réseau traditionnelle
  (fx 2,7 %, retrait 2,9 % + 3 €) + la cotisation déclarée. Ne connaît pas la vraie
  banque de l'utilisateur.
- **Éligibilité** (revenu) exposée par carte ; ne filtre pas le classement par
  défaut (option `onlyEligible`). `splitByEligibility` (P4) sépare accessibles /
  non éligibles **sans changer l'ordre interne**, pour l'affichage.
- **Décomposition du coût (P6)** : `costComposition` renvoie le poids relatif de
  chaque poste (cotisation / change / retrait) dans le coût brut, trié décroissant,
  pour expliquer lisiblement un mauvais classement (ex. « 71 % du coût = frais de
  change »).
- **Champs `[moteur]`** (`foreign_withdrawal_fee_percent`, `points_per_euro`, etc.) :
  dérivés numériques des politiques officielles. Pour les **13 cartes vérifiées**,
  ils sont issus des sources officielles (voir `cards_v1_verified.json`) et
  **traduits dans la sémantique du moteur** : les frais concernent les retraits
  **en devises** (hors zone euro), et un plafond de gratuité exprimé en **montant**
  est encodé en **nombre** à ~100 €/retrait (ex. Revolut Premium 400 €/mois →
  `free_foreign_withdrawals_per_month = 4`). Les 2 cartes de référence
  `to_verify: true` gardent des valeurs indicatives non sourcées. Les primes non
  confirmées comme récurrentes sont mises à **0** (on ne crédite pas un bonus
  ponctuel ou promotionnel).

---

## `lib/types.ts`

```ts
// lib/types.ts
// Types partagés CB180 — aucune dépendance à React.
// Le moteur (lib/engine.ts) ne consomme QUE ces types.

/** Gamme de la carte. */
export type CardTier = "entree" | "intermediaire" | "premium" | "haut_de_gamme";

/** Niveau d'assurances/assistance associé à la carte. */
export type InsurancesLevel = "none" | "basique" | "premier_gold" | "elite";

/** Bloc affiliation. La commission est affichée en clair côté UI (transparence). */
export interface CardAffiliate {
  network: string | null;
  est_commission_eur: number;
  status?: string;
}

/**
 * Schéma de carte.
 *
 * Les champs "métier" ci-dessous correspondent au schéma fourni : ils sont
 * la source d'affichage. Les politiques de retrait/cashback y sont en TEXTE
 * LIBRE, non calculable.
 *
 * Les champs suffixés d'un commentaire "[moteur]" sont des dérivés numériques
 * OPTIONNELS de ces politiques, ajoutés uniquement pour rendre le calcul
 * déterministe et testable. Ils n'ont pas vocation à être affichés bruts ;
 * `foreign_withdrawal` / `cashback` restent les textes de référence pour l'UI.
 */
export interface Card {
  id: string;
  name: string;
  issuer: string;
  network: string;
  tier: CardTier;
  monthly_fee_eur: number | null;
  annual_fee_eur: number;
  free_condition: string | null;
  /** Frais de change hors zone euro, en % (ex. 1.69). */
  fx_fee_percent: number;
  /** Politique de retrait à l'étranger — texte libre, source d'affichage. */
  foreign_withdrawal: string;
  insurances_level: InsurancesLevel;
  cashback: string | null;
  miles_program: string | null;
  welcome_bonus_eur: number;
  affiliate: CardAffiliate;
  target_profiles: string[];
  last_verified: string | null;
  source_url: string;
  to_verify?: boolean;
  verif_note?: string;

  // --- Dérivés numériques pour le moteur (optionnels) ---
  /** [moteur] Frais % appliqué à un retrait étranger facturé. Défaut 0. */
  foreign_withdrawal_fee_percent?: number;
  /** [moteur] Frais fixe par retrait étranger facturé, en €. Défaut 0. */
  foreign_withdrawal_flat_eur?: number;
  /** [moteur] Nombre de retraits étrangers gratuits par mois. Défaut 0. */
  free_foreign_withdrawals_per_month?: number;
  /** [moteur] Taux de cashback effectif en % sur les dépenses éligibles. Défaut 0. */
  cashback_rate_percent?: number;
  /** [moteur] Plafond annuel de cashback en €. null = illimité. */
  cashback_cap_eur?: number | null;
  /** [moteur] Revenu mensuel net minimum requis, en €. null = aucune condition. */
  min_monthly_income_eur?: number | null;

  // --- Récompenses miles/points (P2) — dérivés à vérifier comme les autres ---
  /** [moteur] Points/miles gagnés par euro dépensé. Défaut 0. */
  points_per_euro?: number;
  /** [moteur] Valeur en € d'un point/mile. Défaut 0. */
  point_value_eur?: number;
  /** [moteur] Source et date des valeurs de récompense (traçabilité). */
  rewards_source?: string;
}

/** Profil type déclaré par l'utilisateur (usage informatif, non prescriptif). */
export type ProfileType =
  | "petit_budget_sedentaire"
  | "voyageur_regulier"
  | "gros_depensier_optimiseur"
  | "jeune_actif"
  | "autre";

/**
 * Profil d'usage NORMALISÉ consommé par le moteur.
 *
 * Le questionnaire collecte des fourchettes ; la couche de mapping
 * (à venir avec l'UI) traduit chaque fourchette en une valeur représentative
 * numérique avant d'appeler le moteur. Le moteur ne voit jamais de fourchette.
 */
export interface UsageProfile {
  /** Dépenses mensuelles totales représentatives, en €. */
  monthlySpendingEur: number;
  /** Part des dépenses hors zone euro, ratio 0..1. */
  foreignSpendingShare: number;
  /** Nombre de voyages hors Europe par an (signal, non monétisé directement). */
  travelOutsideEuropePerYear: number;
  /** Nombre de retraits à l'étranger par mois. */
  foreignWithdrawalsPerMonth: number;
  /** Cotisation annuelle actuellement payée par l'utilisateur, en €. */
  currentAnnualFeeEur: number;
  /** L'utilisateur déclare un intérêt pour les miles / le cashback. */
  valuesRewards: boolean;
  /** Revenu mensuel net représentatif, en € (sert au filtre d'éligibilité). */
  monthlyIncomeEur: number;
  profileType: ProfileType;
}

/** Hypothèses de calcul, explicites et surchargées. */
export interface EngineAssumptions {
  /** Montant moyen supposé d'un retrait à l'étranger, en € (P5, paramétrable). */
  averageForeignWithdrawalEur: number;
  /** Horizon d'amortissement de la prime de bienvenue, en années (P1, défaut 3). */
  welcomeBonusAmortizationYears: number;
  /** Facteur de réalisme des récompenses (points expirés/non utilisés), 0..1 (P2). */
  rewardsRealizationFactor: number;
}

/** Détail chiffré du calcul pour une carte (transparence radicale). */
export interface CostBreakdown {
  cardId: string;
  /** Cotisation annuelle. */
  annualFeeEur: number;
  /** Frais de change estimés sur les dépenses hors zone euro. */
  fxFeeEur: number;
  /** Frais de retrait étranger estimés. */
  foreignWithdrawalFeeEur: number;
  /** Somme des postes de COÛT avant déductions (cotisation + change + retrait). */
  grossCostEur: number;
  /** Valeur amortie de la prime de bienvenue (déduite). */
  welcomeBonusAmortizedEur: number;
  /** Valeur estimée du cashback (déduite). */
  cashbackValueEur: number;
  /** Valeur estimée des miles/points (déduite, uniquement si valuesRewards). */
  rewardsValueEur: number;
  /**
   * Coût annuel NET, vue « année 1 » (prime incluse au prorata) — clé de tri.
   * = coût brut − prime amortie − cashback − récompenses.
   */
  netAnnualCostEur: number;
  /** Coût annuel NET, vue « vitesse de croisière » (sans prime de bienvenue). */
  netAnnualCostWithoutBonusEur: number;
  /** Hypothèses utilisées pour ce calcul. */
  assumptions: EngineAssumptions;
  /** Entrées dérivées, exposées pour l'explicabilité. */
  inputs: {
    annualSpendingEur: number;
    foreignAnnualSpendingEur: number;
    foreignWithdrawalsPerYear: number;
  };
}

/** Poids d'un poste de coût dans le coût brut (P6, pour l'explication lisible). */
export interface CostShare {
  post: "cotisation" | "change" | "retrait";
  amountEur: number;
  /** Part du poste dans le coût brut, 0..1. */
  share: number;
}

/** Ligne de classement objective. */
export interface RankedCard {
  card: Card;
  breakdown: CostBreakdown;
  /** Éligibilité au regard du revenu déclaré (true si condition inconnue). */
  eligible: boolean;
  /** Économie annuelle vs situation actuelle : positif = carte moins chère. */
  savingsVsCurrentEur: number;
}
```

---

## `lib/answers.ts` (questionnaire + mapping fourchette → valeur)

```ts
// lib/answers.ts
// Couche de mapping questionnaire → profil moteur.
//
// Le questionnaire ne collecte que des FOURCHETTES (jamais de montant exact),
// aucune donnée identifiante, ni le nom de la banque actuelle. Chaque option
// porte une valeur représentative numérique injectée dans le moteur.
//
// Cette couche est pure et testable indépendamment de l'UI.

import type { ProfileType, UsageProfile } from "./types";

/** Identifiant stable de chaque question (8 questions). */
export type QuestionId =
  | "monthlySpending"
  | "foreignShare"
  | "travelFrequency"
  | "foreignWithdrawals"
  | "currentFee"
  | "rewardsInterest"
  | "income"
  | "profileType";

export interface QuestionOption {
  /** Identifiant d'option stocké dans les réponses. */
  id: string;
  /** Libellé affiché à l'utilisateur. */
  label: string;
  /** Précision optionnelle sous le libellé. */
  hint?: string;
  /** Valeur représentative injectée dans le moteur (fourchette → valeur). */
  value: number | boolean | string;
  /**
   * Slug stable de la fourchette pour le stockage/analytics anonymisé
   * (ex. "1000_2000"). Décorrélé de `value` (représentatif numérique) pour
   * que la base reste lisible même si les valeurs de calcul évoluent.
   */
  band: string;
}

export interface Question {
  id: QuestionId;
  /** Intitulé de la question (une par écran). */
  title: string;
  /** Aide contextuelle optionnelle. */
  help?: string;
  options: QuestionOption[];
}

/** Réponses = identifiant d'option retenue par question (partiel en cours de route). */
export type Answers = Partial<Record<QuestionId, string>>;

/**
 * Priorité 5 — id de l'option « je préfère ne pas répondre » du revenu.
 * Choisir cette option laisse continuer et fait basculer le moteur en mode
 * « toutes cartes affichées, sans vérification des conditions d'accès ».
 */
export const INCOME_SKIP_OPTION_ID = "i_skip";

/** True si l'utilisateur a réellement renseigné son revenu (option non « skip »). */
export function isIncomeDisclosed(answers: Answers): boolean {
  const v = answers.income;
  return v != null && v !== INCOME_SKIP_OPTION_ID;
}

/**
 * Définition du questionnaire. C'est à la fois la structure d'affichage ET la
 * table de correspondance fourchette → valeur. Une seule source de vérité.
 */
export const QUESTIONS: Question[] = [
  {
    id: "monthlySpending",
    title: "Combien dépensez-vous par mois avec votre carte, environ ?",
    help: "Une fourchette suffit, on ne demande aucun montant exact.",
    options: [
      { id: "s1", label: "Moins de 500 €", value: 350, band: "moins_500" },
      { id: "s2", label: "500 à 1 000 €", value: 750, band: "500_1000" },
      { id: "s3", label: "1 000 à 2 000 €", value: 1500, band: "1000_2000" },
      { id: "s4", label: "2 000 à 3 500 €", value: 2750, band: "2000_3500" },
      { id: "s5", label: "Plus de 3 500 €", value: 4500, band: "plus_3500" },
    ],
  },
  {
    id: "foreignShare",
    title: "Quelle part de ces dépenses est hors zone euro ?",
    help: "Paiements en devises : dollars, livres, francs suisses, etc.",
    options: [
      { id: "f1", label: "Quasiment jamais", hint: "moins de 5 %", value: 0.02, band: "moins_5pct" },
      { id: "f2", label: "Un peu", hint: "5 à 15 %", value: 0.1, band: "5_15pct" },
      { id: "f3", label: "Souvent", hint: "15 à 30 %", value: 0.22, band: "15_30pct" },
      { id: "f4", label: "Beaucoup", hint: "30 à 50 %", value: 0.4, band: "30_50pct" },
      { id: "f5", label: "Majoritairement", hint: "plus de 50 %", value: 0.65, band: "plus_50pct" },
    ],
  },
  {
    id: "travelFrequency",
    title: "À quelle fréquence voyagez-vous hors d'Europe ?",
    options: [
      { id: "t1", label: "Jamais", value: 0, band: "jamais" },
      { id: "t2", label: "1 fois par an", value: 1, band: "1_par_an" },
      { id: "t3", label: "2 à 3 fois par an", value: 2.5, band: "2_3_par_an" },
      { id: "t4", label: "4 à 6 fois par an", value: 5, band: "4_6_par_an" },
      { id: "t5", label: "Plus de 6 fois par an", value: 8, band: "plus_6_par_an" },
    ],
  },
  {
    id: "foreignWithdrawals",
    title: "Combien de retraits en distributeur faites-vous à l'étranger par mois ?",
    help: "Retraits en devises, hors zone euro.",
    options: [
      { id: "w1", label: "Jamais", value: 0, band: "jamais" },
      { id: "w2", label: "Rarement", hint: "moins de 1 par mois", value: 0.5, band: "rarement" },
      { id: "w3", label: "1 à 3 par mois", value: 2, band: "1_3_par_mois" },
      { id: "w4", label: "4 à 8 par mois", value: 6, band: "4_8_par_mois" },
      { id: "w5", label: "Plus de 8 par mois", value: 10, band: "plus_8_par_mois" },
    ],
  },
  {
    id: "currentFee",
    title: "Combien payez-vous votre carte actuelle par an ?",
    help: "La cotisation annuelle. On ne demande pas le nom de votre banque.",
    options: [
      { id: "c1", label: "Elle est gratuite", value: 0, band: "gratuite" },
      { id: "c2", label: "Moins de 50 €", value: 30, band: "moins_50" },
      { id: "c3", label: "50 à 100 €", value: 75, band: "50_100" },
      { id: "c4", label: "100 à 150 €", value: 130, band: "100_150" },
      { id: "c5", label: "Plus de 150 €", value: 180, band: "plus_150" },
      { id: "c6", label: "Je ne sais pas", hint: "on prend une moyenne de marché", value: 135, band: "inconnu" },
    ],
  },
  {
    id: "rewardsInterest",
    title: "Les miles ou le cashback vous intéressent-ils ?",
    options: [
      { id: "r1", label: "Oui, j'aime optimiser mes points", value: true, band: "interesse" },
      { id: "r2", label: "Non, je préfère payer le moins possible", value: false, band: "aucun" },
    ],
  },
  {
    id: "income",
    title: "Quel est votre revenu mensuel net, environ ?",
    help: "Sert uniquement à indiquer les cartes dont vous remplissez les conditions. Vous pouvez ne pas répondre.",
    options: [
      { id: "i1", label: "Moins de 1 200 €", value: 1000, band: "moins_1200" },
      { id: "i2", label: "1 200 à 1 800 €", value: 1500, band: "1200_1800" },
      { id: "i3", label: "1 800 à 2 500 €", value: 2150, band: "1800_2500" },
      { id: "i4", label: "2 500 à 4 000 €", value: 3250, band: "2500_4000" },
      { id: "i5", label: "Plus de 4 000 €", value: 5000, band: "plus_4000" },
      { id: "i_skip", label: "Je préfère ne pas répondre", hint: "toutes les cartes vous seront affichées", value: 0, band: "non_renseigne" },
    ],
  },
  {
    id: "profileType",
    title: "Dans quel profil vous reconnaissez-vous le mieux ?",
    options: [
      { id: "p1", label: "Petit budget, je bouge peu", value: "petit_budget_sedentaire", band: "petit_budget_sedentaire" },
      { id: "p2", label: "Jeune actif", value: "jeune_actif", band: "jeune_actif" },
      { id: "p3", label: "Voyageur régulier", value: "voyageur_regulier", band: "voyageur_regulier" },
      { id: "p4", label: "Gros dépensier, j'optimise", value: "gros_depensier_optimiseur", band: "gros_depensier_optimiseur" },
      { id: "p5", label: "Autre", value: "autre", band: "autre" },
    ],
  },
];

/** Slug de fourchette (analytics) de l'option retenue pour une question. */
export function selectedBand(qid: QuestionId, answers: Answers): string {
  const question = QUESTIONS.find((q) => q.id === qid);
  const option = question?.options.find((o) => o.id === answers[qid]);
  return option?.band ?? "";
}

/** Récupère la valeur représentative de l'option retenue pour une question. */
function selectedValue(
  qid: QuestionId,
  answers: Answers,
): number | boolean | string | undefined {
  const question = QUESTIONS.find((q) => q.id === qid);
  const optionId = answers[qid];
  return question?.options.find((o) => o.id === optionId)?.value;
}

/** True si toutes les questions ont une réponse. */
export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => answers[q.id] != null);
}

/** Nombre de questions répondues (pour la barre de progression). */
export function answeredCount(answers: Answers): number {
  return QUESTIONS.filter((q) => answers[q.id] != null).length;
}

function requireNumber(qid: QuestionId, answers: Answers): number {
  const v = selectedValue(qid, answers);
  if (typeof v !== "number") {
    throw new Error(`Réponse manquante ou invalide pour « ${qid} ».`);
  }
  return v;
}

/**
 * Convertit un jeu de réponses COMPLET en profil d'usage normalisé pour le moteur.
 * Lève une erreur si une réponse manque : à n'appeler que si `isComplete` est vrai.
 */
export function answersToProfile(answers: Answers): UsageProfile {
  if (!isComplete(answers)) {
    throw new Error("Questionnaire incomplet : impossible de construire le profil.");
  }
  const rewards = selectedValue("rewardsInterest", answers);
  const profileType = selectedValue("profileType", answers);

  return {
    monthlySpendingEur: requireNumber("monthlySpending", answers),
    foreignSpendingShare: requireNumber("foreignShare", answers),
    travelOutsideEuropePerYear: requireNumber("travelFrequency", answers),
    foreignWithdrawalsPerMonth: requireNumber("foreignWithdrawals", answers),
    currentAnnualFeeEur: requireNumber("currentFee", answers),
    valuesRewards: rewards === true,
    monthlyIncomeEur: requireNumber("income", answers),
    profileType: (profileType as ProfileType) ?? "autre",
  };
}
```

---

## `lib/engine.ts` (moteur de calcul PUR)

```ts
// lib/engine.ts
// Moteur de calcul CB180 — fonctions PURES, zéro dépendance à React.
//
// Rôle : à partir d'un profil d'usage normalisé, calculer le coût annuel net
// de chaque carte et produire un classement OBJECTIF trié par coût croissant,
// avec le détail chiffré de chaque calcul.
//
// Contrainte réglementaire (voir wording_iobsp.md) : le tri est explicable et
// objectif. Le moteur ne produit jamais de "recommandé pour vous".

import type {
  Card,
  CostBreakdown,
  CostShare,
  EngineAssumptions,
  RankedCard,
  UsageProfile,
} from "./types";

/**
 * Hypothèses par défaut, surchargées carte par appel.
 * - Prime amortie sur 3 ans (P1) : lisse une prime non récurrente pour ne pas
 *   laisser les grosses primes écraser le classement de profils qui ne voyagent
 *   pas et ne visent pas le bonus.
 * - Facteur de réalisme des récompenses 0,7 (P2) : points expirés/non utilisés.
 */
export const DEFAULT_ASSUMPTIONS: EngineAssumptions = {
  averageForeignWithdrawalEur: 100,
  welcomeBonusAmortizationYears: 3,
  rewardsRealizationFactor: 0.7,
};

/**
 * Situation actuelle "type" pour un utilisateur de banque de réseau.
 * Sert à chiffrer le coût de la situation actuelle : on ne demande jamais le
 * nom de la banque, on modélise un profil de frais traditionnel et on injecte
 * la cotisation réellement déclarée par l'utilisateur.
 */
export const DEFAULT_CURRENT_SITUATION = {
  /** Frais de change typiques d'une carte de réseau (Visa Premier / Gold). */
  fxFeePercent: 2.7,
  /** Retrait étranger typiquement facturé (%), au-delà d'aucun quota gratuit. */
  foreignWithdrawalFeePercent: 2.9,
  /** Part fixe typique par retrait étranger, en €. */
  foreignWithdrawalFlatEur: 3,
  /** Retraits étrangers gratuits par mois côté réseau traditionnel. */
  freeForeignWithdrawalsPerMonth: 0,
} as const;

/** Arrondi à 2 décimales (centimes) pour l'affichage/les comparaisons. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Priorité 3 — plancher de part hors zone euro suggéré par la fréquence de
 * voyage hors Europe. On ne corrige QUE vers le haut (prudence) : un voyageur
 * fréquent dépense rarement 0 en devises. Fiabilise le chiffre central.
 */
export function travelImpliedForeignShareFloor(travelPerYear: number): number {
  if (travelPerYear >= 6) return 0.2;
  if (travelPerYear >= 4) return 0.12;
  if (travelPerYear >= 2) return 0.06;
  return 0;
}

/**
 * Part hors euro EFFECTIVE = max(part déclarée, plancher impliqué par les
 * voyages). Jamais d'ajustement à la baisse (on ne sous-estime pas les frais).
 */
export function effectiveForeignShare(profile: UsageProfile): number {
  return clamp01(
    Math.max(
      profile.foreignSpendingShare,
      travelImpliedForeignShareFloor(profile.travelOutsideEuropePerYear),
    ),
  );
}

/** Frais de retrait étranger annuels selon un modèle par retrait. */
function foreignWithdrawalFee(
  withdrawalsPerYear: number,
  freePerYear: number,
  feePercent: number,
  flatEur: number,
  averageAmountEur: number,
): number {
  const billable = Math.max(0, withdrawalsPerYear - freePerYear);
  const perWithdrawal = flatEur + (feePercent / 100) * averageAmountEur;
  return billable * perWithdrawal;
}

/**
 * Coût annuel NET d'une carte pour un profil donné.
 *
 * net = cotisation annuelle
 *     + frais de change (fx_fee_percent × dépenses annuelles hors zone euro)
 *     + frais de retrait étranger estimés
 *     − valeur amortie du welcome bonus (sur `welcomeBonusAmortizationYears`)
 *     − valeur estimée du cashback
 *
 * Un coût net négatif signifie que la carte "rapporte" sur l'horizon considéré
 * (prime + cashback supérieurs aux frais). Le détail complet est renvoyé pour
 * la transparence.
 */
export function computeAnnualCost(
  card: Card,
  profile: UsageProfile,
  assumptions: EngineAssumptions = DEFAULT_ASSUMPTIONS,
): CostBreakdown {
  const annualSpending = profile.monthlySpendingEur * 12;
  // Priorité 3 : la fréquence de voyage peut relever (jamais baisser) la part
  // hors zone euro déclarée, pour fiabiliser le chiffre central.
  const foreignAnnualSpending = annualSpending * effectiveForeignShare(profile);
  const foreignWithdrawalsPerYear = profile.foreignWithdrawalsPerMonth * 12;

  // 1. Cotisation
  const annualFeeEur = card.annual_fee_eur;

  // 2. Frais de change sur les dépenses hors zone euro
  const fxFeeEur = (card.fx_fee_percent / 100) * foreignAnnualSpending;

  // 3. Frais de retrait étranger (P5 : montant moyen paramétrable)
  const foreignWithdrawalFeeEur = foreignWithdrawalFee(
    foreignWithdrawalsPerYear,
    (card.free_foreign_withdrawals_per_month ?? 0) * 12,
    card.foreign_withdrawal_fee_percent ?? 0,
    card.foreign_withdrawal_flat_eur ?? 0,
    assumptions.averageForeignWithdrawalEur,
  );

  // Somme des postes de COÛT avant déductions — sert au poids relatif (P6).
  const grossCostEur = annualFeeEur + fxFeeEur + foreignWithdrawalFeeEur;

  // 4. Prime de bienvenue amortie (déduite) — horizon 3 ans par défaut (P1)
  const years = Math.max(1, assumptions.welcomeBonusAmortizationYears);
  const welcomeBonusAmortizedEur = card.welcome_bonus_eur / years;

  // 5. Cashback estimé (déduit), plafonné
  const cashbackRate = card.cashback_rate_percent ?? 0;
  const rawCashback = (cashbackRate / 100) * annualSpending;
  const cap = card.cashback_cap_eur;
  const cashbackValueEur =
    cap == null ? rawCashback : Math.min(rawCashback, cap);

  // 6. Valeur des miles/points (déduite) — P2. Garde-fou : ne compte QUE si
  // l'utilisateur déclare vouloir optimiser ses points, avec facteur de réalisme.
  const rawRewards =
    (card.points_per_euro ?? 0) * (card.point_value_eur ?? 0) * annualSpending;
  const rewardsValueEur = profile.valuesRewards
    ? rawRewards * assumptions.rewardsRealizationFactor
    : 0;

  // Vue « année 1 » (prime incluse au prorata) — clé de tri.
  const netAnnualCostEur =
    grossCostEur - welcomeBonusAmortizedEur - cashbackValueEur - rewardsValueEur;
  // Vue « vitesse de croisière » (récurrent, sans la prime).
  const netAnnualCostWithoutBonusEur =
    netAnnualCostEur + welcomeBonusAmortizedEur;

  return {
    cardId: card.id,
    annualFeeEur: round2(annualFeeEur),
    fxFeeEur: round2(fxFeeEur),
    foreignWithdrawalFeeEur: round2(foreignWithdrawalFeeEur),
    grossCostEur: round2(grossCostEur),
    welcomeBonusAmortizedEur: round2(welcomeBonusAmortizedEur),
    cashbackValueEur: round2(cashbackValueEur),
    rewardsValueEur: round2(rewardsValueEur),
    netAnnualCostEur: round2(netAnnualCostEur),
    netAnnualCostWithoutBonusEur: round2(netAnnualCostWithoutBonusEur),
    assumptions,
    inputs: {
      annualSpendingEur: round2(annualSpending),
      foreignAnnualSpendingEur: round2(foreignAnnualSpending),
      foreignWithdrawalsPerYear,
    },
  };
}

/**
 * Coût annuel net de la SITUATION ACTUELLE de l'utilisateur.
 *
 * On ne connaît pas la banque : on modélise une carte de réseau traditionnelle
 * (frais de change et de retrait typiques) et on y injecte la cotisation
 * déclarée. Le résultat est un fait chiffré estimé, pas un jugement.
 */
export function computeCurrentSituationCost(
  profile: UsageProfile,
  assumptions: EngineAssumptions = DEFAULT_ASSUMPTIONS,
): CostBreakdown {
  const syntheticCurrentCard: Card = {
    id: "__situation_actuelle__",
    name: "Situation actuelle (estimée)",
    issuer: "—",
    network: "—",
    tier: "intermediaire",
    monthly_fee_eur: null,
    annual_fee_eur: profile.currentAnnualFeeEur,
    free_condition: null,
    fx_fee_percent: DEFAULT_CURRENT_SITUATION.fxFeePercent,
    foreign_withdrawal: "Modèle de frais d'une carte de réseau traditionnelle.",
    insurances_level: "premier_gold",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: null, est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    foreign_withdrawal_fee_percent:
      DEFAULT_CURRENT_SITUATION.foreignWithdrawalFeePercent,
    foreign_withdrawal_flat_eur:
      DEFAULT_CURRENT_SITUATION.foreignWithdrawalFlatEur,
    free_foreign_withdrawals_per_month:
      DEFAULT_CURRENT_SITUATION.freeForeignWithdrawalsPerMonth,
    cashback_rate_percent: 0,
    min_monthly_income_eur: null,
  };
  return computeAnnualCost(syntheticCurrentCard, profile, assumptions);
}

/** Éligibilité au regard du revenu déclaré. Inconnu ⇒ éligible (transparence). */
export function isEligible(card: Card, profile: UsageProfile): boolean {
  const min = card.min_monthly_income_eur;
  if (min == null) return true;
  return profile.monthlyIncomeEur >= min;
}

export interface RankOptions {
  assumptions?: EngineAssumptions;
  /** Si true, exclut les cartes pour lesquelles le revenu est insuffisant. */
  onlyEligible?: boolean;
}

/**
 * Classe TOUTES les cartes par coût annuel net croissant.
 *
 * Tri strictement objectif : coût net, puis cotisation, puis nom (déterminisme).
 * Aucune notion de "carte pour vous". L'éligibilité est exposée par carte ;
 * elle ne réordonne le classement que si `onlyEligible` est demandé (filtrage).
 */
export function rankCards(
  cards: Card[],
  profile: UsageProfile,
  options: RankOptions = {},
): RankedCard[] {
  const assumptions = options.assumptions ?? DEFAULT_ASSUMPTIONS;
  const current = computeCurrentSituationCost(profile, assumptions);

  const rows: RankedCard[] = cards.map((card) => {
    const breakdown = computeAnnualCost(card, profile, assumptions);
    return {
      card,
      breakdown,
      eligible: isEligible(card, profile),
      savingsVsCurrentEur: round2(
        current.netAnnualCostEur - breakdown.netAnnualCostEur,
      ),
    };
  });

  const filtered = options.onlyEligible
    ? rows.filter((r) => r.eligible)
    : rows;

  return filtered.sort((a, b) => {
    const byCost = a.breakdown.netAnnualCostEur - b.breakdown.netAnnualCostEur;
    if (byCost !== 0) return byCost;
    const byFee = a.card.annual_fee_eur - b.card.annual_fee_eur;
    if (byFee !== 0) return byFee;
    return a.card.name.localeCompare(b.card.name);
  });
}

/**
 * Priorité 4 — sépare le classement en cartes accessibles (revenu suffisant) et
 * cartes nécessitant un revenu plus élevé, SANS modifier l'ordre interne. Permet
 * à l'affichage de regrouper les non éligibles dans une section dédiée plutôt que
 * de les mélanger au classement principal.
 */
export function splitByEligibility(ranked: RankedCard[]): {
  eligible: RankedCard[];
  ineligible: RankedCard[];
} {
  return {
    eligible: ranked.filter((r) => r.eligible),
    ineligible: ranked.filter((r) => !r.eligible),
  };
}

/**
 * Priorité 6 — poids relatif de chaque poste de COÛT (cotisation, change,
 * retrait) dans le coût brut, trié par montant décroissant. Permet d'expliquer
 * lisiblement pourquoi une carte premium est mal classée pour un voyageur en
 * devises (ex. « 71 % du coût vient des frais de change »).
 */
export function costComposition(breakdown: CostBreakdown): CostShare[] {
  const posts: CostShare[] = [
    { post: "cotisation", amountEur: breakdown.annualFeeEur, share: 0 },
    { post: "change", amountEur: breakdown.fxFeeEur, share: 0 },
    { post: "retrait", amountEur: breakdown.foreignWithdrawalFeeEur, share: 0 },
  ];
  const gross = breakdown.grossCostEur;
  for (const p of posts) {
    p.share = gross > 0 ? round2(p.amountEur / gross) : 0;
  }
  return posts.sort((a, b) => b.amountEur - a.amountEur);
}

/** Restreint une part à l'intervalle [0, 1]. */
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
```

---

## `lib/cards.ts` (chargement des données)

```ts
// lib/cards.ts
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
```

---

## `data/cards.json` (catalogue — 15 cartes, valeurs vérifiées)

> Source de vérité : `data/cards.json` (**version 1.0**). La **provenance
> officielle** de chaque valeur (URL, date de grille, citation par champ) est
> dans **`cards_v1_verified.json`** ; la synthèse et les réserves de fiabilité
> dans **`rapport_verification_cartes.md`**. Ci-dessous, un extrait d'audit des
> champs qui pèsent dans le calcul (les colonnes UI/affiliation — `cashback`,
> `miles_program`, `affiliate`, `target_profiles`, `verif_note` — sont dans le
> fichier réel). Retrait = **en devises** ; `∞` = gratuit illimité ; `n.p.` =
> valeur € du point non publiée → non créditée.

| Carte | Cotis./an | fx % | Retrait devises (fee % / fixe € / gratuits/mois) | Prime € | Revenu req. €/mois | Points (pt/€ × €/pt) | Vérif. |
|---|--:|--:|---|--:|--:|---|:--:|
| BoursoBank Welcome | 0 | 0 | 1,69 % / 0 / 1 | 0 | — | — | ✅ |
| BoursoBank Ultim | 0 | 0 | 1,69 % / 0 / 3 | 0 | — | — | ✅ |
| BoursoBank Ultim Metal | 118,80 | 0 | 0 / 0 / ∞ | 0 | — | — (cashback 0,20 %) | ✅ |
| Fortuneo Fosfo | 0 | 0 | 0 / 0 / ∞ | 30 | — | — | ✅ |
| Fortuneo Gold | 0 | 0 | 0 / 0 / ∞ | 80 | 2 200 | — | ✅ |
| Fortuneo World Elite | 0 | 0 | 0 / 0 / ∞ | 0 | 4 000 | — | ✅ |
| Hello Prime | 60 | 0 | 0 / 0 / ∞ | 80 | 1 500 | — | ✅ |
| Monabanq Uniq+ | 108 | 0 | 0 / 0 / ∞ | 0 | — | — | ✅ |
| Revolut Standard | 0 | 1 | 2 % / 0 / 2 | 20 | — | 0,1 × n.p. | ✅ |
| Revolut Premium | 131,88 | 0 | 2 % / 0 / 4 | 20 | — | 0,25 × n.p. | ✅ |
| N26 Standard | 0 | 0 | 1,7 % / 0 / 0 | 0 | — | — | ✅ |
| American Express Gold | 252 | 2,80 | 2 % / 3 / 0 | 0 | — | 1 × 0,004 | ✅ |
| Carte AF-KLM Amex Gold | 252 | 2,80 | 2 % / 3 / 0 | 0 | — | 1 × 0,01 | ✅ |
| Visa Premier (référence) | 135 | 2,70 | 3 % / 0 / 0 | 0 | — | — | indic. |
| Gold Mastercard (référence) | 130 | 2,70 | 3 % / 0 / 0 | 0 | — | — | indic. |

> **Traductions moteur notables** (politique officielle → champ `[moteur]`) :
> plafond de retrait exprimé en **montant** encodé en **nombre** à ~100 €/retrait
> (Revolut Premium 400 €/mois → `free = 4`, Standard 200 €/mois → `free = 2`) ;
> N26 : quota gratuit **zone euro** ignoré, retrait **devises** facturé 1,7 % dès
> le 1er (`free = 0`) ; BoursoBank Metal `annual_fee = 118,80` dérivé de
> 9,90 €/mois ; primes non confirmées comme récurrentes mises à **0**.
