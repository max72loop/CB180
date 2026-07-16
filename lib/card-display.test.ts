// lib/card-display.test.ts
// Couvre les helpers de maillage interne : linkifyCardNames (liens éditoriaux
// contextuels) et relatedCards (suggestions de comparaison par pertinence).

import { describe, it, expect } from "vitest";
import { linkifyCardNames, relatedCards, type TextSegment } from "./card-display";
import type { Card } from "./types";

const CATALOG = [
  { id: "hellobank-prime", name: "Hello Prime" },
  { id: "hellobank-one", name: "Hello One" },
  { id: "nickel-standard", name: "Nickel" },
  { id: "nickel-chrome", name: "Nickel Chrome" },
];

/** Concatène les ids de carte liés, dans l'ordre. */
function linkedIds(segs: TextSegment[]): string[] {
  return segs.filter((s) => s.cardId).map((s) => s.cardId!);
}

describe("linkifyCardNames", () => {
  it("lie une mention de carte et préserve le texte", () => {
    const segs = linkifyCardNames(
      "La carte Hello Prime est intermédiaire.",
      CATALOG,
      new Set(),
    );
    expect(linkedIds(segs)).toEqual(["hellobank-prime"]);
    expect(segs.map((s) => s.text).join("")).toBe(
      "La carte Hello Prime est intermédiaire.",
    );
  });

  it("ne lie qu'une seule fois par carte (première occurrence)", () => {
    const segs = linkifyCardNames(
      "Hello Prime ici, et Hello Prime là.",
      CATALOG,
      new Set(),
    );
    expect(linkedIds(segs)).toEqual(["hellobank-prime"]);
  });

  it("respecte le Set partagé entre appels (déjà lié ailleurs)", () => {
    const shared = new Set<string>(["hellobank-prime"]);
    const segs = linkifyCardNames("Encore Hello Prime.", CATALOG, shared);
    expect(linkedIds(segs)).toEqual([]);
  });

  it("préfère le nom le plus long à position égale", () => {
    const segs = linkifyCardNames("La Nickel Chrome brille.", CATALOG, new Set());
    expect(linkedIds(segs)).toEqual(["nickel-chrome"]);
  });

  it("ne lie pas une occurrence au milieu d'un mot", () => {
    const segs = linkifyCardNames("Le mot Nickelodeon.", CATALOG, new Set());
    expect(linkedIds(segs)).toEqual([]);
  });

  it("distingue deux cartes proches de la même marque", () => {
    const segs = linkifyCardNames(
      "Hello One puis Hello Prime.",
      CATALOG,
      new Set(),
    );
    expect(linkedIds(segs)).toEqual(["hellobank-one", "hellobank-prime"]);
  });
});

/** Carte minimale pour tester la pertinence (seuls les champs lus comptent). */
function card(partial: Partial<Card> & Pick<Card, "id" | "name">): Card {
  return {
    issuer: "X",
    network: "Visa",
    tier: "intermediaire",
    monthly_fee_eur: 0,
    annual_fee_eur: 0,
    free_condition: null,
    fx_fee_percent: 0,
    foreign_withdrawal: "",
    insurances_level: "basique",
    cashback: null,
    miles_program: null,
    welcome_bonus_eur: 0,
    affiliate: { network: "Awin", est_commission_eur: 0 },
    target_profiles: [],
    last_verified: null,
    source_url: "",
    ...partial,
  };
}

describe("relatedCards", () => {
  it("classe une carte du même tier avant une carte d'un autre tier", () => {
    const ref = card({ id: "ref", name: "Ref", tier: "intermediaire" });
    const sameTier = card({ id: "same", name: "Same", tier: "intermediaire" });
    const otherTier = card({ id: "other", name: "Other", tier: "premium" });
    const out = relatedCards(ref, [ref, otherTier, sameTier], 2);
    expect(out[0].id).toBe("same");
  });

  it("valorise les profils cibles communs", () => {
    const ref = card({ id: "ref", name: "Ref", target_profiles: ["voyageur_regulier"] });
    const shared = card({
      id: "shared",
      name: "Shared",
      tier: "premium",
      target_profiles: ["voyageur_regulier"],
    });
    const unrelated = card({ id: "unrel", name: "Unrel", tier: "premium" });
    const out = relatedCards(ref, [ref, unrelated, shared], 1);
    expect(out[0].id).toBe("shared");
  });

  it("exclut la carte elle-même et borne le nombre", () => {
    const ref = card({ id: "ref", name: "Ref" });
    const a = card({ id: "a", name: "A" });
    const b = card({ id: "b", name: "B" });
    const out = relatedCards(ref, [ref, a, b], 1);
    expect(out).toHaveLength(1);
    expect(out.map((c) => c.id)).not.toContain("ref");
  });
});
