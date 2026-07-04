// lib/mailer.ts — envoi de l'email de résultat via l'API REST Resend.
// SERVER-ONLY. Aucune dépendance npm : on appelle l'API en fetch.
//
// Configuré par RESEND_API_KEY + RESEND_FROM. Sans ces variables, l'envoi est
// désactivé proprement (sent: false) et l'UI adapte son message.

import "server-only";
import { SITE_URL } from "@/lib/site";

export interface ResultSummary {
  topCardName?: string;
  gainEur?: number;
  currentCostEur?: number;
}

const SITE = SITE_URL;

const eur = (n?: number) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n);

/** True si un fournisseur d'envoi est configuré. */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

function buildHtml(summary: ResultSummary): string {
  const gainLine =
    summary.gainEur != null && summary.gainEur > 0
      ? `<p style="margin:0 0 8px">Écart estimé avec la carte la moins chère du panel : <strong style="color:#059669">${eur(
          summary.gainEur,
        )} / an</strong>.</p>`
      : "";
  const topLine = summary.topCardName
    ? `<p style="margin:0 0 8px">Carte la moins chère selon vos réponses : <strong>${summary.topCardName}</strong>.</p>`
    : "";
  const currentLine =
    summary.currentCostEur != null
      ? `<p style="margin:0 0 8px">Coût annuel estimé de votre situation actuelle : <strong>${eur(
          summary.currentCostEur,
        )} / an</strong>.</p>`
      : "";

  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="font-size:20px;font-weight:800;color:#4f46e5;margin-bottom:16px">CB180</div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">Votre récapitulatif de simulation</h1>
      ${currentLine}${topLine}${gainLine}
      <p style="margin:16px 0 0">
        <a href="${SITE}/simulateur" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Revoir ou refaire ma simulation</a>
      </p>
    </div>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin-top:16px">
      CB180 est un site d'information et de comparaison, non intermédiaire en opérations de banque.
      Ce récapitulatif ne constitue ni un conseil personnalisé ni une recommandation de souscription.
      Les montants dépendent des fourchettes que vous avez saisies. Pour ne plus recevoir d'email, répondez « stop ».
    </p>
  </div>
</body></html>`;
}

/** Envoie l'email de résultat. Renvoie { sent } ; ne jette jamais. */
export async function sendResultEmail(
  to: string,
  summary: ResultSummary,
): Promise<{ sent: boolean }> {
  return sendViaResend({
    to,
    subject: "Votre simulation CB180",
    html: buildHtml(summary),
  });
}

export interface AlertConfirmation {
  /** Nom de la carte suivie ; absent = suivi de toutes les cartes. */
  cardName?: string;
  /** URL absolue du lien de confirmation (double opt-in). */
  confirmUrl: string;
  /** URL absolue du lien de désinscription. */
  unsubUrl: string;
}

function buildAlertHtml(a: AlertConfirmation): string {
  const scope = a.cardName
    ? `l'évolution du coût de <strong>${a.cardName}</strong>`
    : `l'évolution du coût des cartes bancaires`;
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="font-size:20px;font-weight:800;color:#4f46e5;margin-bottom:16px">CB180</div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">Confirmez votre alerte tarifaire</h1>
      <p style="margin:0 0 8px">Vous avez demandé à être prévenu de ${scope}. Il ne reste qu'une étape : confirmer votre adresse.</p>
      <p style="margin:20px 0 0">
        <a href="${a.confirmUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Confirmer mon alerte</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#64748b">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><span style="color:#4f46e5;word-break:break-all">${a.confirmUrl}</span></p>
    </div>
    <p style="font-size:12px;color:#64748b;line-height:1.6;margin-top:16px">
      Vous recevez cet email parce que votre adresse a été saisie sur CB180 pour une alerte tarifaire.
      Si ce n'est pas vous, ignorez ce message : sans confirmation, aucune alerte ne sera envoyée.
      Vous pouvez vous <a href="${a.unsubUrl}" style="color:#64748b">désinscrire</a> à tout moment.
      CB180 est un site d'information et de comparaison, non intermédiaire en opérations de banque.
    </p>
  </div>
</body></html>`;
}

/**
 * Envoie l'email de confirmation d'inscription à une alerte tarifaire
 * (double opt-in). Renvoie { sent } ; ne jette jamais.
 */
export async function sendAlertConfirmation(
  to: string,
  a: AlertConfirmation,
): Promise<{ sent: boolean }> {
  return sendViaResend({
    to,
    subject: a.cardName
      ? `Confirmez votre alerte tarif — ${a.cardName}`
      : "Confirmez votre alerte tarif CB180",
    html: buildAlertHtml(a),
    headers: { "List-Unsubscribe": `<${a.unsubUrl}>` },
  });
}

/** Appel bas niveau à l'API Resend, partagé par tous les envois. Ne jette jamais. */
async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}): Promise<{ sent: boolean }> {
  if (!isMailerConfigured()) return { sent: false };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.headers ? { headers: opts.headers } : {}),
      }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}
