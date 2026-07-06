"use client";

// components/results/ShareResult.tsx
// Boucle virale (audit, chantier 05) : le chiffre d'économie EST le contenu de
// partage. Un chiffre choc personnalisé est nativement viralisable — ici on le
// transforme en canal d'acquisition.
//
// Le bouton partage un lien vers /partage/[montant], une page dont l'image
// Open Graph affiche « J'économise X €/an ». Web Share API sur mobile, copie
// du lien en repli (desktop). L'event « partage » est loggué (fire-and-forget).

import { useState } from "react";
import { SITE_URL } from "@/lib/site";
import { buildShareSlug, type ShareCompo } from "@/lib/share";

interface ShareResultProps {
  /** Économie annuelle estimée, en euros (vs la carte la moins chère). */
  gainEur: number;
  /**
   * Décomposition du coût actuel (cotisation / change / retrait). Transmise dans
   * le lien de partage pour que l'image Open Graph dessine le radar de coût.
   * Optionnelle : sans elle, le partage retombe sur le visuel « montant seul ».
   */
  composition?: ShareCompo | null;
  sessionId?: string | null;
}

export default function ShareResult({
  gainEur,
  composition,
  sessionId,
}: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  // Partage réservé à une économie réelle et positive (sinon rien à claironner).
  const amount = Math.round(gainEur);
  if (amount <= 0) return null;

  const url = `${SITE_URL}/partage/${buildShareSlug(amount, composition)}`;
  const text = `J'économise ${amount} €/an sur ma carte bancaire, calculé par CB180. Et vous, combien ?`;

  function logShare() {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId ?? null,
        eventType: "partage",
        meta: { gainEur: amount },
      }),
      keepalive: true,
    }).catch(() => {});
  }

  async function share() {
    logShare();
    // Web Share API (mobile / navigateurs compatibles).
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "CB180", text, url });
        return;
      } catch {
        // Annulation utilisateur ou API indisponible : on tente la copie.
      }
    }
    // Repli : copie du lien dans le presse-papier.
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Dernier repli : ouverture de la page de partage dans un nouvel onglet.
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Ce chiffre vous parle&nbsp;? Montrez-le autour de vous.
      </p>
      <button
        type="button"
        onClick={share}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        <ShareIcon className="h-4 w-4" />
        {copied ? "Lien copié !" : `Partager « j'économise ${amount} € »`}
      </button>
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M13 7a3 3 0 10-2.83-4H10a3 3 0 00.17 1L7.83 5.34a3 3 0 100 3.32l2.34 1.34A3 3 0 1013 13a3 3 0 00-2.83-2H10a3 3 0 00-.17-1l2.34-1.34A3 3 0 0013 9a3 3 0 000-2z" />
    </svg>
  );
}
