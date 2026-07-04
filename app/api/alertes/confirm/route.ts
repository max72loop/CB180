// app/api/alertes/confirm/route.ts : validation du double opt-in.
// Clic sur le lien reçu par email : marque l'alerte comme confirmée, puis
// redirige vers la page de statut lisible /alertes.

import { NextRequest, NextResponse } from "next/server";
import { confirmAlertByToken, isDbConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");

  const dest = (etat: string) =>
    NextResponse.redirect(new URL(`/alertes?etat=${etat}`, origin), 302);

  if (!token || !isDbConfigured()) return dest("invalide");

  try {
    const ok = await confirmAlertByToken(token);
    // ok=false : jeton inconnu OU déjà confirmé/désabonné. Message rassurant.
    return dest(ok ? "confirme" : "deja");
  } catch (e) {
    console.error("confirm alerte error", e);
    return dest("invalide");
  }
}
