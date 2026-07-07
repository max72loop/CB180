// app/api/postback/route.ts
// Réception des conversions affiliées (server-to-server). Le réseau (Partnerize)
// appelle cette URL à chaque conversion — ouverture de compte / carte validée —
// en y passant NOTRE click_id (sub-id) + la commission. On referme ainsi la
// boucle : revenu → clic → visiteur.
//
// Sécurité : l'endpoint est public (le réseau doit pouvoir l'appeler) mais gardé
// par un secret partagé (POSTBACK_SECRET), transmis en param `token` ou en
// en-tête `Authorization: Bearer`. Sans secret configuré, l'endpoint refuse tout
// (jamais ouvert par défaut).
//
// Robustesse : GET et POST acceptés (les pixels S2S sont souvent des GET), noms
// de paramètres tolérants (le vocabulaire varie selon le réseau), idempotent via
// `conversion_ref`. On répond 200 dès que la conversion est enregistrée pour que
// le réseau ne rejoue pas inutilement.

import { NextRequest, NextResponse } from "next/server";
import {
  isDbConfigured,
  recordConversion,
  type ConversionStatus,
} from "@/lib/db";

export const runtime = "nodejs";

/** Premier param non vide parmi une liste d'alias (insensible à la casse). */
function pick(params: URLSearchParams, keys: string[]): string | null {
  for (const k of keys) {
    const v = params.get(k);
    if (v != null && v.trim() !== "") return v.trim();
  }
  return null;
}

/** Normalise le statut réseau vers notre vocabulaire canonique. */
function normalizeStatus(raw: string | null): ConversionStatus {
  const s = (raw ?? "").toLowerCase();
  if (/(approv|confirm|valid|paid|accept|complete)/.test(s)) return "approved";
  if (/(reject|declin|cancel|void|refus|charge)/.test(s)) return "rejected";
  return "pending";
}

/** Montant décimal tolérant (accepte la virgule décimale), ou null. */
function parseAmount(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Vérifie le secret partagé (param `token`/`secret`/`key` ou Bearer). */
function isAuthorized(req: NextRequest, params: URLSearchParams): boolean {
  const secret = process.env.POSTBACK_SECRET;
  if (!secret) return false; // jamais ouvert sans secret configuré
  const fromParam = pick(params, ["token", "secret", "key"]);
  const auth = req.headers.get("authorization");
  const fromHeader = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  return fromParam === secret || fromHeader === secret;
}

/** Fusionne les paramètres de query et, pour un POST, ceux du corps. */
async function collectParams(req: NextRequest): Promise<URLSearchParams> {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  if (req.method === "POST") {
    try {
      const ct = req.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const body = await req.json();
        for (const [k, v] of Object.entries(body ?? {})) {
          if (v != null) params.set(k, String(v));
        }
      } else {
        const text = await req.text();
        for (const [k, v] of new URLSearchParams(text)) params.set(k, v);
      }
    } catch {
      /* corps illisible : on se contente de la query */
    }
  }
  return params;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const params = await collectParams(req);

  if (!isAuthorized(req, params)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Identifiant unique de la conversion côté réseau : indispensable à
  // l'idempotence. Sans lui, on ne peut pas dédupliquer → on refuse.
  const conversionRef = pick(params, [
    "conversion_id",
    "conversionref",
    "conversion_ref",
    "conv_id",
    "order_id",
    "oid",
    "transaction_id",
    "txn_id",
    "ref",
  ]);
  if (!conversionRef) {
    return NextResponse.json(
      { error: "conversion_ref_manquant" },
      { status: 400 },
    );
  }

  const clickId = pick(params, [
    "clickref",
    "pubref",
    "click_id",
    "clickid",
    "subid",
    "sub_id",
    "sid",
  ]);
  const status = normalizeStatus(pick(params, ["status", "state"]));
  const commissionEur = parseAmount(
    pick(params, ["commission", "commission_eur", "payout", "value", "amount"]),
  );
  const currency = pick(params, ["currency", "cur"]) ?? "EUR";

  if (!isDbConfigured()) {
    // On accuse réception (le réseau ne doit pas rejouer), mais rien n'est stocké.
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const created = await recordConversion({
      conversionRef,
      clickId,
      status,
      commissionEur,
      currency,
      raw: JSON.stringify(Object.fromEntries(params)),
    });
    return NextResponse.json({ ok: true, stored: true, created });
  } catch (e) {
    console.error("postback error", e);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
