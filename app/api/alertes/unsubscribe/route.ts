// app/api/alertes/unsubscribe/route.ts — désinscription en un clic (RGPD).
// Le lien figure dans chaque email (bouton + en-tête List-Unsubscribe).
// Soft delete : la ligne est marquée unsubscribed_at, jamais supprimée en dur
// pour éviter une ré-inscription non désirée et garder la trace du retrait.

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, unsubscribeAlertByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");

  const dest = (etat: string) =>
    NextResponse.redirect(new URL(`/alertes?etat=${etat}`, origin), 302);

  if (!token || !isDbConfigured()) return dest("invalide");

  try {
    await unsubscribeAlertByToken(token);
    // Idempotent : déjà désabonné ou jeton inconnu → même message apaisant.
    return dest("desabonne");
  } catch (e) {
    console.error("unsub alerte error", e);
    return dest("invalide");
  }
}
