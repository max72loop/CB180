// components/marketing/SiteHeader.tsx
// En-tête des pages marketing/institutionnelles. Sticky, léger, mobile-first.

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Accueil CB180">
          <Logo size={28} />
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/cartes"
            className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
          >
            Cartes
          </Link>
          <Link
            href="/comment-ca-marche"
            className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
          >
            Comment ça marche
          </Link>
          <Link
            href="/simulateur"
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Simuler
          </Link>
        </nav>
      </div>
    </header>
  );
}
