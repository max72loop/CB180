// scripts/snapshot-observatoire.mjs
// Relevé de l'Observatoire CB180 : calcule l'indice tarifaire du trimestre à
// partir du panel de cartes VÉRIFIÉES (last_verified renseigné, non « à
// vérifier ») et l'ajoute à data/observatoire-history.json.
//
// L'historique est un fichier VERSIONNÉ à dessein : un indice de presse doit
// être daté, reproductible et auditable — git en fait la trace publique. La
// page /observatoire lit ce fichier ; elle ne recalcule rien à la volée, ce qui
// garde le chiffre cité stable dans le trimestre.
//
// Usage : npm run observatoire:snapshot [-- --period=2026-Q3]
// Idempotent : relancer sur le même trimestre met le relevé à jour, sans doublon.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const round2 = (n) => Math.round(n * 100) / 100;
const mean = (xs) => (xs.length ? round2(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return round2(s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2);
}

const TIERS = [
  { key: "entree", label: "Entrée de gamme" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "premium", label: "Premium" },
  { key: "haut_de_gamme", label: "Haut de gamme" },
];

/** Trimestre calendaire d'une date : { period: "2026-Q3", label: "3ᵉ trimestre 2026" }. */
function quarterOf(date) {
  const y = date.getFullYear();
  const q = Math.floor(date.getMonth() / 3) + 1;
  const ord = ["1er", "2ᵉ", "3ᵉ", "4ᵉ"][q - 1];
  return { period: `${y}-Q${q}`, label: `${ord} trimestre ${y}` };
}

/** Une carte est « sans frais à l'étranger » : 0 % change ET aucun frais de retrait. */
const noForeignFee = (c) =>
  c.fx_fee_percent === 0 &&
  (c.foreign_withdrawal_fee_percent ?? 0) === 0 &&
  (c.foreign_withdrawal_flat_eur ?? 0) === 0;

function computeIndex(panel) {
  const fees = panel.map((c) => c.annual_fee_eur);
  const byFeeThenName = (a, b) =>
    a.annual_fee_eur - b.annual_fee_eur || a.name.localeCompare(b.name);
  const sorted = [...panel].sort(byFeeThenName);
  const card = (c) => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    fee: c.annual_fee_eur,
  });

  const byTier = TIERS.map(({ key, label }) => {
    const g = panel.filter((c) => c.tier === key);
    return { tier: key, label, count: g.length, avgFee: mean(g.map((c) => c.annual_fee_eur)) };
  }).filter((t) => t.count > 0);

  return {
    panelSize: panel.length,
    referenceDate: panel
      .map((c) => c.last_verified)
      .filter(Boolean)
      .sort()
      .at(-1),
    avgAnnualFee: mean(fees),
    medianAnnualFee: median(fees),
    minAnnualFee: Math.min(...fees),
    maxAnnualFee: Math.max(...fees),
    shareFree: round2(panel.filter((c) => c.annual_fee_eur === 0).length / panel.length),
    shareNoForeignFee: round2(panel.filter(noForeignFee).length / panel.length),
    avgFxFeePercent: mean(panel.map((c) => c.fx_fee_percent)),
    byTier,
    cheapest: card(sorted[0]),
    mostExpensive: card(sorted[sorted.length - 1]),
    // Liste par carte : socle du calcul des évolutions entre deux relevés.
    cards: sorted.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      annualFee: c.annual_fee_eur,
      fxFee: c.fx_fee_percent,
    })),
  };
}

// ─── Exécution ──────────────────────────────────────────────────────────────
const cardsRaw = JSON.parse(readFileSync(join(root, "data/cards.json"), "utf8"));
const panel = cardsRaw.cards.filter(
  (c) => c.last_verified != null && c.to_verify !== true,
);
if (panel.length === 0) {
  console.error("❌ Panel vide (aucune carte vérifiée). Relevé annulé.");
  process.exit(1);
}

const arg = process.argv.find((a) => a.startsWith("--period="));
const now = new Date();
const q = arg ? { period: arg.split("=")[1], label: arg.split("=")[1] } : quarterOf(now);

const entry = {
  period: q.period,
  label: q.label,
  generatedAt: now.toISOString().slice(0, 10),
  ...computeIndex(panel),
};

const histPath = join(root, "data/observatoire-history.json");
let hist;
try {
  hist = JSON.parse(readFileSync(histPath, "utf8"));
} catch {
  hist = {
    note: "Historique de l'Observatoire CB180 (indice tarifaire trimestriel). Généré par scripts/snapshot-observatoire.mjs, versionné pour la traçabilité. Ne pas éditer à la main.",
    snapshots: [],
  };
}

const existing = hist.snapshots.findIndex((s) => s.period === entry.period);
const isNew = existing === -1;
if (isNew) hist.snapshots.push(entry);
else hist.snapshots[existing] = entry;
hist.snapshots.sort((a, b) => a.period.localeCompare(b.period));

writeFileSync(histPath, JSON.stringify(hist, null, 2) + "\n", "utf8");

console.log(`${isNew ? "✓ Nouveau relevé" : "↻ Relevé mis à jour"} : ${entry.label} (${entry.period})`);
console.log(`  Panel vérifié          : ${entry.panelSize} cartes (au ${entry.referenceDate})`);
console.log(`  Cotisation moyenne     : ${entry.avgAnnualFee} € · médiane ${entry.medianAnnualFee} €`);
console.log(`  Fourchette             : ${entry.minAnnualFee} € → ${entry.maxAnnualFee} €`);
console.log(`  Sans cotisation        : ${Math.round(entry.shareFree * 100)} %`);
console.log(`  Sans frais à l'étranger: ${Math.round(entry.shareNoForeignFee * 100)} %`);
console.log(`  Frais de change moyen  : ${entry.avgFxFeePercent} %`);
console.log(`  Moins chère            : ${entry.cheapest.name} (${entry.cheapest.fee} €)`);
console.log(`  Plus chère             : ${entry.mostExpensive.name} (${entry.mostExpensive.fee} €)`);
console.log(`→ ${hist.snapshots.length} relevé(s) dans data/observatoire-history.json`);
