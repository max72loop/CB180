// app/banques/page.tsx
// Index des établissements. Page serveur statique, indexable.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { BANKS, cardsForBank } from "@/lib/banks";

export const metadata: Metadata = {
  title: "Banques et néobanques comparées",
  description:
    "Les cartes bancaires par établissement : BoursoBank, Fortuneo, Revolut, N26, American Express… Frais et conditions sur données officielles vérifiées.",
  alternates: { canonical: "/banques" },
};

export default function BanquesIndex() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">Établissements</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Les cartes, banque par banque
          </h1>
          <p className="mt-4 text-slate-600">
            Retrouvez les cartes de chaque établissement, avec leurs frais et
            conditions sur données officielles. Pour chiffrer le coût selon{" "}
            <em>vos</em> usages, lancez le simulateur.
          </p>
        </header>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BANKS.map((bank) => {
            const count = cardsForBank(bank).length;
            return (
              <li key={bank.slug}>
                <Link
                  href={`/banques/${bank.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {bank.name}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {bank.blurb}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      {count} carte{count > 1 ? "s" : ""}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                      Voir les cartes →
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
