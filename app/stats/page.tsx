// app/stats/page.tsx — tableau de bord admin (suivi kill/continue).
// Protégé par ADMIN_KEY (?key=...), non indexé, rendu dynamique (lecture DB).

import { getCard } from "@/lib/cards";
import { getDashboardStats, isDbConfigured, type DashboardStats } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Stats — CB180",
  robots: { index: false, follow: false },
};

const nf = new Intl.NumberFormat("fr-FR");
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)} %`;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey || key !== adminKey) {
    return (
      <Centered>
        <h1 className="text-lg font-semibold text-slate-900">Accès restreint</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cette page nécessite une clé d&apos;accès valide.
        </p>
      </Centered>
    );
  }

  if (!isDbConfigured()) {
    return (
      <Centered>
        <h1 className="text-lg font-semibold text-slate-900">
          Base non configurée
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Renseignez TURSO_DATABASE_URL pour afficher les statistiques.
        </p>
      </Centered>
    );
  }

  const stats = await getDashboardStats();
  return <Dashboard stats={stats} />;
}

function Dashboard({ stats }: { stats: DashboardStats }) {
  const maxCard = stats.topCards[0]?.count ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Tableau de bord CB180
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Suivi kill/continue · données anonymisées.
        </p>
      </header>

      {/* Rangée KPI principale */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Audits complétés" value={nf.format(stats.audits)} accent />
        <Tile label="Clics affiliés" value={nf.format(stats.clicks)} />
        <Tile label="Emails collectés" value={nf.format(stats.emails)} />
      </div>

      {/* Métriques secondaires */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="7 derniers jours" value={nf.format(stats.auditsLast7d)} />
        <MiniStat label="Taux de clic" value={pct(stats.clicks, stats.audits)} />
        <MiniStat label="Taux email" value={pct(stats.emails, stats.audits)} />
        <MiniStat
          label="dont consentement"
          value={nf.format(stats.emailsConsent)}
        />
      </div>

      {/* Gains moyens calculés */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MiniStat
          label="Coût actuel moyen (estimé)"
          value={stats.avgCurrentCost == null ? "—" : eur.format(stats.avgCurrentCost)}
        />
        <MiniStat
          label="Gain annuel moyen vs carte de tête"
          value={stats.avgBestGain == null ? "—" : eur.format(stats.avgBestGain)}
        />
      </div>

      {/* Cartes le plus souvent en tête du classement */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-slate-900">
          Cartes en tête du classement
        </h2>
        {stats.topCards.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Aucun audit pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {stats.topCards.map((c) => {
              const name = getCard(c.cardId)?.name ?? c.cardId;
              const width = maxCard ? Math.round((c.count / maxCard) * 100) : 0;
              return (
                <li key={c.cardId}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm text-slate-700">{name}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {nf.format(c.count)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${Math.max(width, 3)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Funnel d'events */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-slate-900">Funnel (events)</h2>
        {stats.eventsByType.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Aucun event enregistré.</p>
        ) : (
          <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {stats.eventsByType.map((e) => (
              <div key={e.type} className="flex justify-between px-4 py-2.5 text-sm">
                <dt className="text-slate-600">{e.type}</dt>
                <dd className="font-semibold tabular-nums text-slate-900">
                  {nf.format(e.count)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </main>
  );
}

function Tile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5",
        accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <p className="text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="text-center">{children}</div>
    </main>
  );
}
