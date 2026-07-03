// app/comparatif/[slug]/page.tsx
// Page de comparaison SEO « Carte A vs Carte B ». Générée statiquement pour
// chaque paire canonique du catalogue vérifié (longue traîne). Wording IOBSP :
// on compare des faits chiffrés, jamais « la meilleure » ni « recommandé ».

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import CardVisual from "@/components/brand/CardVisual";
import { getCard, publicCards } from "@/lib/cards";
import {
  INSURANCE_LABEL,
  comparisonSlug,
  feeLabel,
  fxLabel,
  incomeLabel,
  parseComparisonSlug,
  toneForTier,
  welcomeLabel,
} from "@/lib/card-display";
import type { Card } from "@/lib/types";

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

export function generateStaticParams() {
  const cards = publicCards();
  const params: { slug: string }[] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      params.push({ slug: comparisonSlug(cards[i].id, cards[j].id) });
    }
  }
  return params;
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
          <em>vos</em> usages — chiffrez-la avec le simulateur.
        </p>

        {/* Deux visuels côte à côte */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-8">
          {[a, b].map((c) => (
            <div key={c.id} className="text-center">
              <CardVisual
                tone={toneForTier(c.tier)}
                label={c.network}
                className="mx-auto max-w-[220px]"
              />
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
              <Row
                label="Cotisation annuelle"
                a={feeLabel(a)}
                b={feeLabel(b)}
                cheaper={cheaperFee(a, b)}
              />
              <Row
                label="Frais de change (hors zone euro)"
                a={fxLabel(a)}
                b={fxLabel(b)}
                cheaper={cheaperFx(a, b)}
              />
              <Row
                label="Retraits à l'étranger"
                a={a.foreign_withdrawal}
                b={b.foreign_withdrawal}
              />
              <Row label="Prime de bienvenue" a={welcomeLabel(a)} b={welcomeLabel(b)} />
              <Row label="Condition de revenu" a={incomeLabel(a)} b={incomeLabel(b)} />
              <Row
                label="Assurances / assistance"
                a={INSURANCE_LABEL[a.insurances_level]}
                b={INSURANCE_LABEL[b.insurances_level]}
              />
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Le repère « moins cher » ne porte que sur le poste concerné, pas sur le
          coût global — qui dépend de vos usages.
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
              Lancer la simulation — gratuit
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

/** Renvoie "a" / "b" / null selon la cotisation la plus basse (0 = à égalité). */
function cheaperFee(a: Card, b: Card): "a" | "b" | null {
  if (a.annual_fee_eur === b.annual_fee_eur) return null;
  return a.annual_fee_eur < b.annual_fee_eur ? "a" : "b";
}
function cheaperFx(a: Card, b: Card): "a" | "b" | null {
  if (a.fx_fee_percent === b.fx_fee_percent) return null;
  return a.fx_fee_percent < b.fx_fee_percent ? "a" : "b";
}

function Row({
  label,
  a,
  b,
  cheaper,
}: {
  label: string;
  a: string;
  b: string;
  cheaper?: "a" | "b" | null;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="w-1/3 bg-slate-50 px-4 py-3 text-left align-top text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        {label}
      </th>
      <Cell value={a} best={cheaper === "a"} />
      <Cell value={b} best={cheaper === "b"} />
    </tr>
  );
}

function Cell({ value, best }: { value: string; best?: boolean }) {
  return (
    <td className="px-4 py-3 align-top text-slate-800">
      <span className="font-medium">{value}</span>
      {best && (
        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          moins cher
        </span>
      )}
    </td>
  );
}

/** Données structurées : fil d'Ariane de la comparaison. */
function JsonLd({ a, b }: { a: Card; b: Card }) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cb180.fr";
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
