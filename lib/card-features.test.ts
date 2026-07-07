// lib/card-features.test.ts
// Tests de la couche fonctionnalités : tri-état, groupes, atouts, comparatif.

import { describe, expect, it } from "vitest";
import {
  debitLabel,
  featureCompareValue,
  featureHighlights,
  featureStatus,
  groupRows,
  hasFeatures,
  materialLabel,
  FEATURE_GROUPS,
} from "./card-features";
import type { Card, CardFeatures } from "./types";

function makeCard(features?: CardFeatures): Card {
  return {
    id: "t",
    name: "Test",
    issuer: "Test",
    network: "Visa",
    tier: "intermediaire",
    monthly_fee_eur: null,
    annual_fee_eur: 0,
    free_condition: null,
    fx_fee_percent: 0,
    foreign_withdrawal: "-",
    insurances_level: "basique",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: null, est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    features,
  };
}

describe("featureStatus — tri-état", () => {
  it("distingue confirmé présent, confirmé absent et non vérifié", () => {
    expect(featureStatus(makeCard({ applePay: true }), "applePay")).toBe("yes");
    expect(featureStatus(makeCard({ applePay: false }), "applePay")).toBe("no");
    expect(featureStatus(makeCard({}), "applePay")).toBe("unknown");
    expect(featureStatus(makeCard(), "applePay")).toBe("unknown");
  });
});

describe("hasFeatures", () => {
  it("faux sans bloc ou bloc vide, vrai dès un champ renseigné", () => {
    expect(hasFeatures(makeCard())).toBe(false);
    expect(hasFeatures(makeCard({}))).toBe(false);
    expect(hasFeatures(makeCard({ frenchIban: true }))).toBe(true);
    expect(hasFeatures(makeCard({ chequebook: false }))).toBe(true);
  });
});

describe("groupRows — la fiche masque le non vérifié", () => {
  it("n'inclut que les fonctionnalités au statut connu (yes/no)", () => {
    const card = makeCard({ applePay: true, googlePay: false }); // virtualCard non renseignée
    const paiement = FEATURE_GROUPS.find((g) => g.id === "paiement")!;
    const rows = groupRows(card, paiement);
    const keys = rows.map((r) => r.key);
    expect(keys).toContain("applePay");
    expect(keys).toContain("googlePay");
    expect(keys).not.toContain("virtualCard");
    expect(rows.find((r) => r.key === "googlePay")!.status).toBe("no");
  });
});

describe("debitLabel / materialLabel — enums", () => {
  it("libellent les valeurs connues, null sinon", () => {
    expect(debitLabel(makeCard({ debitType: "choix" }))).toMatch(/au choix/i);
    expect(debitLabel(makeCard({ debitType: "differe" }))).toBe("Débit différé");
    expect(debitLabel(makeCard())).toBeNull();
    expect(materialLabel(makeCard({ cardMaterial: "metal" }))).toBe("Carte métal");
    expect(materialLabel(makeCard())).toBeNull();
  });
});

describe("featureHighlights — atouts positifs, ordonnés, bornés", () => {
  it("ne renvoie que des faits confirmés positifs, dans l'ordre de priorité", () => {
    const card = makeCard({
      remuneratedBalance: true,
      debitType: "differe",
      disposableVirtualCards: true,
      chequebook: false, // confirmé absent → jamais un atout
    });
    const hl = featureHighlights(card, 3);
    expect(hl).toEqual(["Solde rémunéré", "Débit différé possible", "Cartes virtuelles jetables"]);
    expect(hl).not.toContain("Chéquier disponible");
  });

  it("vide si aucune fonctionnalité", () => {
    expect(featureHighlights(makeCard())).toEqual([]);
  });
});

describe("featureCompareValue — wording tri-état du comparatif", () => {
  it("mappe yes/no/unknown vers Oui/Non/—", () => {
    expect(featureCompareValue(makeCard({ subAccounts: true }), "subAccounts")).toBe("Oui");
    expect(featureCompareValue(makeCard({ subAccounts: false }), "subAccounts")).toBe("Non");
    expect(featureCompareValue(makeCard(), "subAccounts")).toBe("—");
  });
});
