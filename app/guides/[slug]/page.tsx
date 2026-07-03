// app/guides/[slug]/page.tsx
// Guide éditorial SEO, généré statiquement. Data-driven : liste les cartes du
// catalogue qui remplissent le critère du guide, classées objectivement.
// Wording IOBSP : on filtre et on trie des faits, jamais « recommandé pour vous ».

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { MiniCard } from "@/components/brand/CardVisual";
import { publicCards } from "@/lib/cards";
import { GUIDES, getGuide, type Guide } from "@/lib/guides";
import {
  feeLabel,
  fxLabel,
  toneForTier,
  verifiedDate,
} from "@/lib/card-display";
import type { Card } from "@/lib/types";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide introuvable" };
  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: `${guide.title} | CB180`,
      description: guide.metaDescription,
      type: "article",
    },
  };
}

function matchingCards(guide: Guide): Card[] {
  const sorted = publicCards().filter(guide.match);
  sorted.sort(guide.sort ?? ((a, b) => a.name.localeCompare(b.name)));
  return sorted;
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const cards = matchingCards(guide);

  return (
    <>
      <SiteHeader />
      <JsonLd guide={guide} />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Fil d'Ariane" className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Accueil
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <Link href="/guides" className="hover:text-slate-700">
            Guides
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700">{guide.title}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          {guide.intro}
        </p>

        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Critère retenu : </span>
          {guide.criterion}
        </p>

        {/* Liste data-driven des cartes qui remplissent le critère */}
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Les cartes concernées ({cards.length})
          </h2>

          {cards.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Aucune carte du catalogue ne remplit ce critère actuellement.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {cards.map((card, i) => {
                const verified = verifiedDate(card);
                return (
                  <li
                    key={card.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <MiniCard tone={toneForTier(card.tier)} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/cartes/${card.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-700"
                      >
                        {card.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {card.issuer}
                        {verified && ` · vérifié le ${verified}`}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-semibold text-slate-900">
                        {feeLabel(card)}
                      </p>
                      <p className="text-xs text-slate-500">
                        change {fxLabel(card)}
                      </p>
                    </div>
                    <Link
                      href={`/cartes/${card.id}`}
                      className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Fiche →
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Classement objectif selon le critère ci-dessus. Le coût réel dépend de
            vos usages — le simulateur le chiffre précisément.
          </p>
        </section>

        {/* CTA simulateur */}
        <section className="mt-10 overflow-hidden rounded-2xl bg-brand relative">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Laquelle vous coûte le moins cher ?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-indigo-100">
              En 8 questions, CB180 chiffre le coût annuel de ces cartes selon vos
              usages et le compare à votre situation actuelle.
            </p>
            <Link
              href="/simulateur"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Lancer la simulation — gratuit
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {guide.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Questions fréquentes
            </h2>
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {guide.faq.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-semibold text-slate-900 marker:content-['']">
                    {item.q}
                    <span className="shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                      ⌄
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison, non
          intermédiaire en opérations de banque. Ce guide ne constitue ni un
          conseil personnalisé ni une recommandation de souscription. Vérifiez
          toujours les conditions générales à jour de l&apos;établissement.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

/** Données structurées : FAQPage + fil d'Ariane. */
function JsonLd({ guide }: { guide: Guide }) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cb180.fr";
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${SITE}/guides/${guide.slug}`,
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
