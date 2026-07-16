// lib/guides.test.ts
// Garde-fou ÉDITORIAL : le guide « carte-avec-miles-aeriens » publie des chiffres
// (2,80 % de change, barèmes d'accumulation, exemple sur 1 000 €) tirés de
// data/cards.json et du facteur de réalisme du moteur. Ces valeurs sont figées
// dans de la prose : si le catalogue ou le barème évolue, la page devient fausse
// SANS que rien ne casse. Ces tests rattachent chaque affirmation à sa source.

import { describe, expect, test } from "vitest";
import { getGuide } from "./guides";
import { cards } from "./cards";
import { DEFAULT_ASSUMPTIONS } from "./engine";
import type { Card } from "./types";

const guide = getGuide("carte-avec-miles-aeriens");

/** Cartes Amex à miles : celles dont le guide cite les barèmes. */
const amexMiles = cards.filter((c) => c.network === "Amex" && c.miles_program != null);

/** Rendement des miles en % de la dépense (avant facteur de réalisme). */
const milesYieldPercent = (c: Card): number =>
  (c.points_per_euro ?? 0) * (c.point_value_eur ?? 0) * 100;

const byId = (id: string): Card => {
  const c = cards.find((x) => x.id === id);
  if (!c) throw new Error(`Carte « ${id} » citée par le guide, absente du catalogue.`);
  return c;
};

describe("guide miles : les chiffres publiés collent au catalogue", () => {
  test("le guide existe et porte du corps éditorial", () => {
    expect(guide).toBeDefined();
    expect(guide!.sections?.length).toBeGreaterThan(0);
  });

  /** Texte publié (sections + réponses de FAQ), pour vérifier les mentions. */
  const published = [
    ...(guide?.sections ?? []).map((s) => s.body),
    ...(guide?.faq ?? []).map((f) => f.a),
  ].join(" ");

  test("« 2,80 % de frais de change » vaut pour TOUTES les cartes Amex citées", () => {
    expect(amexMiles.length).toBeGreaterThan(0);
    for (const c of amexMiles) expect(c.fx_fee_percent).toBe(2.8);
    expect(published).toContain("2,80 %");
  });

  test("les barèmes d'accumulation cités nommément sont ceux du catalogue", () => {
    // « 1 mile par euro […] 0,01 € par mile » → 1 % de la dépense.
    expect(byId("amex-afklm-gold").points_per_euro).toBe(1);
    expect(byId("amex-afklm-gold").point_value_eur).toBe(0.01);
    // « la Silver crédite 0,5 mile par euro (0,5 %) »
    expect(byId("amex-afklm-silver").points_per_euro).toBe(0.5);
    // « la Platinum 1,3 mile par euro (1,3 %) »
    expect(byId("amex-afklm-platinum").points_per_euro).toBe(1.3);
    // « Membership Rewards […] 0,004 € par point (0,4 %) »
    expect(byId("amex-gold").point_value_eur).toBe(0.004);
    expect(milesYieldPercent(byId("amex-gold"))).toBeCloseTo(0.4, 6);
  });

  test("AFFIRMATION CENTRALE : aucune carte Amex ne rattrape ses propres frais de change", () => {
    for (const c of amexMiles) {
      expect(
        milesYieldPercent(c),
        `${c.id} : les miles (${milesYieldPercent(c)} %) rattrapent le change (${c.fx_fee_percent} %) — le guide affirme le contraire`,
      ).toBeLessThan(c.fx_fee_percent);
    }
  });

  test("« de 1,5 à 2,4 points » : l'écart publié encadre bien la gamme", () => {
    const gaps = amexMiles.map((c) => c.fx_fee_percent - milesYieldPercent(c));
    expect(Math.min(...gaps)).toBeCloseTo(1.5, 6);
    expect(Math.max(...gaps)).toBeCloseTo(2.4, 6);
  });

  test("l'exemple publié sur 1 000 € en devises (28 € / 10 € / 7 € / 21 €) est exact", () => {
    const gold = byId("amex-afklm-gold");
    const spend = 1000;
    const fx = (gold.fx_fee_percent / 100) * spend;
    const milesGross = (gold.points_per_euro ?? 0) * (gold.point_value_eur ?? 0) * spend;
    const milesNet = milesGross * DEFAULT_ASSUMPTIONS.rewardsRealizationFactor;
    expect(fx).toBeCloseTo(28, 6); // « le change facture 28 € »
    expect(milesGross).toBeCloseTo(10, 6); // « les miles pèsent environ 10 € »
    expect(milesNet).toBeCloseTo(7, 6); // « ramenés à 7 € »
    expect(fx - milesNet).toBeCloseTo(21, 6); // « négatif d'environ 21 € »
    expect(fx - milesGross).toBeCloseTo(18, 6); // « 18 € même en valorisant à 100 % »
  });

  test("« 1,8 point avant / 2,1 après » : la FAQ colle au facteur de réalisme", () => {
    const gold = byId("amex-afklm-gold");
    const gross = milesYieldPercent(gold);
    const net = gross * DEFAULT_ASSUMPTIONS.rewardsRealizationFactor;
    expect(gold.fx_fee_percent - gross).toBeCloseTo(1.8, 6);
    expect(gold.fx_fee_percent - net).toBeCloseTo(2.1, 6);
  });

  test("le retrait en devises cité (2 %, minimum 3 €, aucun gratuit) est celui du catalogue", () => {
    const gold = byId("amex-afklm-gold");
    expect(gold.foreign_withdrawal_fee_percent).toBe(2);
    expect(gold.foreign_withdrawal_flat_eur).toBe(3);
    expect(gold.free_foreign_withdrawals_per_month ?? 0).toBe(0);
  });

  test("les cartes citées par leur nom exact existent (le maillage interne en dépend)", () => {
    // linkifyCardNames ne crée un lien que sur une correspondance EXACTE du nom.
    for (const name of [
      "Carte Air France KLM American Express Gold",
      "Carte Air France KLM American Express Silver",
      "Carte Air France KLM American Express Platinum",
      "American Express Carte Gold",
    ]) {
      expect(cards.some((c) => c.name === name), `nom « ${name} » introuvable`).toBe(true);
      expect(published).toContain(name);
    }
  });
});
