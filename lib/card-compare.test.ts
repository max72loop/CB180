// lib/card-compare.test.ts
// Tests de la couche pure du comparatif : scores comparables, lignes
// conditionnelles (rowHasData) et surbrillance de la meilleure valeur
// (bestIndices). Ces lignes sont partagées par le modal de /cartes et la page
// SEO /comparatif/[slug] : ce qui est testé ici vaut pour les deux surfaces.

import { describe, expect, it } from "vitest";
import {
  COMPARE_ROWS,
  FEATURE_COMPARE_ROWS,
  bestIndices,
  rowHasData,
  withdrawalScore,
} from "./card-compare";
import type { Card } from "./types";

function makeCard(over: Partial<Card> = {}): Card {
  return {
    id: "c",
    name: "Carte",
    issuer: "Banque",
    network: "Visa",
    tier: "intermediaire",
    monthly_fee_eur: null,
    annual_fee_eur: 0,
    free_condition: null,
    fx_fee_percent: 0,
    foreign_withdrawal: "Gratuit",
    insurances_level: "none",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: null, est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    ...over,
  };
}

const row = (id: string) =>
  [...COMPARE_ROWS, ...FEATURE_COMPARE_ROWS].find((r) => r.id === id)!;

describe("scores comparables (plus bas = mieux)", () => {
  it("mappe cotisation, change et revenu sur des scores", () => {
    const c = makeCard({ annual_fee_eur: 60, fx_fee_percent: 2, min_monthly_income_eur: 1200 });
    expect(row("fee").score!(c)).toBe(60);
    expect(row("fx").score!(c)).toBe(2);
    expect(row("income").score!(c)).toBe(1200);
  });

  it("retrait : somme % + fixe, 0 si illimité, null si inconnu", () => {
    expect(
      withdrawalScore(
        makeCard({ foreign_withdrawal_fee_percent: 2, foreign_withdrawal_flat_eur: 1 }),
      ),
    ).toBe(3);
    expect(withdrawalScore(makeCard({ free_foreign_withdrawals_per_month: 100 }))).toBe(0);
    expect(withdrawalScore(makeCard())).toBeNull();
  });

  it("sans condition de revenu => score 0 (meilleur)", () => {
    expect(row("income").score!(makeCard())).toBe(0);
  });
});

describe("bestIndices — surbrillance objective", () => {
  it("surligne la valeur minimale quand il y a une différence", () => {
    const cards = [
      makeCard({ id: "a", annual_fee_eur: 60 }),
      makeCard({ id: "b", annual_fee_eur: 0 }),
      makeCard({ id: "c", annual_fee_eur: 120 }),
    ];
    expect([...bestIndices(row("fee"), cards)]).toEqual([1]);
  });

  it("surligne toutes les cartes ex æquo sur le minimum", () => {
    const cards = [
      makeCard({ id: "a", fx_fee_percent: 0 }),
      makeCard({ id: "b", fx_fee_percent: 0 }),
      makeCard({ id: "c", fx_fee_percent: 2 }),
    ];
    expect([...bestIndices(row("fx"), cards)]).toEqual([0, 1]);
  });

  it("ne surligne rien si toutes les valeurs sont égales", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    expect(bestIndices(row("fee"), cards).size).toBe(0);
  });

  it("ignore les scores inconnus et n'exige pas qu'ils soient renseignés", () => {
    const cards = [
      makeCard({ id: "a", foreign_withdrawal_fee_percent: 2 }),
      makeCard({ id: "b" }), // score de retrait inconnu
    ];
    // Un seul score valide => pas de comparaison possible => rien de surligné.
    expect(bestIndices(row("withdrawal"), cards).size).toBe(0);
  });

  it("ne surligne jamais une ligne sans score (réseau, fonctionnalités)", () => {
    const cards = [
      makeCard({ id: "a", network: "Visa", features: { applePay: true } }),
      makeCard({ id: "b", network: "Mastercard", features: { applePay: false } }),
    ];
    expect(bestIndices(row("network"), cards).size).toBe(0);
    expect(bestIndices(row("applePay"), cards).size).toBe(0);
  });
});

describe("rowHasData — lignes conditionnelles", () => {
  it("masque une ligne dont aucune carte n'a la donnée (plafond, note)", () => {
    const cards = [makeCard(), makeCard()];
    expect(rowHasData(row("ceiling"), cards)).toBe(false);
    expect(rowHasData(row("rating"), cards)).toBe(false);
    // Réseau et cotisation sont toujours renseignés.
    expect(rowHasData(row("network"), cards)).toBe(true);
    expect(rowHasData(row("fee"), cards)).toBe(true);
  });

  it("affiche une ligne dès qu'UNE seule carte la renseigne", () => {
    const cards = [makeCard({ cashback: "1 %" }), makeCard()];
    expect(rowHasData(row("cashback"), cards)).toBe(true);
    expect(rowHasData(row("miles"), cards)).toBe(false);
  });

  it("masque une fonctionnalité qu'aucune des deux cartes ne renseigne", () => {
    const unknown = [makeCard(), makeCard()];
    expect(rowHasData(row("applePay"), unknown)).toBe(false);
    // Une absence CONFIRMÉE (false) est une donnée : la ligne s'affiche.
    const confirmed = [makeCard({ features: { applePay: false } }), makeCard()];
    expect(rowHasData(row("applePay"), confirmed)).toBe(true);
  });
});

describe("catalogue de lignes — invariants partagés par les deux surfaces", () => {
  it("n'a aucun id en double (les surfaces indexent les lignes par id)", () => {
    const ids = [...COMPARE_ROWS, ...FEATURE_COMPARE_ROWS].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("donne un bestLabel à toute ligne scorée, et à elle seule", () => {
    for (const r of [...COMPARE_ROWS, ...FEATURE_COMPARE_ROWS]) {
      expect(Boolean(r.bestLabel)).toBe(Boolean(r.score));
    }
  });

  it("couvre le mode de débit et la matière parmi les fonctionnalités", () => {
    const cards = [
      makeCard({ features: { debitType: "differe", cardMaterial: "metal" } }),
      makeCard(),
    ];
    expect(row("debitType").value(cards[0])).toBe("Débit différé");
    expect(row("cardMaterial").value(cards[0])).toBe("Carte métal");
    expect(row("debitType").value(cards[1])).toBeNull();
  });
});
