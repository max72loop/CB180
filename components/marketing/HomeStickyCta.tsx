"use client";

// components/marketing/HomeStickyCta.tsx
// CTA flottant collant en bas d'écran sur la landing. Le CTA principal
// « Lancer la simulation » n'existe que dans le hero ; dès qu'on scrolle,
// il devient inaccessible. Ce composant réaffiche un CTA équivalent quand le
// hero a quitté le viewport, et se masque quand on y revient.
//
// Autonome et indépendant du hero (spec : ne pas toucher au hero) : il rend
// une SENTINELLE invisible à la position du bas du hero (le composant est monté
// juste après <Hero />) et observe sa sortie du viewport via IntersectionObserver.
// La barre elle-même est en position: fixed, donc sa place dans le DOM n'importe pas.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HomeStickyCta() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Visible uniquement quand la sentinelle (fin du hero) est passée
        // AU-DESSUS du viewport, càd que le hero est entièrement sorti par le haut.
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinelle en flux normal, à la position du bas du hero. */}
      <div ref={sentinelRef} aria-hidden className="h-0 w-full" />

      {/* Barre collante. Mobile : pleine largeur, coins carrés. Desktop : pill
          flottant centré (480px, coins arrondis, marge basse). Slide-up/down 200 ms. */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-40 flex justify-center",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          visible ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <Link
          href="/simulateur"
          role="button"
          aria-label="Lancer la simulation gratuite"
          aria-hidden={!visible}
          tabIndex={visible ? undefined : -1}
          className={[
            "flex min-h-[48px] w-full items-center justify-center gap-2",
            "bg-indigo-600 px-4 py-3 text-white shadow-[0_-2px_12px_rgba(0,0,0,0.15)]",
            "text-base font-semibold transition-colors hover:bg-indigo-700",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700",
            "md:mb-4 md:w-auto md:max-w-[480px] md:rounded-xl",
          ].join(" ")}
        >
          Lancer la simulation gratuite&nbsp;— 30&nbsp;s
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="h-5 w-5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M7.3 4.3a1 1 0 011.4 0l5 5a1 1 0 010 1.4l-5 5a1 1 0 01-1.4-1.4L11.6 10 7.3 5.7a1 1 0 010-1.4z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </>
  );
}
