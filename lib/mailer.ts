// lib/mailer.ts — envoi de l'email de résultat via l'API REST Resend.
// SERVER-ONLY. Aucune dépendance npm : on appelle l'API en fetch.
//
// Configuré par RESEND_API_KEY + RESEND_FROM. Sans ces variables, l'envoi est
// désactivé proprement (sent: false) et l'UI adapte son message.

import "server-only";

export interface ResultSummary {
  topCardName?: string;
  gainEur?: number;
  currentCostEur?: number;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cb180.fr";

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
        to: [to],
        subject: "Votre simulation CB180",
        html: buildHtml(summary),
      }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}
