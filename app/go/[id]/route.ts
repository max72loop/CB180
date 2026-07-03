// app/go/[id]/route.ts
// Redirection d'affiliation tracée. On logge le clic CÔTÉ SERVEUR (fiable, au
// contraire d'un onClick client perdu lors de la navigation), puis on redirige
// vers l'URL affiliée si elle existe, sinon vers la page officielle de la carte.
//
// Cette route est exclue de l'indexation (voir app/robots.ts) : ce sont des liens
// sortants sponsorisés, pas du contenu.

import { NextRequest, NextResponse } from "next/server";
import { getCard } from "@/lib/cards";
import { isDbConfigured, logEvent } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = req.nextUrl.origin;
  const card = getCard(id);

  // Carte inconnue ou non publique : retour à l'index des cartes.
  if (!card || card.affiliate.network == null) {
    return NextResponse.redirect(new URL("/cartes", origin), 302);
  }

  // Cible : lien affilié s'il existe, sinon page officielle ; repli = fiche interne.
  const candidate = card.affiliate.url ?? card.source_url;
  const target =
    candidate && candidate.startsWith("http")
      ? candidate
      : new URL(`/cartes/${card.id}`, origin).toString();

  // Log serveur (non identifiant). `from` = contexte du clic, `sid` = session
  // d'audit éventuelle (corrélation avec le parcours, sans donnée personnelle).
  if (isDbConfigured()) {
    const from = req.nextUrl.searchParams.get("from") ?? undefined;
    const sid = req.nextUrl.searchParams.get("sid");
    try {
      await logEvent(typeof sid === "string" && sid ? sid : null, "click_affilie", {
        card_id: card.id,
        ...(from ? { from } : {}),
      });
    } catch {
      /* silencieux : le tracking ne doit jamais bloquer la redirection */
    }
  }

  return NextResponse.redirect(target, 302);
}
