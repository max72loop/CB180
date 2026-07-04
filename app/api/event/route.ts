// app/api/event/route.ts : log léger du funnel (arrivée, start, complétion,
// clic affilié). Utilisé pour le suivi kill/continue.

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, logEvent, type FunnelEvent } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED: FunnelEvent[] = [
  "arrivee",
  "start_quiz",
  "quickwin",
  "affiner",
  "complete",
  "click_affilie",
];

export async function POST(req: NextRequest) {
  try {
    const { sessionId, eventType, meta } = await req.json();

    if (!ALLOWED.includes(eventType)) {
      return NextResponse.json({ error: "event_invalide" }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ ok: true, stored: false });
    }

    await logEvent(
      typeof sessionId === "string" ? sessionId : null,
      eventType,
      meta,
    );
    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    console.error("event error", e);
    return NextResponse.json({ error: "log_failed" }, { status: 500 });
  }
}
