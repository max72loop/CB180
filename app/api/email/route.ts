// app/api/email/route.ts — enregistre l'email séparément du profil, relié
// seulement par un session_id opaque. Consentement marketing explicite.

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, saveEmail } from "@/lib/db";
import { sendResultEmail, type ResultSummary } from "@/lib/mailer";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email, consent, summary } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "email_invalide" }, { status: 400 });
    }

    // Stockage (table séparée) — seulement si la base est configurée.
    let stored = false;
    if (isDbConfigured()) {
      await saveEmail(
        typeof sessionId === "string" ? sessionId : null,
        email,
        Boolean(consent),
      );
      stored = true;
    }

    // Envoi du récapitulatif — seulement si un fournisseur (Resend) est configuré.
    const { sent } = await sendResultEmail(
      email,
      (summary ?? {}) as ResultSummary,
    );

    return NextResponse.json({ ok: true, stored, sent });
  } catch (e) {
    console.error("email error", e);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
