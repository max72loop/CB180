// app/cartes/[id]/page.tsx
// Fiche produit SEO d'une carte. Générée statiquement depuis le catalogue
// vérifié (SSG). Métadonnées dynamiques + données structurées JSON-LD.
// Wording IOBSP : information factuelle, jamais « recommandé » ni « souscrivez ».

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { ProductCardVisual, MiniCard } from "@/components/brand/CardVisual";
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
  cardHighlights,
  comparisonSlug,
  feeLabel,
  fxLabel,
  incomeLabel,
  toneForTier,
  verifiedDate,
  welcomeLabel,
} from "@/lib/card-display";
import {
  FEATURE_GROUPS,
  debitLabel,
  groupRows,
  hasFeatures,
  materialLabel,
} from "@/lib/card-features";
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
  const isFree = card.annual_fee_eur === 0;

  // Atouts factuels différenciants, dérivés des champs vérifiés (pills du hero).
  const highlights = cardHighlights(card, 4);

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
  // Échelle commune des barres + amplitude, pour l'insight factuel dérivé.
  const maxAbsCost = Math.max(...scenarioCosts.map((s) => Math.abs(s.netAnnual)), 1);
  const nets = scenarioCosts.map((s) => s.netAnnual);
  const costSpread = Math.max(...nets) - Math.min(...nets);

  // Faits clés structurés (icône + libellé + valeur), certains marqués « forts »
  // quand le champ est particulièrement favorable (ex. 0 % de change).
  const facts: {
    icon: (p: { className?: string }) => React.ReactElement;
    label: string;
    value: string;
    strong?: boolean;
  }[] = [
    { icon: WalletIcon, label: "Cotisation annuelle", value: feeLabel(card), strong: isFree },
    { icon: GlobeIcon, label: "Frais de change hors zone euro", value: fxLabel(card), strong: card.fx_fee_percent === 0 },
    { icon: CashIcon, label: "Retraits à l'étranger", value: card.foreign_withdrawal },
    { icon: GiftIcon, label: "Prime de bienvenue", value: welcomeLabel(card), strong: card.welcome_bonus_eur > 0 },
    { icon: IdIcon, label: "Condition de revenu", value: incomeLabel(card), strong: card.min_monthly_income_eur == null },
    { icon: ShieldIcon, label: "Assurances / assistance", value: INSURANCE_LABEL[card.insurances_level], strong: card.insurances_level === "premier_gold" || card.insurances_level === "elite" },
  ];
  if (card.cashback) facts.push({ icon: TagIcon, label: "Cashback / avantages", value: card.cashback });
  if (card.miles_program) facts.push({ icon: PlaneIcon, label: "Miles / points", value: card.miles_program });

  // FAQ factuelle propre à la carte (longue traîne + JSON-LD FAQPage).
  const faq = cardFaq(card);

  return (
    <>
      <SiteHeader />
      <JsonLd card={card} faq={faq} />

      <main className="relative">
        {/* Voile lumineux ambiant, confiné à la bande du hero (pas de scroll X). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden"
        >
          <div className="brand-glow absolute -inset-x-24 -top-40 h-[560px] opacity-70 blur-2xl" />
          <div className="dot-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-6">
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

          {/* ─── Hero : visuel flottant + identité, prix, actions ─── */}
          <div className="mt-6 grid items-center gap-10 lg:mt-8 lg:grid-cols-2 lg:gap-14">
            {/* Visuel carte */}
            <div className="relative order-1">
              <div className="brand-glow pointer-events-none absolute -inset-10 -z-10 opacity-60 blur-2xl" />
              <div className="floaty-slow mx-auto max-w-sm">
                <ProductCardVisual card={card} sheen priority />
              </div>
              {verified && (
                <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                  Conditions vérifiées le {verified} sur source officielle
                </div>
              )}
            </div>

            {/* Identité */}
            <div className="order-2">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="brand">{TIER_LABEL[card.tier]}</Pill>
                <Pill>{card.network}</Pill>
                {verified ? (
                  <Pill tone="emerald">
                    <CheckIcon className="h-3.5 w-3.5" />
                    Vérifié
                  </Pill>
                ) : (
                  <Pill tone="amber">Données indicatives</Pill>
                )}
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {card.name}
              </h1>
              <p className="mt-1.5 text-slate-500">Émise par {card.issuer}</p>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                {heroLead(card, highlights)}
              </p>

              {highlights.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {highlights.map((h) => (
                    <li
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                    >
                      <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* Prix + actions */}
              <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Cotisation
                  </p>
                  <p className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {isFree ? "Gratuite" : feeLabel(card)}
                  </p>
                </div>
                {isFree && (
                  <span className="mb-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-600">
                    0 € par an
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/simulateur"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                  Chiffrer selon mes usages
                  <ArrowIcon className="h-4 w-4" />
                </Link>
                {hasOffer && (
                  <a
                    href={`/go/${card.id}?from=fiche`}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                  >
                    Voir l&apos;offre
                  </a>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Simulation gratuite, sans inscription.
                {hasOffer &&
                  ` Lien affilié vers le site officiel de ${card.issuer.split(" (")[0]} — n'influence pas le classement.`}
              </p>
            </div>
          </div>

          {/* ─── Faits clés ─── */}
          <section className="mt-16">
            <SectionHeading
              eyebrow="Les conditions, en clair"
              title="Frais et services de cette carte"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <FactCard key={f.label} {...f} />
              ))}
            </div>
            {card.free_condition && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  <span className="font-medium text-slate-600">Condition de gratuité / d&apos;évolution&nbsp;:</span>{" "}
                  {card.free_condition}
                </span>
              </p>
            )}
          </section>

          {/* ─── Fonctionnalités & services (au-delà du coût) ─── */}
          {hasFeatures(card) && <FeaturesSection card={card} />}

          {/* ─── Coût réel : analyse chiffrée selon 3 usages types (indexable) ─── */}
          <section className="mt-16">
            <SectionHeading
              eyebrow="Notre analyse chiffrée"
              title={`Le coût réel de ${card.name}, selon vos usages`}
            />
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              La cotisation ne dit pas tout. Voici le coût annuel <em>net</em>{" "}
              estimé pour trois profils d&apos;usage — cotisation, frais de change
              et de retrait compris, primes et cashback déduits. Même moteur de
              calcul que le simulateur, sur données officielles.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {scenarioCosts.map(({ scenario, netAnnual }) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  netAnnual={netAnnual}
                  maxAbsCost={maxAbsCost}
                />
              ))}
            </div>

            {/* Insight factuel dérivé de l'amplitude des trois scénarios. */}
            <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
              <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <span>
                {costSpread < 20
                  ? `Bon à savoir : le coût de ${card.name} varie peu d'un profil à l'autre — il reste stable quel que soit votre usage à l'étranger.`
                  : `Bon à savoir : le coût de ${card.name} augmente sensiblement avec la part de dépenses et de retraits en devises. Votre profil réel fait la différence.`}
              </span>
            </p>

            <details className="mt-3 text-xs leading-relaxed text-slate-400">
              <summary className="cursor-pointer font-medium text-slate-500 marker:content-['']">
                Hypothèses de calcul
              </summary>
              <p className="mt-1.5">
                Retrait étranger moyen 100 €, prime de bienvenue amortie sur 3 ans.
                Un coût négatif signifie que la carte « rapporte » sur
                l&apos;horizon retenu. Votre cas exact peut différer : ajustez-le
                ci-dessous.
              </p>
            </details>
          </section>

          {/* ─── Widget de simulation embarqué, scopé sur cette carte ─── */}
          <section className="mt-10">
            <MiniSimulateur card={card} />
          </section>

          {/* ─── Vérification des données (source officielle) ─── */}
          {card.verif_note && (
            <section className="mt-16">
              <SectionHeading eyebrow="Notre engagement" title="Vérification des données" />
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Note de vérification
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {card.verif_note}
                </p>
                {hasOffer && (
                  <a
                    href={card.source_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Consulter la source officielle
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </section>
          )}

          {/* ─── Alerte tarifaire : capture email récurrente, ciblée ─── */}
          <section className="mt-10">
            <PriceAlertSignup card={{ id: card.id, name: card.name }} source="fiche" />
          </section>

          {/* ─── CTA simulateur ─── */}
          <section className="mt-16 overflow-hidden rounded-3xl bg-brand relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative p-8 text-center sm:p-12">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Cette carte vaut-elle le coup pour <em>vous</em> ?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-indigo-100">
                En 3 questions, CB180 estime le coût annuel de cette carte selon
                vos usages et le compare à votre situation actuelle. Cinq questions
                de plus affinent le chiffre.
              </p>
              <Link
                href="/simulateur"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
              >
                Lancer la simulation, gratuit
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* ─── Comparaisons : liens internes vers les pages /comparatif ─── */}
          <section className="mt-16">
            <SectionHeading
              eyebrow="Mettre en balance"
              title={`Comparer ${card.name} avec…`}
            />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {comparables.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/comparatif/${comparisonSlug(card.id, other.id)}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-600/5"
                  >
                    <MiniCard tone={toneForTier(other.tier)} className="shrink-0" />
                    <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                      {card.name} <span className="text-slate-400">vs</span>{" "}
                      {other.name}
                    </span>
                    <ArrowIcon className="h-4 w-4 shrink-0 text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ─── FAQ factuelle propre à la carte (longue traîne) ─── */}
          {faq.length > 0 && (
            <section className="mt-16">
              <SectionHeading
                eyebrow="Questions fréquentes"
                title={`${card.name} : ce qu'on nous demande`}
              />
              <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {faq.map((item) => (
                  <details key={item.q} className="group px-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-slate-900 marker:content-['']">
                      {item.q}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-180">
                        <ChevronIcon className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="-mt-1 pb-4 text-sm leading-relaxed text-slate-600">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <p className="mt-12 text-xs leading-relaxed text-slate-500">
            CB180 est un site d&apos;information et de comparaison, non
            intermédiaire en opérations de banque. Cette fiche ne constitue ni un
            conseil personnalisé ni une recommandation de souscription. Vérifiez
            toujours les conditions générales à jour de l&apos;établissement avant
            toute décision.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/* ─────────────────────────── Sous-composants ─────────────────────────── */

/** Phrase d'accroche factuelle : atouts différenciants + cotisation. IOBSP. */
function heroLead(card: Card, highlights: string[]): string {
  const feePart = card.annual_fee_eur === 0 ? "sans cotisation" : `pour ${feeLabel(card)}`;
  if (highlights.length === 0) {
    return `Carte ${card.network} ${TIER_LABEL[card.tier].toLowerCase()}, ${feePart}. Voici son coût réel selon vos usages.`;
  }
  const traits = highlights.slice(0, 2).map((h, i) => (i === 0 ? h : h.toLowerCase()));
  return `${traits.join(", ")} — ${feePart}.`;
}

/** Étiquette arrondie, teinte selon le rôle. */
function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "brand" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    brand: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** En-tête de section : sur-titre coloré + titre. */
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
    </div>
  );
}

/** Fait clé : icône + libellé + valeur. Les faits « forts » sont accentués. */
function FactCard({
  icon: Icon,
  label,
  value,
  strong = false,
}: {
  icon: (p: { className?: string }) => React.ReactElement;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
      <span
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
          (strong ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")
        }
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-semibold leading-snug text-slate-800">
          {value}
        </dd>
      </div>
    </div>
  );
}

/**
 * Section « Fonctionnalités & services » : ce qui différencie la carte au-delà
 * du coût (débit, paiement mobile, sous-comptes, IBAN, chéquier…). Purement
 * informatif, n'entre pas dans le classement. Tri-état : ✓ confirmé présent,
 * « Non » confirmé absent ; les fonctionnalités non vérifiées sont masquées.
 */
function FeaturesSection({ card }: { card: Card }) {
  const debit = debitLabel(card);
  const material = materialLabel(card);
  const groups = FEATURE_GROUPS.map((g) => ({ group: g, rows: groupRows(card, g) })).filter(
    (g) => g.rows.length > 0,
  );

  return (
    <section className="mt-16">
      <SectionHeading
        eyebrow="Au-delà du coût"
        title="Fonctionnalités & services"
      />
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Ce que la cotisation ne dit pas : les services qui diffèrent d&apos;une
        banque à l&apos;autre. Information factuelle, sans incidence sur le
        classement, qui reste établi sur le seul coût annuel.
      </p>

      {/* Débit + matière : deux traits saillants mis en avant s'ils sont connus. */}
      {(debit || material) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {debit && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              {debit}
            </span>
          )}
          {material && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
              <WalletIcon className="h-4 w-4 text-slate-400" />
              {material}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ group, rows }) => (
          <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.title}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {rows.map((r) => {
                const yes = r.status === "yes";
                return (
                  <li key={r.key} className="flex items-center gap-2.5 text-sm">
                    {yes ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <MinusIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className={yes ? "font-medium text-slate-800" : "text-slate-400"}>
                      {r.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Icône d'un scénario d'usage (sédentaire / occasionnel / grand voyageur). */
const SCENARIO_ICON: Record<string, (p: { className?: string }) => React.ReactElement> = {
  sedentaire: HomeIcon,
  "voyageur-occasionnel": PlaneIcon,
  "grand-voyageur": GlobeIcon,
};

/** Tuile « coût réel » d'un scénario : chiffre + barre à l'échelle commune. */
function ScenarioCard({
  scenario,
  netAnnual,
  maxAbsCost,
}: {
  scenario: (typeof USAGE_SCENARIOS)[number];
  netAnnual: number;
  maxAbsCost: number;
}) {
  const Icon = SCENARIO_ICON[scenario.id] ?? HomeIcon;
  const isGain = netAnnual < 0;
  const barWidth = Math.max(6, (Math.abs(netAnnual) / maxAbsCost) * 100);
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-semibold text-slate-900">{scenario.label}</p>
      </div>

      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
        {netAnnual <= 0 ? formatEur(0) : formatEur(netAnnual)}
        <span className="text-sm font-medium text-slate-400">/an</span>
      </p>

      {/* Barre à l'échelle commune aux trois scénarios. */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={"h-full rounded-full " + (isGain ? "bg-emerald-500" : "bg-brand")}
          style={{ width: `${barWidth}%` }}
          aria-hidden
        />
      </div>

      {isGain && (
        <p className="mt-2 text-xs font-medium text-emerald-600">
          soit un gain net de {formatEur(Math.abs(netAnnual))}/an
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {scenario.description}
      </p>
    </div>
  );
}

/* ──────────────────────────────── Icônes ─────────────────────────────── */
// SVG inline, sobres (stroke 1.6), 24×24. aria-hidden : purement décoratives.

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" />
      <path d="M20 10.5h-4a2 2 0 0 0 0 4h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z" />
    </Svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v6M18 9v6" />
    </Svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M4 11.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5Z" />
      <path d="M3 8.5h18v3H3zM12 8.5V20" />
      <path d="M12 8.5S10.5 4 8 4a2 2 0 0 0 0 4.5M12 8.5S13.5 4 16 4a2 2 0 0 1 0 4.5" />
    </Svg>
  );
}

function IdIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M5.5 16c.6-1.5 1.9-2.2 3.5-2.2s2.9.7 3.5 2.2M15 9.5h3.5M15 12.5h3.5M15 15.5h2" />
    </Svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" />
    </Svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </Svg>
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M10.5 13.5 3 12l2-3 5.5 1.5L16 5c1-.9 3 .5 2 2l-4 6 1.5 5.5-3 2-1.5-6.5-3 2v3l-2-1-.5-3 3.5-1.5Z" />
    </Svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.4 11 16 12l-2.6 1L12 15.5 10.6 13 8 12l2.6-1L12 8.5Z" />
    </Svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M5 12h14" />
    </Svg>
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
