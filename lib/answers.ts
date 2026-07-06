// lib/answers.ts
// Couche de mapping questionnaire → profil moteur.
//
// Le questionnaire ne collecte que des FOURCHETTES (jamais de montant exact),
// aucune donnée identifiante, ni le nom de la banque actuelle. Chaque option
// porte une valeur représentative numérique injectée dans le moteur.
//
// Cette couche est pure et testable indépendamment de l'UI.

import type { UsageProfile } from "./types";

/** Identifiant stable de chaque question (6 questions). */
export type QuestionId =
  | "monthlySpending"
  | "foreignShare"
  | "foreignWithdrawals"
  | "currentFee"
  | "rewardsInterest"
  | "income";

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
 * Priorité 5 : id de l'option « je préfère ne pas répondre » du revenu.
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
];

/**
 * Simulateur en deux phases (réduction de friction).
 *
 * Phase QUICK WIN : 3 questions seulement (dépenses, part hors zone euro,
 * cotisation actuelle) → un premier écart estimé, « SON chiffre », en < 30 s.
 * Ces 3 questions suffisent au moteur car le reste peut être défauté sans
 * fabriquer d'économie (cf. DEFAULT_DEFERRED_ANSWERS).
 */
export const QUICK_WIN_IDS: QuestionId[] = [
  "monthlySpending",
  "foreignShare",
  "currentFee",
];

/**
 * Phase AFFINAGE : les 3 questions restantes, dans un ordre engageant (revenu
 * en dernier, une fois l'utilisateur investi).
 */
export const REFINE_IDS: QuestionId[] = [
  "foreignWithdrawals",
  "rewardsInterest",
  "income",
];

/**
 * Ordre d'AFFICHAGE du parcours complet : d'abord les 3 questions du quick win,
 * puis les 3 de l'affinage. Source unique consommée par l'UI ; le mapping
 * retrouve chaque réponse par son id, indépendamment de cet ordre.
 */
export const DISPLAY_ORDER: QuestionId[] = [...QUICK_WIN_IDS, ...REFINE_IDS];

/**
 * Libellés courts pour le rail d'étapes (desktop). Décrivent la question en un
 * mot-repère, distincts des intitulés complets posés à l'écran.
 */
export const SHORT_LABELS: Record<QuestionId, string> = {
  monthlySpending: "Dépenses",
  foreignShare: "Hors zone euro",
  currentFee: "Cotisation",
  foreignWithdrawals: "Retraits",
  rewardsInterest: "Récompenses",
  income: "Revenu",
};

/**
 * Hypothèses par défaut pour les 3 questions NON posées en phase quick win.
 * Choix PRUDENTS : ils ne fabriquent aucune économie, pour que l'estimation
 * express soit une base honnête que l'affinage vient préciser.
 *  - retraits « jamais » : n'ajoute de frais ni à la situation actuelle ni aux cartes.
 *  - récompenses « non » : miles/cashback comptés seulement si l'utilisateur les veut.
 *  - revenu « non renseigné » : aucun filtre d'éligibilité au stade express.
 */
export const DEFAULT_DEFERRED_ANSWERS: Partial<Record<QuestionId, string>> = {
  foreignWithdrawals: "w1", // Jamais → 0 retrait/mois
  rewardsInterest: "r2", // Non → valuesRewards false
  income: INCOME_SKIP_OPTION_ID, // « Je préfère ne pas répondre »
};

/** True si les 3 questions du quick win ont une réponse (calcul express possible). */
export function quickWinComplete(answers: Answers): boolean {
  return QUICK_WIN_IDS.every((id) => answers[id] != null);
}

/** Nombre de questions du quick win déjà répondues (barre de progression express). */
export function quickWinAnsweredCount(answers: Answers): number {
  return QUICK_WIN_IDS.filter((id) => answers[id] != null).length;
}

/**
 * Complète un jeu de réponses PARTIEL avec les défauts des questions différées,
 * sans écraser une réponse déjà donnée. Les 3 questions du quick win doivent
 * être présentes (garanti par `quickWinComplete`).
 */
export function answersWithDefaults(answers: Answers): Answers {
  return { ...DEFAULT_DEFERRED_ANSWERS, ...answers };
}

/**
 * Construit un profil moteur à partir de réponses PARTIELLES : les questions
 * non répondues prennent leur défaut prudent. Utilisé pour le chiffre express
 * (3 réponses) comme pour tout état intermédiaire de l'affinage. Le même moteur
 * pur tourne ensuite, que le profil vienne de 3 ou de 8 réponses réelles.
 */
export function answersToProfileLenient(answers: Answers): UsageProfile {
  return answersToProfile(answersWithDefaults(answers));
}

/** Slug de fourchette (analytics) de l'option retenue pour une question. */
export function selectedBand(qid: QuestionId, answers: Answers): string {
  const question = QUESTIONS.find((q) => q.id === qid);
  const option = question?.options.find((o) => o.id === answers[qid]);
  return option?.band ?? "";
}

/** Une entrée du résumé « votre profil se dessine » (rail desktop). */
export interface AnswerChip {
  qid: QuestionId;
  /** Mot-repère de la question (SHORT_LABELS). */
  label: string;
  /** Libellé de l'option retenue. */
  value: string;
}

/**
 * Résumé des réponses déjà données, dans l'ordre d'affichage : alimente le rail
 * vivant du desktop qui se remplit à chaque réponse. Pure, testable.
 */
export function answerChips(answers: Answers): AnswerChip[] {
  const chips: AnswerChip[] = [];
  for (const qid of DISPLAY_ORDER) {
    const optionId = answers[qid];
    if (optionId == null) continue;
    const option = QUESTIONS.find((q) => q.id === qid)?.options.find(
      (o) => o.id === optionId,
    );
    if (!option) continue;
    chips.push({ qid, label: SHORT_LABELS[qid], value: option.label });
  }
  return chips;
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

  return {
    monthlySpendingEur: requireNumber("monthlySpending", answers),
    foreignSpendingShare: requireNumber("foreignShare", answers),
    // Fréquence de voyage retirée du questionnaire : le moteur ne s'en sert que
    // comme plancher de la part hors euro déjà déclarée, on neutralise donc ce
    // signal (0) et la part déclarée fait foi.
    travelOutsideEuropePerYear: 0,
    foreignWithdrawalsPerMonth: requireNumber("foreignWithdrawals", answers),
    currentAnnualFeeEur: requireNumber("currentFee", answers),
    valuesRewards: rewards === true,
    monthlyIncomeEur: requireNumber("income", answers),
    // Profil type retiré du questionnaire : inerte dans le calcul du coût.
    profileType: "autre",
  };
}
