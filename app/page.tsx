import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

// Landing CB180 — conforme au wording IOBSP : information chiffrée objective,
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
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            Information chiffrée, pas de conseil personnalisé
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Combien vous coûte{" "}
            <span className="text-indigo-600">vraiment</span> votre carte
            bancaire&nbsp;?
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Répondez à 8 questions. CB180 calcule le coût annuel chiffré de votre
            carte actuelle et le compare, objectivement, aux alternatives du
            marché français.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/simulateur"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              Lancer la simulation — gratuit
            </Link>
            <Link
              href="/comment-ca-marche"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Comment ça marche
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Anonyme · en fourchettes · aucun nom de banque demandé
          </p>
        </div>
      </div>
    </section>
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
      icon: <EuroIcon className="h-6 w-6 text-indigo-600" />,
      title: "Le coût réel, en euros",
      body: "Cotisation, frais de change, retraits à l'étranger, moins les primes et le cashback. Pas un avis : un montant annuel net.",
    },
    {
      icon: <ScaleIcon className="h-6 w-6 text-indigo-600" />,
      title: "Un classement objectif",
      body: "Les cartes sont triées par coût annuel net, avec le détail du calcul dépliable. Le même barème s'applique à toutes.",
    },
    {
      icon: <EyeIcon className="h-6 w-6 text-indigo-600" />,
      title: "Transparence radicale",
      body: "Les liens sont affiliés et la commission est affichée en clair. Elle n'influence jamais le classement.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {props.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
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
      title: "Vos usages, en 8 questions",
      body: "Dépenses, part hors zone euro, retraits, cotisation actuelle… en fourchettes, sans donnée identifiante.",
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
    <section className="bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Comment ça marche
          </h2>
          <p className="mt-3 text-slate-600">
            Trois étapes, quelques minutes, aucun engagement.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">
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
    { label: "Prime de bienvenue (amortie 1 an)", value: "−160,00 €", neg: true },
    { label: "Cashback estimé", value: "0,00 €" },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Un résultat lisible, jusqu&apos;au moindre euro
          </h2>
          <p className="mt-4 text-slate-600">
            Chaque carte affiche son coût annuel net et le détail complet du
            calcul. Vous voyez exactement d&apos;où vient le chiffre — libre à
            vous de l&apos;interpréter.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Exemple illustratif pour un profil donné. Les montants réels
            dépendent de vos réponses et sont recalculés à chaque simulation.
          </p>
        </div>

        {/* Maquette de carte résultat (statique, illustrative) */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-900">Exemple de carte</p>
                <p className="text-sm text-slate-500">Émetteur</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">
                −160 €<span className="text-xs font-normal text-slate-500"> / an</span>
              </p>
              <p className="text-xs font-medium text-emerald-600">
                la carte vous rapporte
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
              <dt>Coût annuel net</dt>
              <dd>−160,00 €</dd>
            </div>
          </dl>
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            Lien affilié — commission estimée versée à CB180 :{" "}
            <span className="font-medium text-slate-700">80 €</span>.
            N&apos;influence pas le classement.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Transparency ---- */

function Transparency() {
  const points = [
    "Le classement est établi selon un seul critère objectif : le coût annuel net.",
    "Le même calcul, avec les mêmes hypothèses, s'applique à toutes les cartes.",
    "Les liens affiliés sont identifiés et la commission estimée est affichée en clair.",
    "La rémunération n'influe pas sur l'ordre du classement — et nous le disons.",
    "Les données proviennent des documents tarifaires publics, avec une date de dernière vérification par carte.",
  ];
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white">
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
      a: "Par des liens affiliés : si vous ouvrez une carte via un lien, l'émetteur peut verser une commission. Elle est affichée en clair et n'influence pas le classement, qui reste trié par coût annuel net.",
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
    <section className="bg-indigo-600">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Chiffrez le coût réel de votre carte
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-indigo-100">
          Quelques minutes, en fourchettes et sans donnée identifiante. Vous
          repartez avec un montant, pas avec un avis.
        </p>
        <Link
          href="/simulateur"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
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
