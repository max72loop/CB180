// app/api/audit/route.ts — reçoit le profil anonymisé + le résultat calculé
// côté client, enregistre l'audit et logue l'event de complétion.

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, logEvent, saveAudit } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { profile, result } = await req.json();

    if (!profile || !result) {
      return NextResponse.json({ error: "payload_invalide" }, { status: 400 });
    }

    // Base non configurée : on ne casse pas le parcours utilisateur.
    if (!isDbConfigured()) {
      return NextResponse.json({ sessionId: null, stored: false });
    }

    const sessionId = await saveAudit(profile, result);
    await logEvent(sessionId, "complete");
    return NextResponse.json({ sessionId, stored: true });
  } catch (e) {
    console.error("audit error", e);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
