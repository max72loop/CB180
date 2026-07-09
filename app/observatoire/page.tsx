// app/observatoire/page.tsx
// L'Observatoire CB180 : indice tarifaire trimestriel du coût des cartes
// bancaires en France, pensé comme un ACTIF DE PRESSE citable (chiffre clé daté,
// méthodologie ouverte, bloc prêt à citer, données structurées Dataset). Les
// chiffres proviennent du dernier relevé versionné (data/observatoire-history),
// pas d'un calcul à la volée : le chiffre publié reste stable et reproductible.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { SITE_URL } from "@/lib/site";
import {
  getSnapshots,
  latestSnapshot,
  latestEvolution,
  type Snapshot,
} from "@/lib/observatoire";

export const metadata: Metadata = {
  title: "Observatoire du coût des cartes bancaires",
  description:
    "L'indice trimestriel du coût des cartes bancaires en France : cotisation moyenne, cartes les moins et plus chères, part sans frais, évolution. Données vérifiées, méthodologie ouverte.",
  alternates: { canonical: "/observatoire" },
  openGraph: {
    title: "Observatoire CB180 du coût des cartes bancaires",
    description:
      "L'indice trimestriel, chiffré et daté, du coût des cartes bancaires en France. Méthodologie ouverte, prêt à citer.",
    url: "/observatoire",
  },
};

const eur0 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eur2 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pct = (x: number) => `${Math.round(x * 100)} %`;

function frDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default function ObservatoirePage() {
  const snap = latestSnapshot();
  const series = getSnapshots();
  const evolution = latestEvolution();

  if (!snap) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Observatoire CB180</h1>
          <p className="mt-3 text-slate-500">
            Le premier relevé est en préparation. Revenez très bientôt.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const citation = `Selon l'Observatoire CB180 (relevé du ${frDate(
    snap.referenceDate,
  )}), la cotisation annuelle moyenne d'une carte bancaire ressort à ${eur2.format(
    snap.avgAnnualFee,
  )} sur un panel de ${snap.panelSize} cartes vérifiées.`;

  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Observatoire CB180 du coût des cartes bancaires",
    description:
      "Indice tarifaire trimestriel du coût des cartes bancaires en France, calculé sur le panel de cartes vérifiées de CB180 : cotisation moyenne, médiane, part de cartes sans frais, évolution.",
    url: `${SITE_URL}/observatoire`,
    creator: { "@type": "Organization", name: "CB180", url: SITE_URL },
    isAccessibleForFree: true,
    dateModified: snap.referenceDate,
    temporalCoverage: snap.period,
    measurementTechnique:
      "Agrégation des documents tarifaires publics des établissements",
    variableMeasured: [
      { "@type": "PropertyValue", name: "Cotisation annuelle moyenne", value: snap.avgAnnualFee, unitText: "EUR" },
      { "@type": "PropertyValue", name: "Cotisation annuelle médiane", value: snap.medianAnnualFee, unitText: "EUR" },
      { "@type": "PropertyValue", name: "Part de cartes sans cotisation", value: Math.round(snap.shareFree * 100), unitText: "PERCENT" },
      { "@type": "PropertyValue", name: "Frais de change moyen", value: snap.avgFxFeePercent, unitText: "PERCENT" },
    ],
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }}
      />
      <main>
        {/* ─── Hero + chiffre clé (masthead éditorial sur fond encre) ─── */}
        <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
          <div className="graticule pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(80%_70%_at_50%_0%,black,transparent)]" />
          <div className="brand-glow pointer-events-none absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            {/* Barre de masthead : signature d'un indice publié, en monospace */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
              <span className="text-indigo-300">Indice tarifaire</span>
              <span className="text-right">
                {snap.label} · relevé {frDate(snap.referenceDate)}
              </span>
            </div>
            <h1 className="mt-6 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Le coût des cartes bancaires en France, chiffré et daté
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
              Un indice trimestriel public, calculé sur les cartes vérifiées du
              panel CB180. Données issues des documents tarifaires officiels,
              méthodologie ouverte, prêt à citer.
            </p>

            {/* Chiffre clé */}
            <div className="mt-10 grid gap-4 sm:grid-cols-5">
              <div className="rounded-3xl border border-indigo-400/30 bg-indigo-500/10 p-7 backdrop-blur sm:col-span-3">
                <p className="text-sm font-medium text-indigo-300">
                  Cotisation annuelle moyenne
                </p>
                <p className="mt-1 text-6xl font-extrabold tracking-tight text-white tabular-nums sm:text-7xl">
                  {eur2.format(snap.avgAnnualFee)}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Médiane {eur0.format(snap.medianAnnualFee)} · panel de{" "}
                  {snap.panelSize} cartes vérifiées · relevé au{" "}
                  {frDate(snap.referenceDate)}
                </p>
              </div>
              <div className="grid gap-4 sm:col-span-2">
                <MiniCard
                  label="Cartes sans cotisation"
                  value={pct(snap.shareFree)}
                />
                <MiniCard
                  label="Cartes sans frais à l'étranger"
                  value={pct(snap.shareNoForeignFee)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-16 px-5 py-16">
          {/* ─── Repères ─── */}
          <section>
            <SectionTitle
              n={1}
              eyebrow="Repères du trimestre"
              title="Les extrêmes et la moyenne du marché suivi"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <ExtremeCard
                label="La moins chère du panel"
                card={snap.cheapest}
                tone="emerald"
              />
              <ExtremeCard
                label="La plus chère du panel"
                card={snap.mostExpensive}
                tone="slate"
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Frais de change moyen</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                  {snap.avgFxFeePercent.toLocaleString("fr-FR")} %
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sur les paiements hors zone euro, moyenne du panel.
                </p>
              </div>
            </div>
          </section>

          {/* ─── Par gamme ─── */}
          <section>
            <SectionTitle
              n={2}
              eyebrow="Par gamme"
              title="Cotisation moyenne selon le niveau de carte"
            />
            <div className="mt-6 space-y-4">
              {snap.byTier.map((t) => {
                const max = Math.max(...snap.byTier.map((x) => x.avgFee), 1);
                const width = Math.max(3, Math.round((t.avgFee / max) * 100));
                return (
                  <div key={t.tier}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">
                        {t.label}{" "}
                        <span className="text-slate-500">
                          · {t.count} carte{t.count > 1 ? "s" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                        {eur0.format(t.avgFee)}
                        <span className="text-xs font-normal text-slate-500"> /an</span>
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── Évolution ─── */}
          <section>
            <SectionTitle
              n={3}
              eyebrow="Évolution"
              title="La cotisation moyenne au fil des trimestres"
            />
            <EvolutionChart series={series} />
          </section>

          {/* ─── Ce qui a changé ─── */}
          <section>
            <SectionTitle
              n={4}
              eyebrow="Dernières évolutions détectées"
              title="Ce qui a bougé depuis le relevé précédent"
            />
            <ChangesBlock evolution={evolution} />
          </section>

          {/* ─── Méthodologie ─── */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Méthodologie</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>
                <strong className="font-semibold text-slate-800">Panel.</strong>{" "}
                {snap.panelSize} cartes du catalogue CB180 dont les tarifs ont été
                vérifiés (banques en ligne, néobanques et cartes de référence de
                banques traditionnelles). Ce n&apos;est pas l&apos;ensemble du
                marché français, mais un panel représentatif des offres suivies.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">Calcul.</strong>{" "}
                La cotisation annuelle moyenne est la moyenne arithmétique des
                cotisations affichées ; la médiane, la valeur centrale. Les parts
                « sans cotisation » et « sans frais à l&apos;étranger » sont
                rapportées au panel.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">Sources.</strong>{" "}
                Documents tarifaires publics des établissements, avec une date de
                dernière vérification par carte. Relevé de référence :{" "}
                {frDate(snap.referenceDate)}.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">Limites.</strong>{" "}
                L&apos;indice porte sur la cotisation, pas sur le coût réel à
                l&apos;usage (change, retraits, primes), qui dépend des habitudes
                de chacun et se chiffre avec le simulateur.
              </li>
            </ul>
          </section>

          {/* ─── Bloc à citer ─── */}
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Citer l&apos;Observatoire CB180
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Journalistes, chercheurs&nbsp;: ces chiffres sont libres de
              reprise avec attribution. Formulation prête à l&apos;emploi&nbsp;:
            </p>
            <blockquote className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800">
              « {citation} »
            </blockquote>
            <p className="mt-3 text-xs text-slate-500">
              Source à mentionner&nbsp;: Observatoire CB180 —{" "}
              <span className="font-medium text-slate-700">
                cb180.xyz/observatoire
              </span>{" "}
              (relevé {snap.label}, {frDate(snap.referenceDate)}). Un contact
              presse&nbsp;? Écrivez à contact@cb180.xyz.
            </p>
          </section>

          {/* ─── CTA ─── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
            <p className="text-base font-semibold text-slate-900">
              Cette moyenne, c&apos;est le marché. Et vous&nbsp;?
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
              L&apos;indice porte sur la cotisation. Votre coût réel dépend de vos
              usages&nbsp;: chiffrez-le en 3 questions.
            </p>
            <Link
              href="/simulateur"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              Lancer la simulation
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionTitle({
  n,
  eyebrow,
  title,
}: {
  n: number;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-4 border-t border-slate-200 pt-5">
      <span className="font-mono text-sm font-semibold tabular-nums text-indigo-500">
        {String(n).padStart(2, "0")}
      </span>
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <p className="text-3xl font-bold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function ExtremeCard({
  label,
  card,
  tone,
}: {
  label: string;
  card: { id: string; name: string; issuer: string; fee: number };
  tone: "emerald" | "slate";
}) {
  const accent =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-white";
  return (
    <Link
      href={`/cartes/${card.id}`}
      className={`block rounded-2xl border p-5 transition-shadow hover:shadow-md ${accent}`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
        {eur0.format(card.fee)}
        <span className="text-xs font-normal text-slate-500"> /an</span>
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {card.name}
      </p>
      <p className="truncate text-xs text-slate-500">{card.issuer}</p>
    </Link>
  );
}

/** Courbe de la cotisation moyenne. Une seule donnée : point + note. */
function EvolutionChart({ series }: { series: Snapshot[] }) {
  if (series.length < 2) {
    const s = series[0];
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold tabular-nums text-slate-900">
            {eur2.format(s.avgAnnualFee)}
          </span>
          <span className="text-sm font-medium text-slate-500">{s.label}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Premier relevé de référence. La courbe d&apos;évolution se dessinera à
          partir du prochain trimestre&nbsp;: chaque relevé est daté et archivé,
          pour un suivi transparent dans le temps.
        </p>
      </div>
    );
  }

  const W = 720;
  const H = 220;
  const pad = 36;
  const values = series.map((s) => s.avgAnnualFee);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) =>
    pad + (i * (W - 2 * pad)) / (series.length - 1);
  const y = (v: number) =>
    H - pad - ((v - min) / span) * (H - 2 * pad);
  const line = series.map((s, i) => `${x(i)},${y(s.avgAnnualFee)}`).join(" ");

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution de la cotisation moyenne">
        <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth={2.5} />
        {series.map((s, i) => (
          <g key={s.period}>
            <circle cx={x(i)} cy={y(s.avgAnnualFee)} r={4} fill="#4f46e5" />
            <text x={x(i)} y={y(s.avgAnnualFee) - 12} textAnchor="middle" fontSize={13} fill="#0f172a" fontWeight="700">
              {Math.round(s.avgAnnualFee)} €
            </text>
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize={12} fill="#64748b">
              {s.period}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Tableau des évolutions détectées, ou message de premier relevé. */
function ChangesBlock({
  evolution,
}: {
  evolution: ReturnType<typeof latestEvolution>;
}) {
  if (!evolution) {
    return (
      <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-500">
        Premier relevé&nbsp;: il n&apos;y a pas encore de trimestre précédent
        pour comparaison. Les hausses et baisses de cotisation, ainsi que les
        entrées et sorties du panel, apparaîtront ici dès le prochain relevé.
      </p>
    );
  }

  const { feeChanges, newCards, removedCards } = evolution;
  const nothing =
    feeChanges.length === 0 && newCards.length === 0 && removedCards.length === 0;

  if (nothing) {
    return (
      <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Aucune évolution de cotisation détectée dans le panel depuis le relevé
        précédent.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {feeChanges.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {feeChanges.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {c.name}
                </p>
                <p className="truncate text-xs text-slate-500">{c.issuer}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-sm font-bold tabular-nums ${
                    c.direction === "hausse" ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {c.direction === "hausse" ? "▲" : "▼"} {eur0.format(c.from)} →{" "}
                  {eur0.format(c.to)}
                </span>
                <p className="text-xs text-slate-500">
                  {c.delta > 0 ? "+" : ""}
                  {eur0.format(c.delta)} /an
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(newCards.length > 0 || removedCards.length > 0) && (
        <p className="text-sm text-slate-500">
          {newCards.length > 0 && (
            <>
              Entrées au panel&nbsp;:{" "}
              <span className="text-slate-700">
                {newCards.map((c) => c.name).join(", ")}
              </span>
              .{" "}
            </>
          )}
          {removedCards.length > 0 && (
            <>
              Sorties&nbsp;:{" "}
              <span className="text-slate-700">
                {removedCards.map((c) => c.name).join(", ")}
              </span>
              .
            </>
          )}
        </p>
      )}
    </div>
  );
}
