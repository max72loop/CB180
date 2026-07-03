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
 * Choisir cette option laisse continuer le parcours et fait basculer le moteur
 * en mode « toutes cartes affichées, sans vérification des conditions d'accès ».
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
      {
        id: "i_skip",
        label: "Je préfère ne pas répondre",
        hint: "toutes les cartes vous seront affichées",
        value: 0,
        band: "non_renseigne",
      },
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
