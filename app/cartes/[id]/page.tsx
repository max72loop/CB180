// app/cartes/[id]/page.tsx
// Fiche produit SEO d'une carte. Générée statiquement depuis le catalogue
// vérifié (SSG). Métadonnées dynamiques + données structurées JSON-LD.
// Wording IOBSP : information factuelle, jamais « recommandé » ni « souscrivez ».

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { ProductCardVisual } from "@/components/brand/CardVisual";
import MiniSimulateur from "@/components/questionnaire/MiniSimulateur";
import PriceAlertSignup from "@/components/marketing/PriceAlertSignup";
import { getCard, publicCards } from "@/lib/cards";
import { formatEur } from "@/lib/format";
import { computeAnnualCost } from "@/lib/engine";
import { USAGE_SCENARIOS } from "@/lib/scenarios";
import {
  INSURANCE_LABEL,
  TIER_LABEL,
  cardFaq,
  comparisonSlug,
  feeLabel,
  fxLabel,
  incomeLabel,
  verifiedDate,
  welcomeLabel,
} from "@/lib/card-display";
import type { Card } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

interface Params {
  params: Promise<{ id: string }>;
}

/** Une carte est présentable publiquement si elle fait partie de publicCards(). */
function getPublicCard(id: string): Card | undefined {
  const card = getCard(id);
  if (!card || card.affiliate.network == null) return undefined;
  return card;
}

export function generateStaticParams() {
  return publicCards().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const card = getPublicCard(id);
  if (!card) return { title: "Carte introuvable" };

  const fee = card.annual_fee_eur === 0 ? "gratuite" : feeLabel(card);
  const description = `${card.name} (${card.issuer}) : avis factuel et coût réel. Cotisation ${fee}, frais de change hors zone euro ${fxLabel(card)}, conditions sur données officielles. Chiffrez le coût selon vos usages avec le simulateur CB180.`;

  return {
    title: `${card.name} : avis et coût réel`,
    description,
    alternates: { canonical: `/cartes/${card.id}` },
    openGraph: {
      title: `${card.name} : avis et coût réel | CB180`,
      description,
      type: "article",
    },
  };
}

export default async function CartePage({ params }: Params) {
  const { id } = await params;
  const card = getPublicCard(id);
  if (!card) notFound();

  const verified = verifiedDate(card);
  const hasOffer = card.source_url?.startsWith("http");

  // Suggestions de comparaison : 4 autres cartes (les moins chères d'abord).
  const comparables = publicCards()
    .filter((c) => c.id !== card.id)
    .sort((a, b) => a.annual_fee_eur - b.annual_fee_eur || a.name.localeCompare(b.name))
    .slice(0, 4);

  // Coût réel : coût annuel net estimé de CETTE carte pour 3 usages types.
  // Chiffres déterministes (SSG), donc indexables : ils captent « coût réel ».
  const scenarioCosts = USAGE_SCENARIOS.map((s) => ({
    scenario: s,
    netAnnual: computeAnnualCost(card, s.profile).netAnnualCostEur,
  }));

  // FAQ factuelle propre à la carte (longue traîne + JSON-LD FAQPage).
  const faq = cardFaq(card);

  return (
    <>
      <SiteHeader />
      <JsonLd card={card} faq={faq} />

      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            Accueil
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <Link href="/cartes" className="hover:text-slate-700">
            Cartes
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700">{card.name}</span>
        </nav>

        {/* En-tête : visuel + identité */}
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-2">
          <div className="relative">
            <div className="brand-glow pointer-events-none absolute -inset-6 -z-10 opacity-50 blur-xl" />
            <ProductCardVisual
              card={card}
              className="mx-auto max-w-sm"
              sheen
              priority
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {TIER_LABEL[card.tier]}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {card.network}
              </span>
              {verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Vérifié le {verified}
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Données indicatives
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {card.name}
            </h1>
            <p className="mt-1 text-slate-500">{card.issuer}</p>

            <p className="mt-4 text-3xl font-extrabold text-slate-900">
              {feeLabel(card)}
              {card.annual_fee_eur === 0 && (
                <span className="ml-2 align-middle text-sm font-medium text-emerald-600">
                  0 € de cotisation
                </span>
              )}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/simulateur"
                className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5"
              >
                Chiffrer selon mes usages
              </Link>
              {hasOffer && (
                <a
                  href={`/go/${card.id}?from=fiche`}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Voir l&apos;offre
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Faits clés */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Les frais et conditions, en clair
          </h2>
          <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
            <Fact label="Cotisation annuelle" value={feeLabel(card)} />
            <Fact label="Frais de change (hors zone euro)" value={fxLabel(card)} />
            <Fact label="Retraits à l'étranger" value={card.foreign_withdrawal} />
            <Fact label="Prime de bienvenue" value={welcomeLabel(card)} />
            <Fact label="Condition de revenu" value={incomeLabel(card)} />
            <Fact label="Assurances / assistance" value={INSURANCE_LABEL[card.insurances_level]} />
            {card.cashback && <Fact label="Cashback / avantages" value={card.cashback} />}
            {card.miles_program && <Fact label="Miles / points" value={card.miles_program} />}
          </dl>
        </section>

        {/* Coût réel : notre analyse chiffrée selon 3 usages types (indexable) */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {card.name} : le coût réel selon vos usages
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            La cotisation ne dit pas tout. Voici le coût annuel <em>net</em> estimé de{" "}
            {card.name} pour trois profils d&apos;usage : cotisation, frais de
            change et de retrait compris, primes et cashback déduits. Chiffres
            calculés sur données officielles, pour un même moteur que le
            simulateur.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {scenarioCosts.map(({ scenario, netAnnual }) => (
              <div
                key={scenario.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {scenario.label}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">
                  {netAnnual <= 0 ? formatEur(0) : formatEur(netAnnual)}
                  <span className="text-sm font-medium text-slate-400">/an</span>
                </p>
                {netAnnual < 0 && (
                  <p className="text-xs font-medium text-emerald-600">
                    soit un gain net de {formatEur(Math.abs(netAnnual))}/an
                  </p>
                )}
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {scenario.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Estimations sur hypothèses explicites (retrait étranger moyen 100 €,
            prime de bienvenue amortie sur 3 ans). Un coût négatif signifie que
            la carte « rapporte » sur l&apos;horizon retenu. Votre cas exact peut
            différer : ajustez-le ci-dessous.
          </p>
        </section>

        {/* Widget de simulation embarqué, scopé sur cette carte */}
        <section className="mt-8">
          <MiniSimulateur card={card} />
        </section>

        {/* Alerte tarifaire : capture email récurrente, ciblée sur cette carte */}
        <section className="mt-8">
          <PriceAlertSignup
            card={{ id: card.id, name: card.name }}
            source="fiche"
          />
        </section>

        {/* Note de vérification (traçabilité) */}
        {card.verif_note && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Note de vérification
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {card.verif_note}
            </p>
            {hasOffer && (
              <a
                href={card.source_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-3 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Source officielle →
              </a>
            )}
          </section>
        )}

        {/* Transparence affiliée */}
        {card.affiliate.est_commission_eur > 0 && (
          <p className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            Transparence : si vous ouvrez cette carte via notre lien, une
            commission estimée de{" "}
            <span className="font-medium text-slate-700">
              {formatEur(card.affiliate.est_commission_eur)}
            </span>{" "}
            peut être versée à CB180. Elle n&apos;influence pas le classement,
            établi objectivement selon le coût annuel.
          </p>
        )}

        {/* CTA simulateur */}
        <section className="mt-12 overflow-hidden rounded-2xl bg-brand relative">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Cette carte vaut-elle le coup pour <em>vous</em> ?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-indigo-100">
              En 3 questions, CB180 estime le coût annuel de cette carte selon
              vos usages et le compare à votre situation actuelle. Cinq questions
              de plus affinent le chiffre.
            </p>
            <Link
              href="/simulateur"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Lancer la simulation, gratuit
            </Link>
          </div>
        </section>

        {/* Comparaisons : liens internes vers les pages /comparatif */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Comparer {card.name} avec…
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {comparables.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/comparatif/${comparisonSlug(card.id, other.id)}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-indigo-200 hover:bg-slate-50"
                >
                  <span>
                    {card.name} <span className="text-slate-400">vs</span>{" "}
                    {other.name}
                  </span>
                  <span className="text-indigo-600">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ factuelle propre à la carte (longue traîne) */}
        {faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {card.name} : questions fréquentes
            </h2>
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {faq.map((item) => (
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

        <p className="mt-8 text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison, non
          intermédiaire en opérations de banque. Cette fiche ne constitue ni un
          conseil personnalisé ni une recommandation de souscription. Vérifiez
          toujours les conditions générales à jour de l&apos;établissement avant
          toute décision.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug text-slate-800">
        {value}
      </dd>
    </div>
  );
}

/** Données structurées : produit financier + fil d'Ariane + FAQ. */
function JsonLd({ card, faq }: { card: Card; faq: { q: string; a: string }[] }) {
  const SITE = SITE_URL;
  const financialProduct = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: card.name,
    category: "Carte bancaire",
    url: `${SITE}/cartes/${card.id}`,
    provider: { "@type": "Organization", name: card.issuer },
    feesAndCommissionsSpecification: `Cotisation ${feeLabel(card)}. Frais de change hors zone euro ${fxLabel(card)}.`,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: card.annual_fee_eur,
      ...(card.source_url?.startsWith("http") ? { url: card.source_url } : {}),
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
      { "@type": "ListItem", position: 2, name: "Cartes", item: `${SITE}/cartes` },
      {
        "@type": "ListItem",
        position: 3,
        name: card.name,
        item: `${SITE}/cartes/${card.id}`,
      },
    ],
  };
  const faqPage =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialProduct) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
    </>
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
