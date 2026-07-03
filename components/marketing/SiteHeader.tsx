// components/marketing/SiteHeader.tsx
// En-tête des pages marketing/institutionnelles. Sticky, léger, mobile-first.

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            CB
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            CB180
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/comment-ca-marche"
            className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
          >
            Comment ça marche
          </Link>
          <Link
            href="/simulateur"
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Simuler
          </Link>
        </nav>
      </div>
    </header>
  );
}
