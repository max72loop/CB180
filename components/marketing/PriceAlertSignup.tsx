"use client";

// components/marketing/PriceAlertSignup.tsx
// Capture d'email par un déclencheur récurrent et légitime : l'alerte tarifaire.
// « Les tarifs changent ; soyez prévenu si le coût de votre carte augmente. »
// C'est de la valeur récurrente (pas du spam) qui transforme un visiteur
// one-shot en contact réactivable — sans quoi chaque euro de trafic est perdu
// après la première visite.
//
// Double opt-in : l'inscription déclenche un email de confirmation ; l'email
// n'est actif qu'une fois le lien cliqué. Consentement explicite obligatoire.
//
// Deux variantes de présentation :
//  - "panel"  : bloc encadré, utilisé sur les fiches carte (ciblé sur la carte).
//  - "footer" : version compacte pour le pied de page (suivi de toutes les cartes).

import { useState } from "react";

interface PriceAlertSignupProps {
  /** Carte suivie ; absent = alerte sur l'ensemble des cartes. */
  card?: { id: string; name: string };
  /** Contexte d'inscription, transmis pour l'analyse ("fiche" | "footer" | ...). */
  source: string;
  variant?: "panel" | "footer";
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Status = "idle" | "sending" | "done" | "error";

export default function PriceAlertSignup({
  card,
  source,
  variant = "panel",
}: PriceAlertSignupProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [sent, setSent] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const canSubmit = emailValid && consent && status !== "sending";

  const scopeLabel = card ? card.name : "les cartes bancaires";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/alertes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cardId: card?.id ?? null,
          source,
          consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSent(Boolean(data?.sent));
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  // État final : message de confirmation adapté selon que l'email est parti.
  if (status === "done") {
    const done = (
      <p className="text-sm font-medium text-emerald-800">
        {sent
          ? "Presque terminé ! Cliquez sur le lien de confirmation que nous venons de vous envoyer (pensez aux spams)."
          : "C'est noté. Votre demande d'alerte est enregistrée."}
      </p>
    );
    return variant === "footer" ? (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        {done}
      </div>
    ) : (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        {done}
      </section>
    );
  }

  const consentLabel = (
    <span>
      J&apos;accepte de recevoir de CB180 une alerte par email en cas
      d&apos;évolution tarifaire, et occasionnellement des informations liées
      (facultatif hors alerte, désinscription en un clic).
    </span>
  );

  // ── Variante compacte : pied de page ──────────────────────────────────────
  if (variant === "footer") {
    return (
      <form onSubmit={submit} className="space-y-2.5">
        <div className="flex gap-2">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            aria-label="Votre adresse email"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {status === "sending" ? "…" : "M'alerter"}
          </button>
        </div>
        <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600"
          />
          {consentLabel}
        </label>
        {status === "error" && (
          <p className="text-xs text-amber-600">
            L&apos;inscription n&apos;a pas abouti. Réessayez dans un instant.
          </p>
        )}
      </form>
    );
  }

  // ── Variante panneau : fiche carte ────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
        >
          <BellIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {card
              ? `Suivre le tarif de ${card.name}`
              : "Suivre le tarif des cartes bancaires"}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Les cotisations et frais changent chaque année. Recevez un email si
            le coût de {scopeLabel} augmente — ou si une carte moins chère
            apparaît. Gratuit, sans engagement.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          aria-label="Votre adresse email"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        />
        <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600"
          />
          {consentLabel}
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {status === "sending" ? "Envoi…" : "Recevoir l'alerte tarifaire"}
        </button>
        {status === "error" && (
          <p className="text-xs text-amber-600">
            L&apos;inscription n&apos;a pas abouti. Réessayez dans un instant.
          </p>
        )}
        <p className="text-xs leading-relaxed text-slate-400">
          Double confirmation par email. Votre adresse est stockée séparément de
          toute simulation et n&apos;est jamais transmise à une banque.
        </p>
      </form>
    </section>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 2a5 5 0 00-5 5v2.6c0 .5-.2 1-.5 1.4l-1 1.2c-.6.7-.1 1.8.8 1.8h11.4c.9 0 1.4-1.1.8-1.8l-1-1.2a2.2 2.2 0 01-.5-1.4V7a5 5 0 00-5-5z" />
      <path d="M8 16a2 2 0 004 0H8z" />
    </svg>
  );
}
