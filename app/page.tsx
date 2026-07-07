import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import CardVisual, { ProductCardVisual } from "@/components/brand/CardVisual";
import { publicCards } from "@/lib/cards";
import { GUIDES } from "@/lib/guides";
import { feeLabel, fxLabel, verifiedDate } from "@/lib/card-display";

// Landing CB180, conforme au wording IOBSP : information chiffrée objective,
// jamais « recommandé pour vous », « souscrivez » ou « courtier ».

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <ValueProps />
        <HowItWorks />
        <ExampleResult />
        <FeaturedCards />
        <GuidesTeaser />
        <Transparency />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ---------------------------------------------------------------- Hero ---- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Fonds décoratifs : halos dégradés + grille en pointillés */}
      <div className="brand-glow pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2">
        {/* Colonne texte */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Votre carte vous coûte peut-être{" "}
            <span className="text-gradient">200&nbsp;€ de trop</span> par
            an&nbsp;?
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
            Voyez combien vous pourriez récupérer, en 3 questions (30&nbsp;s).
            CB180 calcule le coût annuel réel de votre carte et le compare,
            objectivement, aux alternatives du marché français.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/simulateur"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              Lancer la simulation
            </Link>
            <Link
              href="/comment-ca-marche"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Comment ça marche
            </Link>
          </div>
        </div>

        {/* Colonne visuelle : cartes empilées + pastille de résultat */}
        <HeroVisual />
      </div>
    </section>
  );
}

/** Illustration produit : deux cartes qui flottent + une carte « résultat ». */
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* Carte du fond (sombre), légèrement pivotée */}
      <div className="floaty-slow absolute left-2 top-6 w-[68%] rotate-[-8deg]">
        <CardVisual tone="dark" label="Carte actuelle" last4="4417" />
      </div>
      {/* Carte de marque au premier plan */}
      <div className="floaty absolute right-1 top-0 w-[72%] rotate-[6deg]">
        <CardVisual tone="brand" label="Alternative" last4="1802" sheen />
      </div>

      {/* Pastille de résultat : comparaison chiffrée intégrée aux cartes (illustratif) */}
      <div className="absolute bottom-1 left-0 w-[84%] overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-md sm:w-[76%]">
        <div className="p-4">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                <path d="M10 3a1 1 0 0 1 1 1v9.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4L9 13.6V4a1 1 0 0 1 1-1z" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Écart annuel estimé
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight tabular-nums text-emerald-600">
              +269&nbsp;€
            </span>
            <span className="text-xs font-medium text-slate-400">/ an</span>
          </div>

          {/* La comparaison qui explique l'écart : actuel vs la moins chère */}
          <div className="mt-3 space-y-2" aria-hidden>
            <CompareBar
              label="Votre carte"
              amount="≈ 318 €"
              width="100%"
              barClass="bg-slate-300"
              valueClass="text-slate-500"
            />
            <CompareBar
              label="La moins chère"
              amount="≈ 49 €"
              width="16%"
              barClass="bg-emerald-500"
              valueClass="text-emerald-600"
            />
          </div>
        </div>

        <p className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] leading-tight text-slate-400">
          Exemple illustratif, recalculé selon vos réponses.
        </p>
      </div>
    </div>
  );
}

/** Barre de comparaison de la pastille hero : libellé, montant, jauge. */
function CompareBar({
  label,
  amount,
  width,
  barClass,
  valueClass,
}: {
  label: string;
  amount: string;
  width: string;
  barClass: string;
  valueClass: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[10px] font-medium">
        <span className="text-slate-500">{label}</span>
        <span className={`tabular-nums ${valueClass}`}>{amount}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Trust strip ---- */

function TrustStrip() {
  const items = [
    "Données en fourchettes, anonymisées",
    "Hébergement en Union européenne (RGPD)",
    "Aucune donnée identifiante requise",
    "Un même calcul objectif pour toutes les cartes",
  ];
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-5xl gap-3 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-sm text-slate-600">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------- Value props ---- */

function ValueProps() {
  const props = [
    {
      icon: <EuroIcon className="h-6 w-6 text-white" />,
      title: "Le coût réel, en euros",
      body: "Cotisation, frais de change, retraits à l'étranger, moins les primes et le cashback. Pas un avis : un montant annuel net.",
    },
    {
      icon: <ScaleIcon className="h-6 w-6 text-white" />,
      title: "Un classement objectif",
      body: "Les cartes sont triées par coût annuel net, avec le détail du calcul dépliable. Le même barème s'applique à toutes.",
    },
    {
      icon: <EyeIcon className="h-6 w-6 text-white" />,
      title: "Un financement clair",
      body: "Certains liens sont affiliés. Ils n'influencent jamais le classement, qui reste trié par coût annuel net.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {props.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-indigo-600/20">
                {p.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- How it works ---- */

function HowItWorks() {
  const steps = [
    {
      title: "Un premier chiffre en 3 questions",
      body: "Dépenses, part hors zone euro, cotisation actuelle : trois réponses en fourchettes suffisent. Cinq questions de plus l'affinent, sans donnée identifiante.",
    },
    {
      title: "Le calcul du coût annuel net",
      body: "Un moteur applique le même barème transparent à chaque carte du catalogue.",
    },
    {
      title: "Votre classement chiffré",
      body: "Cartes triées par coût annuel, écart avec votre situation actuelle, et détail du calcul déplié.",
    },
  ];
  return (
    <section className="relative overflow-hidden bg-slate-50">
      <div className="brand-glow pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-3 text-slate-600">
            Trois étapes, quelques minutes, aucun engagement.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white shadow-md shadow-indigo-600/20">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- Example result ---- */

function ExampleResult() {
  const lines = [
    { label: "Cotisation annuelle", value: "0,00 €" },
    { label: "Frais de change estimés", value: "0,00 €" },
    { label: "Frais de retrait étranger estimés", value: "0,00 €" },
    { label: "Prime de bienvenue (amortie 3 ans)", value: "−10,00 €", neg: true },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Un résultat lisible, jusqu&apos;au moindre euro
          </h2>
          <p className="mt-4 text-slate-600">
            Chaque carte affiche deux vues de coût (la 1ʳᵉ année et le coût
            récurrent) et le détail complet du calcul. Vous voyez exactement
            d&apos;où vient le chiffre, libre à vous de l&apos;interpréter.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Exemple illustratif pour un profil donné. Les montants réels
            dépendent de vos réponses et sont recalculés à chaque simulation.
          </p>
        </div>

        {/* Maquette de carte résultat (statique, illustrative) */}
        <div className="relative">
          <div className="brand-glow pointer-events-none absolute -inset-6 -z-10 opacity-60 blur-xl" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5">
            <div className="bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              Coût annuel le plus bas du panel
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Exemple de carte</p>
                  <p className="text-sm text-slate-500">Réseau</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  0 €<span className="text-xs font-normal text-slate-500"> / an</span>
                </p>
                <p className="text-xs text-slate-400">1ʳᵉ année : −10 €</p>
                <p className="text-xs font-medium text-emerald-600">
                  Économie vs actuel +269 €
                </p>
              </div>
            </div>
            <dl className="space-y-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
              {lines.map((l) => (
                <div key={l.label} className="flex justify-between text-slate-600">
                  <dt>{l.label}</dt>
                  <dd className={l.neg ? "text-emerald-600" : ""}>{l.value}</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                <dt>Coût net la 1ʳᵉ année</dt>
                <dd>−10,00 €</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>Coût récurrent (hors prime)</dt>
                <dd>0,00 €</dd>
              </div>
            </dl>
            <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
              Lien affilié. N&apos;influence pas le classement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- Featured cards ---- */

function FeaturedCards() {
  // Cartes à la une : sans frais à l'étranger (change 0 % + retraits gratuits),
  // les moins chères d'abord, une par établissement pour la diversité.
  const seen = new Set<string>();
  const featured = publicCards()
    .filter(
      (c) => c.fx_fee_percent === 0 && (c.foreign_withdrawal_fee_percent ?? 0) === 0,
    )
    .sort((a, b) => a.annual_fee_eur - b.annual_fee_eur || a.name.localeCompare(b.name))
    .filter((c) => {
      if (seen.has(c.issuer)) return false;
      seen.add(c.issuer);
      return true;
    })
    .slice(0, 3);

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Cartes à la une
            </h2>
            <p className="mt-2 text-slate-600">
              Trois cartes sans frais à l&apos;étranger, sur données vérifiées.
            </p>
          </div>
          <Link
            href="/cartes"
            className="hidden shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:block"
          >
            Toutes les cartes →
          </Link>
        </div>

        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {featured.map((card) => {
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
                    <h3 className="font-semibold text-slate-900">{card.name}</h3>
                    <p className="text-sm text-slate-500">{card.issuer}</p>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-400">Cotisation</dt>
                        <dd className="font-medium text-slate-800">{feeLabel(card)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">Change hors €</dt>
                        <dd className="font-medium text-slate-800">{fxLabel(card)}</dd>
                      </div>
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

        <Link
          href="/cartes"
          className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:hidden"
        >
          Toutes les cartes →
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Guides teaser ---- */

function GuidesTeaser() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Guides pour choisir
            </h2>
            <p className="mt-2 text-slate-600">
              Un besoin précis ? Partez d&apos;un critère objectif.
            </p>
          </div>
          <Link
            href="/guides"
            className="hidden shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:block"
          >
            Tous les guides →
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <span className="font-semibold text-slate-900">{guide.title}</span>
                <span className="shrink-0 text-indigo-600 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Transparency ---- */

function Transparency() {
  const points = [
    "Le classement est établi selon un seul critère objectif : le coût annuel net.",
    "Le même calcul, avec les mêmes hypothèses, s'applique à toutes les cartes.",
    "Les liens affiliés sont clairement identifiés comme tels.",
    "La rémunération n'influe pas sur l'ordre du classement, et nous le disons.",
    "Les données proviennent des documents tarifaires publics, avec une date de dernière vérification par carte.",
  ];
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="brand-glow pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            La transparence, par obligation et par conviction
          </h2>
          <p className="mt-4 text-slate-300">
            Un comparateur doit expliquer ses critères et le caractère affilié de
            ses liens. Chez CB180, c&apos;est aussi ce qui fait la valeur de
            l&apos;outil.
          </p>
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
                <span className="text-slate-200">{point}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/comment-ca-marche"
            className="mt-8 inline-flex text-sm font-semibold text-indigo-300 hover:text-indigo-200"
          >
            Voir en détail comment le classement est établi →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- FAQ ---- */

function Faq() {
  const faqs = [
    {
      q: "Est-ce que CB180 me recommande une carte ?",
      a: "Non. CB180 est un outil d'information : il calcule et trie objectivement par coût annuel. Vous interprétez le résultat vous-même. Ce n'est ni un conseil personnalisé ni une recommandation de souscription.",
    },
    {
      q: "Quelles données collectez-vous ?",
      a: "Uniquement des fourchettes d'usage, anonymisées. Aucune donnée identifiante n'est requise, et nous ne demandons jamais le nom de votre banque. Si vous choisissez de recevoir votre résultat par email, celui-ci est stocké séparément de vos réponses. Hébergement en Union européenne.",
    },
    {
      q: "Comment CB180 est-il financé ?",
      a: "Par des liens affiliés : si vous ouvrez une carte via un lien, l'émetteur peut verser une commission. Elle n'influence pas le classement, qui reste trié par coût annuel net.",
    },
    {
      q: "Les chiffres sont-ils à jour ?",
      a: "Chaque carte porte une date de dernière vérification. Les informations proviennent des documents tarifaires publics des établissements.",
    },
    {
      q: "Le service est-il gratuit ?",
      a: "Oui, la simulation est entièrement gratuite et sans engagement.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Questions fréquentes
        </h2>
        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left marker:content-['']">
                <span className="font-semibold text-slate-900">{faq.q}</span>
                <ChevronIcon className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Final CTA --- */

function FinalCta() {
  return (
    <section className="bg-brand relative overflow-hidden">
      <div className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Voyez ce que vous pourriez récupérer
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-indigo-100">
          3 questions, 30 secondes, sans donnée identifiante. Vous repartez avec
          un montant, pas avec un avis.
        </p>
        <Link
          href="/simulateur"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
        >
          Lancer la simulation
        </Link>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Icons --- */

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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EuroIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.5a4 4 0 100 7M5 10h6M5 14h6" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M6 20h12M3 8l3-4 3 4a3 3 0 01-6 0zM15 8l3-4 3 4a3 3 0 01-6 0z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
