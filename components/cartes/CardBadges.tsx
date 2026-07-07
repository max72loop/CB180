"use client";

// components/cartes/CardBadges.tsx
// Rendu des badges « Best for » d'une carte : chips colorés superposés au bord
// supérieur gauche, chacun avec un tooltip expliquant le POURQUOI (fait vérifié).
// Le tooltip s'ouvre au survol (délai 300 ms), au focus clavier, ou au tap mobile.
// Chaque chip est un bouton focusable porteur d'un aria-label complet.

import { useEffect, useRef, useState } from "react";
import type { Badge } from "@/lib/card-badges";

/** Délai avant apparition du tooltip au survol (spec). */
const HOVER_DELAY_MS = 300;

export default function CardBadges({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="pointer-events-none absolute -top-2 left-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
      {badges.map((badge) => (
        <BadgeChip key={badge.id} badge={badge} />
      ))}
    </div>
  );
}

function BadgeChip({ badge }: { badge: Badge }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function scheduleOpen() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  }
  function close() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }

  return (
    <span className="pointer-events-auto relative">
      <button
        type="button"
        aria-label={`${badge.label} : ${badge.reason}`}
        aria-expanded={open}
        onMouseEnter={scheduleOpen}
        onMouseLeave={close}
        onFocus={() => setOpen(true)}
        onBlur={close}
        // Tap mobile : focus + click s'enchaînent ; on force « ouvrir » (la
        // fermeture se fait en tapant ailleurs → blur), pas un toggle qui
        // refermerait aussitôt.
        onClick={() => setOpen(true)}
        style={{ backgroundColor: badge.bg, color: badge.fg }}
        className="inline-flex max-w-[8.5rem] items-center gap-1 truncate rounded px-2 py-1 text-[10px] font-semibold shadow-sm ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 sm:text-[11px]"
      >
        <span aria-hidden>{badge.emoji}</span>
        <span className="truncate">{badge.short}</span>
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 block w-max max-w-[250px] rounded-lg bg-slate-900 px-3 py-2 text-left text-xs leading-snug text-white shadow-lg"
        >
          <span className="mb-0.5 block font-semibold">{badge.label}</span>
          <span className="block text-slate-200">{badge.reason}</span>
        </span>
      )}
    </span>
  );
}
