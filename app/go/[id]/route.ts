// app/go/[id]/route.ts
// Redirection d'affiliation tracée. On logge le clic CÔTÉ SERVEUR (fiable, au
// contraire d'un onClick client perdu lors de la navigation), puis on redirige
// vers l'URL affiliée si elle existe, sinon vers la page officielle de la carte.
//
// Cette route est exclue de l'indexation (voir app/robots.ts) : ce sont des liens
// sortants sponsorisés, pas du contenu.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCard } from "@/lib/cards";
import { isDbConfigured, logEvent, saveClick } from "@/lib/db";
import { withClickRef } from "@/lib/affiliate";

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

  // Un vrai lien affilié (tracking) permet l'attribution ; à défaut on redirige
  // vers la page officielle (source_url) ou, en dernier repli, la fiche interne.
  const affiliateUrl = card.affiliate.url;
  const usingAffiliate = Boolean(affiliateUrl && affiliateUrl.startsWith("http"));
  const candidate = usingAffiliate ? affiliateUrl! : card.source_url;
  const base =
    candidate && candidate.startsWith("http")
      ? candidate
      : new URL(`/cartes/${card.id}`, origin).toString();

  // click_id : notre identifiant opaque, passé au partenaire en sub-id pour que
  // le postback de conversion puisse le renvoyer et refermer la boucle revenu.
  const clickId = randomUUID();
  const from = req.nextUrl.searchParams.get("from") ?? undefined;
  const sid = req.nextUrl.searchParams.get("sid");
  const sessionId = typeof sid === "string" && sid ? sid : null;

  // On n'ajoute le sub-id qu'au vrai lien affilié (inutile sur une page officielle).
  const target = usingAffiliate
    ? withClickRef(base, card.affiliate.network, clickId)
    : base;

  // Tracking serveur (non identifiant), best-effort : ne doit JAMAIS bloquer la
  // redirection. On enregistre le clic attribuable (table clicks) ET l'event de
  // funnel (continuité de l'entonnoir /stats).
  if (isDbConfigured()) {
    try {
      await saveClick({
        clickId,
        sessionId,
        cardId: card.id,
        network: card.affiliate.network,
        source: from ?? null,
        estCommissionEur: card.affiliate.est_commission_eur ?? null,
      });
    } catch {
      /* silencieux */
    }
    try {
      await logEvent(sessionId, "click_affilie", {
        card_id: card.id,
        click_id: clickId,
        ...(from ? { from } : {}),
      });
    } catch {
      /* silencieux */
    }
  }

  return NextResponse.redirect(target, 302);
}
