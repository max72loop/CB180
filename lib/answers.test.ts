// lib/answers.test.ts
// Tests de la couche de mapping questionnaire → profil.

import { describe, expect, it } from "vitest";
import {
  answeredCount,
  answersToProfile,
  answersToProfileLenient,
  answersWithDefaults,
  isComplete,
  quickWinComplete,
  QUESTIONS,
  QUICK_WIN_IDS,
  REFINE_IDS,
  type Answers,
} from "./answers";

/** Réponses complètes reconstituant le profil "voyageur régulier". */
const voyageurAnswers: Answers = {
  monthlySpending: "s4", // 2750
  foreignShare: "f4", // 0.40
  travelFrequency: "t4", // 5
  foreignWithdrawals: "w3", // 2
  currentFee: "c4", // 130
  rewardsInterest: "r1", // true
  income: "i4", // 3250
  profileType: "p3", // voyageur_regulier
};

describe("structure du questionnaire", () => {
  it("comporte 8 questions, chacune avec au moins 2 options", () => {
    expect(QUESTIONS).toHaveLength(8);
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("les identifiants d'option sont uniques au sein de chaque question", () => {
    for (const q of QUESTIONS) {
      const ids = q.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("progression", () => {
  it("isComplete est faux tant qu'une réponse manque", () => {
    const partial: Answers = { ...voyageurAnswers };
    delete partial.income;
    expect(isComplete(partial)).toBe(false);
    expect(isComplete(voyageurAnswers)).toBe(true);
  });

  it("answeredCount compte les réponses fournies", () => {
    expect(answeredCount({})).toBe(0);
    expect(answeredCount({ monthlySpending: "s1" })).toBe(1);
    expect(answeredCount(voyageurAnswers)).toBe(8);
  });
});

describe("answersToProfile", () => {
  it("mappe les fourchettes vers les valeurs représentatives attendues", () => {
    const profile = answersToProfile(voyageurAnswers);
    expect(profile).toEqual({
      monthlySpendingEur: 2750,
      foreignSpendingShare: 0.4,
      travelOutsideEuropePerYear: 5,
      foreignWithdrawalsPerMonth: 2,
      currentAnnualFeeEur: 130,
      valuesRewards: true,
      monthlyIncomeEur: 3250,
      profileType: "voyageur_regulier",
    });
  });

  it("mappe correctement l'intérêt pour les récompenses en booléen", () => {
    const noRewards = answersToProfile({
      ...voyageurAnswers,
      rewardsInterest: "r2",
    });
    expect(noRewards.valuesRewards).toBe(false);
  });

  it("lève une erreur si le questionnaire est incomplet", () => {
    const partial: Answers = { ...voyageurAnswers };
    delete partial.profileType;
    expect(() => answersToProfile(partial)).toThrow();
  });
});

describe("simulateur en deux phases", () => {
  // Les 3 seules réponses du quick win (dépenses / part hors euro / cotisation).
  const quickAnswers: Answers = {
    monthlySpending: "s3", // 1500
    foreignShare: "f2", // 0.10
    currentFee: "c4", // 130
  };

  it("QUICK_WIN_IDS et REFINE_IDS partitionnent les 8 questions sans recouvrement", () => {
    expect(QUICK_WIN_IDS).toHaveLength(3);
    expect(REFINE_IDS).toHaveLength(5);
    expect(new Set([...QUICK_WIN_IDS, ...REFINE_IDS]).size).toBe(QUESTIONS.length);
  });

  it("quickWinComplete est vrai dès que les 3 questions express sont répondues", () => {
    expect(quickWinComplete({})).toBe(false);
    expect(quickWinComplete({ monthlySpending: "s3", foreignShare: "f2" })).toBe(false);
    expect(quickWinComplete(quickAnswers)).toBe(true);
  });

  it("answersToProfileLenient chiffre avec 3 réponses et des défauts prudents", () => {
    const profile = answersToProfileLenient(quickAnswers);
    expect(profile).toEqual({
      monthlySpendingEur: 1500, // réponse réelle
      foreignSpendingShare: 0.1, // réponse réelle
      currentAnnualFeeEur: 130, // réponse réelle
      travelOutsideEuropePerYear: 0, // défaut « jamais »
      foreignWithdrawalsPerMonth: 0, // défaut « jamais »
      valuesRewards: false, // défaut « non »
      monthlyIncomeEur: 0, // défaut « non renseigné »
      profileType: "autre", // défaut inerte
    });
  });

  it("les défauts n'écrasent jamais une réponse déjà donnée", () => {
    const withTravel = answersWithDefaults({ ...quickAnswers, travelFrequency: "t4" });
    expect(withTravel.travelFrequency).toBe("t4"); // réponse réelle conservée
  });

  it("sur un jeu complet, le mode lenient égale le mode strict (aucun défaut ne fuit)", () => {
    expect(answersToProfileLenient(voyageurAnswers)).toEqual(
      answersToProfile(voyageurAnswers),
    );
  });
});
