// app/guides/page.tsx
// Index des guides éditoriaux SEO. Page serveur statique, indexable.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { GUIDES } from "@/lib/guides";
import { publicCards } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Guides cartes bancaires",
  description:
    "Nos guides pour choisir une carte bancaire selon un besoin précis : sans frais à l'étranger, gratuite, pour voyager… Sur données officielles, sans conseil personnalisé.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  const cards = publicCards();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">Guides</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choisir une carte selon votre besoin
          </h1>
          <p className="mt-4 text-slate-600">
            Chaque guide part d&apos;un critère objectif et liste les cartes du
            catalogue qui le remplissent, sur données officielles vérifiées. Une
            information factuelle : le coût réel dépend de vos usages, chiffrez-le
            avec le simulateur.
          </p>
        </header>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {GUIDES.map((guide) => {
            const count = cards.filter(guide.match).length;
            return (
              <li key={guide.slug}>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {guide.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {guide.intro}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      {count} carte{count > 1 ? "s" : ""} concernée
                      {count > 1 ? "s" : ""}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                      Lire le guide →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
