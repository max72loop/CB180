// app/api/alertes/route.ts — inscription à une alerte tarifaire (double opt-in).
// L'email est enregistré NON confirmé ; un lien de confirmation part par email.
// Consentement marketing explicite OBLIGATOIRE (c'est la finalité de la liste).
//
// Table dédiée `alertes`, séparée du profil d'audit. Chaque ligne porte son
// propre jeton de désinscription pour un retrait en un clic (RGPD).

import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, subscribeAlert } from "@/lib/db";
import { sendAlertConfirmation } from "@/lib/mailer";
import { getCard } from "@/lib/cards";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email, cardId, source, consent } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "email_invalide" }, { status: 400 });
    }
    // La liste d'alertes est du marketing : le consentement en est la base légale.
    if (!consent) {
      return NextResponse.json({ error: "consentement_requis" }, { status: 400 });
    }

    // Carte suivie : seulement si l'id correspond à une vraie carte du catalogue.
    const card =
      typeof cardId === "string" && cardId ? getCard(cardId) : undefined;
    const trackedCardId = card ? card.id : null;

    // Sans base configurée (local sans Turso), on ne peut pas gérer le double
    // opt-in : on dégrade proprement, l'UI adaptera son message.
    if (!isDbConfigured()) {
      return NextResponse.json({ ok: true, stored: false, sent: false });
    }

    const { confirmToken, unsubToken } = await subscribeAlert({
      email,
      cardId: trackedCardId,
      source: typeof source === "string" ? source.slice(0, 40) : null,
    });

    // URLs absolues construites depuis l'origine de la requête (fiable en
    // preview comme en prod, au contraire d'une constante figée).
    const origin = req.nextUrl.origin;
    const confirmUrl = `${origin}/api/alertes/confirm?token=${confirmToken}`;
    const unsubUrl = `${origin}/api/alertes/unsubscribe?token=${unsubToken}`;

    const { sent } = await sendAlertConfirmation(email, {
      cardName: card?.name,
      confirmUrl,
      unsubUrl,
    });

    return NextResponse.json({ ok: true, stored: true, sent });
  } catch (e) {
    console.error("alerte error", e);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
