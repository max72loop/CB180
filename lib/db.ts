// lib/db.ts : client Turso (libSQL) et fonctions de persistance CB180.
// SERVER-ONLY : ne jamais importer depuis un composant client.
//
// Env requis : TURSO_DATABASE_URL, TURSO_AUTH_TOKEN (dans .env.local, non commité).

import "server-only";
import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "crypto";
import type { AuditProfile, AuditResult } from "./audit";

// Client paresseux : créé au premier appel, pas à l'import du module. Évite
// qu'un build/analyse de route plante quand les variables d'env sont absentes.
let client: Client | null = null;

function getDb(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL manquant. Renseignez .env.local (voir SETUP_TURSO.md).",
    );
  }
  client = createClient({ url, authToken });
  return client;
}

/** True si la base est configurée (permet aux routes de dégrader proprement). */
export function isDbConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

/** Enregistre un audit anonymisé, renvoie le session_id opaque. */
export async function saveAudit(
  profile: AuditProfile,
  result: AuditResult,
): Promise<string> {
  const id = randomUUID();
  await getDb().execute({
    sql: `INSERT INTO audits (
      id, created_at, spend_band, foreign_share, travel_freq,
      foreign_withdraw, current_fee_band, reward_pref, income_band,
      profile_type, top_card_id, current_annual_cost, best_annual_gain
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      new Date().toISOString(),
      profile.spend_band,
      profile.foreign_share,
      profile.travel_freq,
      profile.foreign_withdraw,
      profile.current_fee_band,
      profile.reward_pref,
      profile.income_band,
      profile.profile_type,
      result.top_card_id,
      result.current_annual_cost,
      result.best_annual_gain,
    ],
  });
  return id;
}

/** Enregistre un email, table séparée, reliée seulement par session_id opaque. */
export async function saveEmail(
  sessionId: string | null,
  email: string,
  consent: boolean,
): Promise<void> {
  await getDb().execute({
    sql: `INSERT INTO emails (id, session_id, email, created_at, consent)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      sessionId,
      email,
      new Date().toISOString(),
      consent ? 1 : 0,
    ],
  });
}

/** Données d'inscription à une alerte tarifaire. */
export interface AlertSubscription {
  email: string;
  /** Carte suivie ; null pour un suivi de toutes les cartes. */
  cardId: string | null;
  /** Contexte d'inscription ("fiche" | "footer" | ...), pour l'analyse. */
  source: string | null;
}

/**
 * Inscrit une alerte tarifaire (double opt-in). La ligne est créée non
 * confirmée ; elle ne devient active qu'au clic sur le lien de confirmation.
 * Renvoie les deux jetons opaques (confirmation et désinscription).
 */
export async function subscribeAlert(
  sub: AlertSubscription,
): Promise<{ confirmToken: string; unsubToken: string }> {
  const confirmToken = randomUUID();
  const unsubToken = randomUUID();
  await getDb().execute({
    sql: `INSERT INTO alertes (
      id, email, card_id, source, created_at, confirm_token, unsub_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      sub.email.trim().toLowerCase(),
      sub.cardId,
      sub.source,
      new Date().toISOString(),
      confirmToken,
      unsubToken,
    ],
  });
  return { confirmToken, unsubToken };
}

/** Confirme une alerte via son jeton. True si une ligne encore active a été confirmée. */
export async function confirmAlertByToken(token: string): Promise<boolean> {
  const res = await getDb().execute({
    sql: `UPDATE alertes SET confirmed_at = ?
          WHERE confirm_token = ? AND confirmed_at IS NULL AND unsubscribed_at IS NULL`,
    args: [new Date().toISOString(), token],
  });
  return res.rowsAffected > 0;
}

/** Désabonne une alerte via son jeton (soft delete). True si une ligne a été désabonnée. */
export async function unsubscribeAlertByToken(token: string): Promise<boolean> {
  const res = await getDb().execute({
    sql: `UPDATE alertes SET unsubscribed_at = ?
          WHERE unsub_token = ? AND unsubscribed_at IS NULL`,
    args: [new Date().toISOString(), token],
  });
  return res.rowsAffected > 0;
}

export type FunnelEvent =
  | "arrivee"
  | "start_quiz"
  | "quickwin" // écart estimé express affiché (après 3 questions)
  | "affiner" // clic sur « Affiner mon estimation »
  | "complete" // les 6 questions renseignées (résultat complet)
  | "click_affilie"
  | "partage" // partage du chiffre d'économie (boucle virale)
  | "telechargement"; // téléchargement de l'image de partage (boucle virale)

/** Log d'un event de funnel. */
export async function logEvent(
  sessionId: string | null,
  eventType: FunnelEvent,
  meta?: Record<string, unknown>,
): Promise<void> {
  await getDb().execute({
    sql: `INSERT INTO events (id, session_id, event_type, meta, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      sessionId,
      eventType,
      meta ? JSON.stringify(meta) : null,
      new Date().toISOString(),
    ],
  });
}

// ─── Attribution affiliée : clics & conversions ────────────────────────────

export interface ClickInput {
  /** Identifiant opaque du clic, envoyé au partenaire en sub-id (clickref). */
  clickId: string;
  /** Session d'audit éventuelle (corrélation parcours), opaque. */
  sessionId: string | null;
  cardId: string;
  network: string | null;
  /** Contexte du clic (`from` : "results" | "fiche" | ...). */
  source: string | null;
  /** Commission estimée figée au moment du clic (revenu potentiel). */
  estCommissionEur: number | null;
}

/** Enregistre un clic affilié attribuable (une ligne par clic sur « Voir l'offre »). */
export async function saveClick(click: ClickInput): Promise<void> {
  await getDb().execute({
    sql: `INSERT INTO clicks (
      id, created_at, session_id, card_id, network, source, est_commission_eur
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      click.clickId,
      new Date().toISOString(),
      click.sessionId,
      click.cardId,
      click.network,
      click.source,
      click.estCommissionEur,
    ],
  });
}

/** Statut canonique d'une conversion, normalisé depuis le vocabulaire réseau. */
export type ConversionStatus = "pending" | "approved" | "rejected";

export interface ConversionInput {
  /** Identifiant unique de la conversion côté réseau (idempotence). */
  conversionRef: string;
  /** click_id renvoyé par le réseau (sub-id) ; null si non rattachable. */
  clickId: string | null;
  status: ConversionStatus;
  commissionEur: number | null;
  currency: string | null;
  /** Payload brut reçu, conservé pour audit/debug. */
  raw?: string | null;
}

/**
 * Enregistre (ou met à jour) une conversion reçue par postback. Idempotent :
 * un même `conversion_ref` ne crée jamais deux lignes ; un postback rejoué ou un
 * changement de statut (pending → approved → rejected) met simplement la ligne à
 * jour. Le `card_id` est dénormalisé depuis le clic quand celui-ci est connu.
 * Renvoie true si une nouvelle conversion a été créée (false = mise à jour).
 */
export async function recordConversion(input: ConversionInput): Promise<boolean> {
  const db = getDb();

  // Rattachement au clic : récupère la carte pour l'analyse par carte.
  let cardId: string | null = null;
  if (input.clickId) {
    try {
      const c = await db.execute({
        sql: "SELECT card_id FROM clicks WHERE id = ?",
        args: [input.clickId],
      });
      cardId = c.rows[0] ? String(c.rows[0].card_id) : null;
    } catch {
      /* table clicks absente : rattachement ignoré */
    }
  }

  // Création ou mise à jour ? On teste l'existence AVANT l'upsert : `rowsAffected`
  // d'un upsert SQLite ne distingue pas INSERT d'UPDATE (il vaut 1 dans les deux
  // cas, contrairement à MySQL). Ce booléen est purement informatif.
  const existing = await db.execute({
    sql: "SELECT 1 FROM conversions WHERE conversion_ref = ?",
    args: [input.conversionRef],
  });
  const wasNew = existing.rows.length === 0;

  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO conversions (
            id, created_at, updated_at, click_id, conversion_ref,
            status, commission_eur, currency, card_id, raw
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(conversion_ref) DO UPDATE SET
            updated_at     = excluded.updated_at,
            status         = excluded.status,
            commission_eur = excluded.commission_eur,
            currency       = excluded.currency,
            click_id       = COALESCE(conversions.click_id, excluded.click_id),
            card_id        = COALESCE(conversions.card_id, excluded.card_id)`,
    args: [
      randomUUID(),
      now,
      now,
      input.clickId,
      input.conversionRef,
      input.status,
      input.commissionEur,
      input.currency,
      cardId,
      input.raw ?? null,
    ],
  });
  return wasNew;
}

/** Stats simples pour le suivi kill/continue (usage shell/CLI). */
export async function getStats() {
  const db = getDb();
  const audits = await db.execute("SELECT COUNT(*) as n FROM audits");
  const clicks = await db.execute(
    "SELECT COUNT(*) as n FROM events WHERE event_type = 'click_affilie'",
  );
  const emailsCount = await db.execute("SELECT COUNT(*) as n FROM emails");
  return {
    audits_completes: Number(audits.rows[0].n),
    clics_affilies: Number(clicks.rows[0].n),
    emails_collectes: Number(emailsCount.rows[0].n),
  };
}

/** Bloc « tunnel affilié & revenu » du tableau de bord. */
export interface AffiliateStats {
  /** Nombre de clics affiliés attribuables (table clicks). */
  clicks: number;
  conversionsApproved: number;
  conversionsPending: number;
  conversionsRejected: number;
  /** Revenu confirmé (postbacks approuvés). */
  revenueApproved: number;
  /** Revenu en attente de validation (postbacks pending). */
  revenuePending: number;
  /** Revenu potentiel = somme des commissions estimées figées aux clics. */
  projectedRevenue: number;
  /** Arrivées sur le simulateur (dénominateur du revenu par visiteur). */
  arrivals: number;
  /** Détail par carte, trié par revenu réel puis potentiel décroissant. */
  perCard: {
    cardId: string;
    clicks: number;
    conversions: number;
    revenue: number;
    projected: number;
  }[];
}

export interface DashboardStats {
  audits: number;
  clicks: number;
  emails: number;
  emailsConsent: number;
  alerts: number;
  alertsConfirmed: number;
  auditsLast7d: number;
  avgCurrentCost: number | null;
  avgBestGain: number | null;
  topCards: { cardId: string; count: number }[];
  eventsByType: { type: string; count: number }[];
  affiliate: AffiliateStats;
}

const EMPTY_AFFILIATE: AffiliateStats = {
  clicks: 0,
  conversionsApproved: 0,
  conversionsPending: 0,
  conversionsRejected: 0,
  revenueApproved: 0,
  revenuePending: 0,
  projectedRevenue: 0,
  arrivals: 0,
  perCard: [],
};

/**
 * Agrège le tunnel affilié (clics → conversions → revenu). Toléré si les tables
 * clicks/conversions n'existent pas encore (base non migrée) : renvoie des zéros.
 */
async function getAffiliateStats(): Promise<AffiliateStats> {
  const db = getDb();
  const num = (v: unknown) => Number(v ?? 0);
  try {
    const clicks = await db.execute(
      "SELECT COUNT(*) AS n, COALESCE(SUM(est_commission_eur), 0) AS proj FROM clicks",
    );
    const conv = await db.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) AS approved,
         COALESCE(SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected,
         COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_eur ELSE 0 END), 0) AS rev_approved,
         COALESCE(SUM(CASE WHEN status = 'pending'  THEN commission_eur ELSE 0 END), 0) AS rev_pending
       FROM conversions`,
    );
    const arrivals = await db.execute(
      "SELECT COUNT(*) AS n FROM events WHERE event_type = 'arrivee'",
    );
    // Par carte : clics + revenu potentiel, joints au revenu réel approuvé.
    const perCard = await db.execute(
      `SELECT c.card_id AS card_id,
              COUNT(*) AS clicks,
              COALESCE(SUM(c.est_commission_eur), 0) AS projected,
              COALESCE((
                SELECT COUNT(*) FROM conversions v
                WHERE v.card_id = c.card_id AND v.status = 'approved'
              ), 0) AS conversions,
              COALESCE((
                SELECT SUM(v.commission_eur) FROM conversions v
                WHERE v.card_id = c.card_id AND v.status = 'approved'
              ), 0) AS revenue
       FROM clicks c
       GROUP BY c.card_id
       ORDER BY revenue DESC, projected DESC
       LIMIT 12`,
    );

    return {
      clicks: num(clicks.rows[0].n),
      conversionsApproved: num(conv.rows[0].approved),
      conversionsPending: num(conv.rows[0].pending),
      conversionsRejected: num(conv.rows[0].rejected),
      revenueApproved: num(conv.rows[0].rev_approved),
      revenuePending: num(conv.rows[0].rev_pending),
      projectedRevenue: num(clicks.rows[0].proj),
      arrivals: num(arrivals.rows[0].n),
      perCard: perCard.rows.map((r) => ({
        cardId: String(r.card_id),
        clicks: num(r.clicks),
        conversions: num(r.conversions),
        revenue: num(r.revenue),
        projected: num(r.projected),
      })),
    };
  } catch {
    return { ...EMPTY_AFFILIATE };
  }
}

/** Stats détaillées pour la page admin /stats. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const num = (v: unknown) => Number(v ?? 0);

  const audits = await db.execute("SELECT COUNT(*) AS n FROM audits");
  const emails = await db.execute(
    "SELECT COUNT(*) AS n, COALESCE(SUM(consent), 0) AS c FROM emails",
  );
  const clicks = await db.execute(
    "SELECT COUNT(*) AS n FROM events WHERE event_type = 'click_affilie'",
  );
  // Alertes actives (non désabonnées) et part confirmée (double opt-in).
  // Toléré si la table n'existe pas encore (base non ré-initialisée).
  let alertsN = 0;
  let alertsConfirmedN = 0;
  try {
    const alerts = await db.execute(
      `SELECT COUNT(*) AS n,
              COALESCE(SUM(CASE WHEN confirmed_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS c
       FROM alertes WHERE unsubscribed_at IS NULL`,
    );
    alertsN = num(alerts.rows[0].n);
    alertsConfirmedN = num(alerts.rows[0].c);
  } catch {
    /* table alertes absente : compteurs à 0 */
  }
  const last7d = await db.execute(
    "SELECT COUNT(*) AS n FROM audits WHERE created_at >= date('now', '-7 days')",
  );
  const averages = await db.execute(
    "SELECT AVG(current_annual_cost) AS ac, AVG(best_annual_gain) AS ag FROM audits",
  );
  const topCards = await db.execute(
    `SELECT top_card_id AS id, COUNT(*) AS n FROM audits
     WHERE top_card_id IS NOT NULL AND top_card_id != ''
     GROUP BY top_card_id ORDER BY n DESC LIMIT 8`,
  );
  const events = await db.execute(
    "SELECT event_type AS t, COUNT(*) AS n FROM events GROUP BY event_type ORDER BY n DESC",
  );
  const affiliate = await getAffiliateStats();

  return {
    audits: num(audits.rows[0].n),
    clicks: num(clicks.rows[0].n),
    emails: num(emails.rows[0].n),
    emailsConsent: num(emails.rows[0].c),
    alerts: alertsN,
    alertsConfirmed: alertsConfirmedN,
    auditsLast7d: num(last7d.rows[0].n),
    avgCurrentCost:
      averages.rows[0].ac == null ? null : num(averages.rows[0].ac),
    avgBestGain: averages.rows[0].ag == null ? null : num(averages.rows[0].ag),
    topCards: topCards.rows.map((r) => ({
      cardId: String(r.id),
      count: num(r.n),
    })),
    eventsByType: events.rows.map((r) => ({
      type: String(r.t),
      count: num(r.n),
    })),
    affiliate,
  };
}
