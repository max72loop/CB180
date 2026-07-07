"use client";

// components/results/ShareResult.tsx
// Boucle virale (audit, chantier 05) : le chiffre d'économie EST le contenu de
// partage. Un chiffre choc personnalisé est nativement viralisable — ici on le
// transforme en canal d'acquisition.
//
// Deux gestes complémentaires :
//   • Partager le LIEN vers /partage/[slug] (Web Share API mobile, copie en
//     repli desktop) : le lien affiche l'image Open Graph « J'économise X €/an »
//     + le radar de coût dès qu'il est collé quelque part.
//   • Voir / TÉLÉCHARGER l'image : on réutilise le PNG déjà rendu par la route
//     opengraph-image (WYSIWYG, aucun re-dessin côté client), pour que
//     l'utilisateur puisse le poster en story / message. Le visuel embarque le
//     lien de retour vers CB180.
// Les events « partage » et « telechargement » sont loggués (fire-and-forget).

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
  const [showImage, setShowImage] = useState(false);

  // Partage réservé à une économie réelle et positive (sinon rien à claironner).
  const amount = Math.round(gainEur);
  if (amount <= 0) return null;

  const slug = buildShareSlug(amount, composition);
  // Lien de partage : ABSOLU (destiné à être collé ailleurs).
  const url = `${SITE_URL}/partage/${slug}`;
  // Image : chemin RELATIF (même origine) pour l'aperçu et le téléchargement,
  // afin que ça marche identiquement en local, en preview et en production.
  const imagePath = `/partage/${slug}/opengraph-image`;
  const text = `J'économise ${amount} €/an sur ma carte bancaire, calculé par CB180. Et vous, combien ?`;

  function logEvent(eventType: "partage" | "telechargement") {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId ?? null,
        eventType,
        meta: { gainEur: amount },
      }),
      keepalive: true,
    }).catch(() => {});
  }

  async function share() {
    logEvent("partage");
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

  async function download() {
    logEvent("telechargement");
    // Téléchargement robuste : on récupère le PNG en blob puis on force
    // l'enregistrement avec un nom de fichier lisible. Repli : ouverture dans un
    // onglet, l'utilisateur enregistre manuellement.
    try {
      const res = await fetch(imagePath);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `cb180-jeconomise-${amount}-euros.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(imagePath, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="space-y-3">
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

      {/* Aperçu + téléchargement de l'image, à la demande (n'alourdit pas
          l'écran par défaut : le PNG n'est généré que si l'utilisateur ouvre). */}
      <div>
        <button
          type="button"
          onClick={() => setShowImage((v) => !v)}
          aria-expanded={showImage}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <ImageIcon className="h-4 w-4" />
          {showImage ? "Masquer l'image" : "Voir / télécharger mon image"}
        </button>

        {showImage && (
          <div className="mt-3 space-y-2">
            <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePath}
                alt={`Mon image de partage CB180 : j'économise ${amount} € par an`}
                className="block aspect-[1200/630] w-full object-contain"
                loading="lazy"
              />
            </div>
            <button
              type="button"
              onClick={download}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              <DownloadIcon className="h-4 w-4" />
              Télécharger l&apos;image (PNG)
            </button>
            <p className="text-xs leading-relaxed text-slate-500">
              À poster en story ou en message. Le lien de retour vers CB180 est
              intégré au visuel.
            </p>
          </div>
        )}
      </div>
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

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm0 2h14v5.6l-2.8-2.8a1 1 0 00-1.4 0L8 15.6 6.7 14.3a1 1 0 00-1.4 0L3 16.6V6zm3.5 1a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 3a1 1 0 011 1v6.6l2.3-2.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L9 10.6V4a1 1 0 011-1z" />
      <path d="M4 15a1 1 0 011 1v1h10v-1a1 1 0 112 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a1 1 0 011-1z" />
    </svg>
  );
}
