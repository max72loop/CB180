// scripts/init-db.mjs
// Charge schema.sql dans la base Turso SANS le CLI, via le driver @libsql/client.
// Usage : npm run db:init  (après avoir rempli .env.local)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@libsql/client";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Charge .env.local manuellement (un script Node standalone ne le fait pas).
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env.local absent : on comptera sur les variables déjà exportées */
  }
}

loadEnvLocal();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error(
    "❌ TURSO_DATABASE_URL manquant. Copie .env.example en .env.local et renseigne-le.",
  );
  process.exit(1);
}

const db = createClient({ url, authToken });
const schema = readFileSync(join(root, "schema.sql"), "utf8");

console.log(`→ Connexion à ${url}`);
await db.executeMultiple(schema);
console.log(
  "✓ Schéma chargé (audits, emails, events, alertes, clicks, conversions).",
);

// IF NOT EXISTS : ré-exécuter est sûr et idempotent (aucune donnée écrasée).
for (const table of [
  "audits",
  "emails",
  "events",
  "alertes",
  "clicks",
  "conversions",
]) {
  const res = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
  console.log(`  ${table} : ${res.rows[0].n} ligne(s)`);
}
console.log("✓ Base prête.");
