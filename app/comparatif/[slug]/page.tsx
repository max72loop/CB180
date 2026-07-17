// app/comparatif/[slug]/page.tsx
// Page de comparaison SEO « Carte A vs Carte B ». Générée statiquement pour
// chaque paire canonique du catalogue vérifié (longue traîne). Wording IOBSP :
// on compare des faits chiffrés, jamais « la meilleure » ni « recommandé ».

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { ProductCardVisual } from "@/components/brand/CardVisual";
import { getCard, publicCards } from "@/lib/cards";
import {
  comparisonPairs,
  comparisonSlug,
  parseComparisonSlug,
} from "@/lib/card-display";
import {
  COMPARE_ROWS,
  FEATURE_COMPARE_ROWS,
  bestIndices,
  rowHasData,
  type CompareRow,
} from "@/lib/card-compare";
import type { Card } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

interface Params {
  params: Promise<{ slug: string }>;
}

/** Récupère les deux cartes publiques d'un slug, ou null. */
function resolvePair(slug: string): { a: Card; b: Card } | null {
  const parsed = parseComparisonSlug(slug);
  if (!parsed) return null;
  const [a, b] = [getCard(parsed[0]), getCard(parsed[1])];
  if (!a || !b || a.affiliate.network == null || b.affiliate.network == null) {
    return null;
  }
  return { a, b };
}

// Prérendu limité aux paires maillées depuis les fiches (cf. comparisonPairs).
// Les autres paires restent servies à la demande via dynamicParams (défaut true).
export function generateStaticParams() {
  return comparisonPairs(publicCards()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const pair = resolvePair(slug);
  if (!pair) return { title: "Comparatif introuvable" };
  const { a, b } = pair;
  const description = `${a.name} ou ${b.name} : cotisation, frais de change et retraits à l'étranger comparés sur données officielles. Chiffrez la différence selon vos usages avec CB180.`;
  return {
    title: `${a.name} vs ${b.name} : coûts et frais comparés`,
    description,
    alternates: { canonical: `/comparatif/${comparisonSlug(a.id, b.id)}` },
    openGraph: { title: `${a.name} vs ${b.name} | CB180`, description, type: "article" },
  };
}

export default async function ComparatifPage({ params }: Params) {
  const { slug } = await params;
  const pair = resolvePair(slug);
  if (!pair) notFound();
  const { a, b } = pair;

  // Redirige les slugs non canoniques (ordre inversé) vers l'URL unique.
  const canonical = comparisonSlug(a.id, b.id);
  if (slug !== canonical) redirect(`/comparatif/${canonical}`);

  // Lignes du tableau (définies dans lib/card-compare, partagées avec le modal
  // de /cartes) : on n'affiche une ligne QUE si au moins une des deux cartes
  // renseigne la valeur — sinon deux « — » n'apprennent rien.
  const cards = [a, b];
  const costRows = COMPARE_ROWS.filter((r) => rowHasData(r, cards));
  const featureRows = FEATURE_COMPARE_ROWS.filter((r) => rowHasData(r, cards));

  return (
    <>
      <SiteHeader />
      <JsonLd a={a} b={b} />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Fil d'Ariane" className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Accueil
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <Link href="/cartes" className="hover:text-slate-700">
            Cartes
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700">
            {a.name} vs {b.name}
          </span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {a.name} <span className="text-gradient">vs</span> {b.name}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Les deux cartes comparées poste par poste, sur données officielles. Une
          information factuelle : la carte la moins chère dépend de{" "}
          <em>vos</em> usages, chiffrez-la avec le simulateur.
        </p>

        {/* Deux visuels côte à côte */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-8">
          {[a, b].map((c) => (
            <div key={c.id} className="text-center">
              <ProductCardVisual card={c} className="mx-auto max-w-[220px]" />
              <Link
                href={`/cartes/${c.id}`}
                className="mt-3 inline-block text-sm font-semibold text-slate-900 hover:text-indigo-700"
              >
                {c.name}
              </Link>
              <p className="text-xs text-slate-500">{c.issuer}</p>
            </div>
          ))}
        </div>

        {/* Tableau de comparaison */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Comparaison des frais de {a.name} et {b.name}
            </caption>
            <tbody className="divide-y divide-slate-100">
              {costRows.map((row) => (
                <Row key={row.id} row={row} cards={cards} />
              ))}
              {featureRows.length > 0 && (
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={3}
                    className="bg-slate-100 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Fonctionnalités &amp; services
                  </th>
                </tr>
              )}
              {featureRows.map((row) => (
                <Row key={row.id} row={row} cards={cards} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Chaque repère ne porte que sur le poste de sa ligne, pas sur le coût
          global, qui dépend de vos usages.
        </p>

        {/* CTA simulateur */}
        <section className="mt-10 overflow-hidden rounded-2xl bg-brand relative">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Laquelle vous coûte le moins cher ?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-indigo-100">
              CB180 calcule le coût annuel des deux cartes selon vos usages, et le
              compare à votre situation actuelle.
            </p>
            <Link
              href="/simulateur"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Lancer la simulation, gratuit
            </Link>
          </div>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison, non
          intermédiaire en opérations de banque. Ce comparatif ne constitue ni un
          conseil personnalisé ni une recommandation de souscription. Vérifiez les
          conditions générales à jour des établissements avant toute décision.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

/** Une ligne du tableau : libellé + une cellule par carte comparée. */
function Row({ row, cards }: { row: CompareRow; cards: Card[] }) {
  const best = bestIndices(row, cards);
  return (
    <tr>
      <th
        scope="row"
        className="w-1/3 bg-slate-50 px-4 py-3 text-left align-top text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        {row.label}
      </th>
      {cards.map((c, i) => (
        <Cell
          key={c.id}
          value={row.value(c)}
          bestLabel={best.has(i) ? row.bestLabel : undefined}
        />
      ))}
    </tr>
  );
}

function Cell({ value, bestLabel }: { value: string | null; bestLabel?: string }) {
  return (
    <td className="px-4 py-3 align-top text-slate-800">
      {value == null ? (
        <span className="text-slate-500">—</span>
      ) : (
        <span className="font-medium">{value}</span>
      )}
      {bestLabel && (
        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          {bestLabel}
        </span>
      )}
    </td>
  );
}

/** Données structurées : fil d'Ariane de la comparaison. */
function JsonLd({ a, b }: { a: Card; b: Card }) {
  const SITE = SITE_URL;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
      { "@type": "ListItem", position: 2, name: "Cartes", item: `${SITE}/cartes` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${a.name} vs ${b.name}`,
        item: `${SITE}/comparatif/${comparisonSlug(a.id, b.id)}`,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
    />
  );
}
