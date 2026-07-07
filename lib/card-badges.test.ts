// lib/card-badges.test.ts
// Tests des critères d'attribution des badges « Best for » (dérivés, ordonnés).

import { describe, expect, it } from "vitest";
import { cardBadges } from "./card-badges";
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
    foreign_withdrawal: "-",
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

const ids = (c: Card) => cardBadges(c).map((b) => b.id);

describe("cardBadges — critères", () => {
  it("voyage : change 0 %, retrait DAB 0 %, assurance voyage", () => {
    const c = makeCard({
      fx_fee_percent: 0,
      foreign_withdrawal_fee_percent: 0,
      insurances_level: "premier_gold",
    });
    expect(ids(c)).toContain("travel");
    // Sans assurance voyage, pas de badge voyage.
    expect(ids(makeCard({ fx_fee_percent: 0, foreign_withdrawal_fee_percent: 0 }))).not.toContain("travel");
  });

  it("premium : haut de gamme + cotisation > 150 € + assurances premium", () => {
    const c = makeCard({ tier: "premium", annual_fee_eur: 300, insurances_level: "elite" });
    expect(ids(c)).toContain("premium");
    // Cotisation trop basse => pas premium.
    expect(ids(makeCard({ tier: "premium", annual_fee_eur: 120, insurances_level: "elite" }))).not.toContain("premium");
  });

  it("cashback : taux explicite ou texte de remises", () => {
    expect(ids(makeCard({ cashback_rate_percent: 1 }))).toContain("cashback");
    expect(ids(makeCard({ cashback: "0,1 % sur tout" }))).toContain("cashback");
    expect(ids(makeCard())).not.toContain("cashback");
  });

  it("étudiant : cotisation < 30 € et sans condition de revenu", () => {
    expect(ids(makeCard({ annual_fee_eur: 0 }))).toContain("student");
    expect(ids(makeCard({ annual_fee_eur: 20, min_monthly_income_eur: null }))).toContain("student");
    // Condition de revenu => pas étudiant.
    expect(ids(makeCard({ annual_fee_eur: 0, min_monthly_income_eur: 1200 }))).not.toContain("student");
  });

  it("gratuite : cotisation 0 € sans frais mensuel", () => {
    expect(ids(makeCard({ annual_fee_eur: 0 }))).toContain("free");
    expect(ids(makeCard({ annual_fee_eur: 60 }))).not.toContain("free");
  });
});

describe("cardBadges — priorité et plafond d'affichage", () => {
  it("ordonne selon la priorité (voyage avant premium avant cashback…)", () => {
    // Carte métal voyage + premium + cashback : ordre attendu travel, premium, cashback.
    const c = makeCard({
      tier: "premium",
      annual_fee_eur: 200,
      insurances_level: "elite",
      fx_fee_percent: 0,
      foreign_withdrawal_fee_percent: 0,
      cashback_rate_percent: 1,
    });
    expect(ids(c)).toEqual(["travel", "premium", "cashback"]);
  });

  it("l'affichage se limite aux 2 premiers (slice côté UI)", () => {
    const c = makeCard({ annual_fee_eur: 0, cashback_rate_percent: 0.1 });
    // cashback + student + free éligibles ; on n'affiche que les 2 premiers.
    expect(cardBadges(c).slice(0, 2).map((b) => b.id)).toEqual(["cashback", "student"]);
  });

  it("aucune donnée saillante => aucun badge inattendu (carte intermédiaire payante)", () => {
    expect(ids(makeCard({ tier: "intermediaire", annual_fee_eur: 60, monthly_fee_eur: 5 }))).toEqual([]);
  });
});
