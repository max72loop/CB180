import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { GUIDES } from "@/lib/guides";

// Page 404 globale (App Router). Rendue pour toute URL inexistante ainsi que
// pour les notFound() appelés depuis les pages (guides, cartes, profils...).
// Next.js ignore `export const metadata` dans not-found.tsx : le titre affiché
// est celui du template par défaut du layout, déjà en français.

export default function NotFound() {
  // Trois portes de sortie éditoriales, alignées sur l'ordre des guides.
  const guides = GUIDES.slice(0, 3);

  return (
    <>
      <SiteHeader />

      <main className="relative overflow-hidden bg-white">
        <div className="brand-glow pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div className="dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Erreur 404
          </p>

          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
            Cette page <span className="text-gradient">n&apos;existe pas</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Le lien est peut-être erroné, ou la page a été déplacée. Vous pouvez
            reprendre depuis le simulateur, ou parcourir les cartes et les
            guides.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/simulateur"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              Lancer la simulation
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Retour à l&apos;accueil
            </Link>
          </div>

          <div className="mt-14 grid gap-4 text-left sm:grid-cols-2">
            <NavCard
              href="/cartes"
              title="Toutes les cartes"
              desc="Frais annuels, frais à l'étranger et conditions, carte par carte."
            />
            <NavCard
              href="/guides"
              title="Tous les guides"
              desc="Nos comparatifs thématiques, mis à jour à partir des grilles tarifaires."
            />
          </div>

          <div className="mt-10 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Guides les plus consultés
            </h2>
            <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="flex items-center justify-between gap-4 py-3 text-slate-700 transition-colors hover:text-indigo-600"
                  >
                    <span className="font-medium">{guide.title}</span>
                    <span aria-hidden="true" className="text-slate-400">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function NavCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
    >
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
    </Link>
  );
}
