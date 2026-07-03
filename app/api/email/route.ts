// app/api/email/route.ts — enregistre l'email séparément du profil, relié
// seulement par un session_id opaque. Consentement marketing explicite.

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, saveEmail } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email, consent } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "email_invalide" }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ ok: true, stored: false });
    }

    await saveEmail(
      typeof sessionId === "string" ? sessionId : null,
      email,
      Boolean(consent),
    );
    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    console.error("email error", e);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
