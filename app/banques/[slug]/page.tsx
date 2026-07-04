// app/banques/[slug]/page.tsx
// Page établissement SEO (SSG) : liste les cartes d'une banque, data-driven.
// Capte les requêtes de marque (« carte Fortuneo »…). Wording IOBSP tenu.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { MiniCard } from "@/components/brand/CardVisual";
import { BANKS, cardsForBank, getBank } from "@/lib/banks";
import { feeLabel, fxLabel, toneForTier, verifiedDate } from "@/lib/card-display";
import { SITE_URL } from "@/lib/site";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BANKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const bank = getBank(slug);
  if (!bank) return { title: "Établissement introuvable" };
  const description = `Les cartes bancaires ${bank.name} : cotisation, frais de change, retraits à l'étranger et conditions, sur données officielles vérifiées. Comparez avec CB180.`;
  return {
    title: `Cartes ${bank.name} : frais et comparatif`,
    description,
    alternates: { canonical: `/banques/${bank.slug}` },
    openGraph: {
      title: `Cartes ${bank.name} : frais et conditions | CB180`,
      description,
      type: "article",
    },
  };
}

export default async function BanquePage({ params }: Params) {
  const { slug } = await params;
  const bank = getBank(slug);
  if (!bank) notFound();

  const cards = cardsForBank(bank);
  const SITE = SITE_URL;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
      { "@type": "ListItem", position: 2, name: "Banques", item: `${SITE}/banques` },
      {
        "@type": "ListItem",
        position: 3,
        name: bank.name,
        item: `${SITE}/banques/${bank.slug}`,
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <nav aria-label="Fil d'Ariane" className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Accueil
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <Link href="/banques" className="hover:text-slate-700">
            Banques
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700">{bank.name}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Cartes {bank.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          {bank.blurb}
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Les cartes {bank.name} ({cards.length})
          </h2>

          {cards.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Aucune carte de cet établissement dans le catalogue actuellement.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {cards.map((card) => {
                const verified = verifiedDate(card);
                return (
                  <li
                    key={card.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <MiniCard tone={toneForTier(card.tier)} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/cartes/${card.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-700"
                      >
                        {card.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {verified ? `Vérifié le ${verified}` : "Données indicatives"}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-semibold text-slate-900">
                        {feeLabel(card)}
                      </p>
                      <p className="text-xs text-slate-500">change {fxLabel(card)}</p>
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
            </ul>
          )}
        </section>

        {/* CTA simulateur */}
        <section className="mt-10 overflow-hidden rounded-2xl bg-brand relative">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Quelle carte {bank.name} vous coûte le moins cher ?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-indigo-100">
              Le simulateur chiffre le coût annuel de ces cartes selon vos usages
              et le compare à votre situation actuelle.
            </p>
            <Link
              href="/simulateur"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Lancer la simulation, gratuit
            </Link>
          </div>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison, non
          intermédiaire en opérations de banque. Cette page ne constitue ni un
          conseil personnalisé ni une recommandation de souscription. Les marques
          citées appartiennent à leurs titulaires respectifs.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
