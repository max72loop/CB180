// app/cartes/page.tsx
// Index SEO des cartes : une grille de fiches vers /cartes/[id]. Généré depuis
// le catalogue vérifié. Page serveur (statique), indexable.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { ProductCardVisual } from "@/components/brand/CardVisual";
import { publicCards } from "@/lib/cards";
import {
  feeLabel,
  fxLabel,
  verifiedDate,
} from "@/lib/card-display";

export const metadata: Metadata = {
  title: "Cartes bancaires comparées",
  description:
    "Les cartes bancaires françaises passées au crible : cotisation, frais de change, retraits à l'étranger et conditions, sur données officielles vérifiées. Information objective, sans conseil.",
  alternates: { canonical: "/cartes" },
};

export default function CartesIndex() {
  // Tri par cotisation croissante puis nom (déterministe, objectif).
  const cards = [...publicCards()].sort(
    (a, b) => a.annual_fee_eur - b.annual_fee_eur || a.name.localeCompare(b.name),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">
            Le catalogue
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Les cartes bancaires, passées au crible
          </h1>
          <p className="mt-4 text-slate-600">
            Cotisation, frais de change, retraits à l&apos;étranger et conditions
            : sur documents tarifaires officiels. Une information factuelle, pas
            un conseil. Pour chiffrer le coût selon <em>vos</em> usages, lancez le
            simulateur.
          </p>
          <Link
            href="/simulateur"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5"
          >
            Lancer la simulation, gratuit
          </Link>
        </header>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const verified = verifiedDate(card);
            return (
              <li key={card.id}>
                <Link
                  href={`/cartes/${card.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5"
                >
                  <div className="p-4">
                    <ProductCardVisual card={card} className="w-full" />
                  </div>
                  <div className="flex flex-1 flex-col px-4 pb-4">
                    <h2 className="font-semibold text-slate-900">{card.name}</h2>
                    <p className="text-sm text-slate-500">{card.issuer}</p>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <Fact label="Cotisation" value={feeLabel(card)} />
                      <Fact label="Change hors €" value={fxLabel(card)} />
                    </dl>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      {verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckIcon className="h-3.5 w-3.5" />
                          Vérifié le {verified}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Données indicatives
                        </span>
                      )}
                      <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Voir la fiche →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison. Ces fiches ne
          constituent ni un conseil personnalisé ni une recommandation de
          souscription. Certains liens sont affiliés et n&apos;influencent pas le
          classement. Les informations proviennent des documents tarifaires
          publics des établissements.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
