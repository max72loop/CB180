"use client";

// components/results/ResultsPreview.tsx
// Page de résultats. Conforme au wording IOBSP : information chiffrée, cartes
// triées objectivement par coût annuel, JAMAIS « recommandé pour vous ».
//
// Quatre piliers :
//  1. Deux vues de coût transparentes (1ʳᵉ année avec prime / récurrent hors prime),
//     une bascule pilote le chiffre mis en avant ET le tri ; les deux restent visibles.
//  2. Gain annuel honnête : écart avec la carte la moins chère, vue récurrente par
//     défaut, avec mention de la part de prime non récurrente.
//  3. Cartes non éligibles regroupées à part (splitByEligibility), jamais retirées.
//  4. Commissions d'affiliation affichées en clair + composition du coût (costComposition).
//
// L'audit est déjà enregistré par le parent (fire-and-forget). Ici : capture email
// (stockage séparé du profil) et event de clic affilié.

import { useMemo, useState } from "react";
import { costComposition, splitByEligibility } from "@/lib/engine";
import { MiniCard } from "@/components/brand/CardVisual";
import type { Card, CostBreakdown, CostShare, RankedCard } from "@/lib/types";
import { formatEur, formatEurCents, formatSignedEur } from "@/lib/format";

/** Vue de coût mise en avant. */
type CostView = "recurring" | "year1";

/** Teinte de la vignette de carte selon la gamme (décoratif, neutre). */
function toneForTier(tier: Card["tier"]): "brand" | "dark" | "emerald" | "slate" {
  if (tier === "premium") return "dark";
  if (tier === "haut_de_gamme") return "emerald";
  if (tier === "intermediaire") return "brand";
  return "slate";
}

interface ResultsPreviewProps {
  current: CostBreakdown;
  ranked: RankedCard[];
  /**
   * P5 — false si l'utilisateur a choisi de ne pas renseigner son revenu :
   * on n'affiche aucun jugement d'éligibilité (conditions inconnues) et toutes
   * les cartes restent dans le classement principal.
   */
  incomeDisclosed: boolean;
  sessionId: string | null;
  onRestart: () => void;
  onEdit: () => void;
}

const VIEW_LABEL: Record<CostView, string> = {
  recurring: "Chaque année",
  year1: "La 1ʳᵉ année",
};

/** Coût net d'un breakdown pour la vue active. */
function costForView(bd: CostBreakdown, view: CostView): number {
  return view === "year1"
    ? bd.netAnnualCostEur
    : bd.netAnnualCostWithoutBonusEur;
}

/** Économie vs situation actuelle pour la vue active (positif = moins cher). */
function savingsForView(
  current: CostBreakdown,
  bd: CostBreakdown,
  view: CostView,
): number {
  return (
    Math.round((costForView(current, view) - costForView(bd, view)) * 100) / 100
  );
}

/** Tri déterministe pour la vue active : coût de la vue, puis cotisation, puis nom. */
function sortForView(rows: RankedCard[], view: CostView): RankedCard[] {
  return [...rows].sort((a, b) => {
    const byCost = costForView(a.breakdown, view) - costForView(b.breakdown, view);
    if (byCost !== 0) return byCost;
    const byFee = a.card.annual_fee_eur - b.card.annual_fee_eur;
    if (byFee !== 0) return byFee;
    return a.card.name.localeCompare(b.card.name);
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "à vérifier";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function ResultsPreview({
  current,
  ranked,
  incomeDisclosed,
  sessionId,
  onRestart,
  onEdit,
}: ResultsPreviewProps) {
  // Vue récurrente par défaut : chiffre honnête qui n'est pas gonflé par une
  // prime de bienvenue non récurrente.
  const [view, setView] = useState<CostView>("recurring");

  const { eligible, ineligible } = useMemo(() => {
    const sorted = sortForView(ranked, view);
    // Sans revenu déclaré : pas de jugement d'éligibilité, tout dans le classement.
    if (!incomeDisclosed) return { eligible: sorted, ineligible: [] as RankedCard[] };
    return splitByEligibility(sorted);
  }, [ranked, view, incomeDisclosed]);

  const best = eligible[0] ?? null;
  const currentCost = costForView(current, view);

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <p className="text-sm font-medium text-indigo-600">
          Résultat de la simulation
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Voici votre information chiffrée
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">
          Une information objective, pas un conseil. Le classement est trié par
          coût, sans « recommandé pour vous ».
        </p>
      </header>

      {/* Bascule des deux vues de coût */}
      <ViewToggle view={view} onChange={setView} />

      {/* Hero — gain annuel honnête vs carte la moins chère */}
      {best && (
        <HeroGain
          view={view}
          currentCost={currentCost}
          best={best}
        />
      )}

      {!incomeDisclosed && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          Revenu non renseigné : toutes les cartes sont affichées sans
          vérification des conditions d&apos;accès. Certaines peuvent exiger un
          revenu minimum, indiqué sur la page de la banque.
        </p>
      )}

      {/* Classement des cartes accessibles */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {incomeDisclosed && ineligible.length > 0
              ? "Cartes accessibles avec votre revenu"
              : "Cartes triées par coût annuel"}
          </h3>
          <span className="shrink-0 text-xs text-slate-400">
            {VIEW_LABEL[view].toLowerCase()}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Classement établi objectivement selon le coût annuel (
          {view === "year1" ? "1ʳᵉ année, prime incluse" : "récurrent, hors prime"}
          ). Les liens affiliés n&apos;influencent pas cet ordre.
        </p>

        <ol className="space-y-3">
          {eligible.map((row, index) => (
            <RankedCardRow
              key={row.card.id}
              row={row}
              rank={index + 1}
              view={view}
              current={current}
              incomeDisclosed={incomeDisclosed}
              highlight={index === 0}
              sessionId={sessionId}
            />
          ))}
        </ol>
      </section>

      {/* Cartes non éligibles : regroupées à part, dégradées, jamais retirées */}
      {incomeDisclosed && ineligible.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-700">
            Cartes nécessitant un revenu plus élevé
          </h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Affichées en transparence : leur coût est calculé de la même façon,
            mais le revenu que vous avez indiqué ne remplit pas leurs conditions
            d&apos;accès annoncées.
          </p>
          <ol className="space-y-3">
            {ineligible.map((row) => (
              <RankedCardRow
                key={row.card.id}
                row={row}
                view={view}
                current={current}
                incomeDisclosed={incomeDisclosed}
                dimmed
                sessionId={sessionId}
              />
            ))}
          </ol>
        </section>
      )}

      {/* Capture email optionnelle, stockée séparément du profil */}
      <EmailCapture
        sessionId={sessionId}
        summary={{
          topCardName: best?.card.name,
          gainEur: best?.savingsVsCurrentEur,
          currentCostEur: current.netAnnualCostEur,
        }}
      />

      <div className="space-y-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Modifier mes réponses
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          Recommencer la simulation
        </button>
        <p className="pt-1 text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison. Ces résultats ne
          constituent ni un conseil personnalisé ni une recommandation de
          souscription. Pour toute décision, lisez les conditions générales de la
          banque et évaluez votre situation personnelle.
        </p>
      </div>
    </div>
  );
}

/** Bascule accessible entre les deux vues de coût. */
function ViewToggle({
  view,
  onChange,
}: {
  view: CostView;
  onChange: (v: CostView) => void;
}) {
  const options: CostView[] = ["recurring", "year1"];
  return (
    <div>
      <div
        role="tablist"
        aria-label="Vue de coût"
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
      >
        {options.map((opt) => {
          const active = view === opt;
          return (
            <button
              key={opt}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt)}
              className={[
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {VIEW_LABEL[opt]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-xs text-slate-500">
        {view === "recurring"
          ? "Coût que vous payez chaque année, hors prime de bienvenue (non récurrente)."
          : "Coût la 1ʳᵉ année, prime de bienvenue incluse au prorata."}
      </p>
    </div>
  );
}

/** Hero — situation actuelle vs carte la moins chère, gain honnête. */
function HeroGain({
  view,
  currentCost,
  best,
}: {
  view: CostView;
  currentCost: number;
  best: RankedCard;
}) {
  const bestCost = costForView(best.breakdown, view);
  const gain = Math.round((currentCost - bestCost) * 100) / 100;
  const improves = gain > 0;
  // Part de prime comptée uniquement en vue 1ʳᵉ année (non récurrente).
  const bonus = best.breakdown.welcomeBonusAmortizedEur;
  const bonusInYear1 = view === "year1" && bonus > 0;

  return (
    <section
      className={[
        "rounded-2xl border p-5",
        improves
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      {improves ? (
        <>
          <p className="text-sm text-slate-600">
            Écart avec la carte la moins chère du panel
          </p>
          <p className="mt-1 text-4xl font-bold text-emerald-700">
            {formatSignedEur(gain)}
            <span className="text-base font-semibold text-emerald-600"> / an</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Votre situation actuelle est estimée à{" "}
            <span className="font-semibold">{formatEur(currentCost)}/an</span>. La
            carte la moins chère, <span className="font-semibold">{best.card.name}</span>
            , ressort à <span className="font-semibold">{formatEur(bestCost)}/an</span>{" "}
            avec vos réponses.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Sur ce critère, aucune carte du panel ne fait mieux que votre
            situation actuelle
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatEur(currentCost)}/an aujourd&apos;hui
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            La moins chère du panel, {best.card.name}, ressort à{" "}
            {formatEur(bestCost)}/an. L&apos;écart n&apos;est pas en votre faveur
            selon les paramètres saisis.
          </p>
        </>
      )}
      {bonusInYear1 && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">
          Ce chiffre inclut {formatEur(bonus)} de prime de bienvenue amortie la
          1ʳᵉ année. Elle ne se répète pas : voyez « Chaque année » pour le coût
          récurrent.
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Estimation basée uniquement sur les fourchettes que vous avez saisies.
      </p>
    </section>
  );
}

function RankedCardRow({
  row,
  rank,
  view,
  current,
  incomeDisclosed,
  highlight = false,
  dimmed = false,
  sessionId,
}: {
  row: RankedCard;
  rank?: number;
  view: CostView;
  current: CostBreakdown;
  incomeDisclosed: boolean;
  highlight?: boolean;
  dimmed?: boolean;
  sessionId: string | null;
}) {
  const { card, breakdown, eligible } = row;
  // Offre affichable uniquement pour les vraies cartes (pas les références).
  const hasOffer =
    card.affiliate.network != null && !!card.source_url?.startsWith("http");
  const shownCost = costForView(breakdown, view);
  const otherView: CostView = view === "year1" ? "recurring" : "year1";
  const otherCost = costForView(breakdown, otherView);
  const saving = savingsForView(current, breakdown, view);
  const rewards = shownCost < 0;

  const savingLabel = saving > 0 ? "Économie" : saving < 0 ? "Surcoût" : "Équivalent";
  const savingClass = saving > 0 ? "text-emerald-600" : "text-slate-500";

  return (
    <li
      className={[
        "overflow-hidden rounded-2xl border bg-white",
        highlight ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200",
        dimmed ? "opacity-75" : "",
      ].join(" ")}
    >
      {highlight && (
        <p className="bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
          Coût annuel le plus bas du panel
        </p>
      )}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 gap-3">
          <MiniCard tone={toneForTier(card.tier)} className="mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {rank != null ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {rank}
                </span>
              ) : (
                <span className="flex h-6 shrink-0 items-center rounded-full bg-amber-100 px-2 text-[11px] font-semibold text-amber-700">
                  revenu requis
                </span>
              )}
              <p className="line-clamp-2 font-semibold text-slate-900">{card.name}</p>
            </div>
            <p className="mt-0.5 pl-8 text-sm text-slate-500">{card.issuer}</p>
            {incomeDisclosed && !eligible && card.min_monthly_income_eur != null && (
              <p className="mt-1 pl-8 text-xs font-medium text-amber-600">
                Revenu requis annoncé : ≥ {formatEur(card.min_monthly_income_eur)}/mois.
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-slate-900">
            {formatEur(shownCost)}
            <span className="text-xs font-normal text-slate-500"> / an</span>
          </p>
          {/* Deux vues de coût toujours visibles */}
          <p className="text-xs text-slate-400">
            {VIEW_LABEL[otherView]} : {formatEur(otherCost)}
          </p>
          {rewards && (
            <p className="text-xs font-medium text-emerald-600">
              la carte vous rapporte
            </p>
          )}
          <p className={`text-xs font-medium ${savingClass}`}>
            {savingLabel} vs actuel {formatSignedEur(saving)}
          </p>
        </div>
      </div>

      {/* Détail du calcul, déplié à la demande (transparence) */}
      <details className="group border-t border-slate-100 bg-slate-50/60">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-indigo-600 marker:content-['']">
          <span>Voir le détail du calcul</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="h-4 w-4 transition-transform group-open:rotate-180"
          >
            <path
              fillRule="evenodd"
              d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z"
              clipRule="evenodd"
            />
          </svg>
        </summary>
        <div className="space-y-3 px-4 pb-4">
          <dl className="space-y-1.5 text-sm">
            <Line label="Cotisation annuelle" value={breakdown.annualFeeEur} />
            <Line label="Frais de change estimés" value={breakdown.fxFeeEur} />
            <Line
              label="Frais de retrait étranger estimés"
              value={breakdown.foreignWithdrawalFeeEur}
            />
            <Line
              label={`Prime de bienvenue (amortie ${breakdown.assumptions.welcomeBonusAmortizationYears} ans)`}
              value={-breakdown.welcomeBonusAmortizedEur}
            />
            {breakdown.cashbackValueEur > 0 && (
              <Line label="Cashback estimé" value={-breakdown.cashbackValueEur} />
            )}
            {breakdown.rewardsValueEur > 0 && (
              <Line label="Miles / points estimés" value={-breakdown.rewardsValueEur} />
            )}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
              <dt>Coût net la 1ʳᵉ année</dt>
              <dd>{formatEurCents(breakdown.netAnnualCostEur)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Coût net récurrent (hors prime)</dt>
              <dd>{formatEurCents(breakdown.netAnnualCostWithoutBonusEur)}</dd>
            </div>
          </dl>

          {/* Composition du coût brut (P6) : d'où vient la dépense */}
          {breakdown.grossCostEur > 0 && (
            <CompositionBar shares={costComposition(breakdown)} />
          )}
        </div>
      </details>

      {/* Transparence affiliée : commission affichée en clair */}
      {card.affiliate.network && card.affiliate.est_commission_eur > 0 && (
        <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          Lien affilié — commission estimée versée à CB180 :{" "}
          <span className="font-medium text-slate-700">
            {formatEur(card.affiliate.est_commission_eur)}
          </span>
          . N&apos;influence pas le classement.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <div className="text-xs text-slate-500">
          Dernière vérification : {formatDate(card.last_verified)}
        </div>
        {hasOffer && (
          <a
            href={`/go/${card.id}?from=results${
              sessionId ? `&sid=${encodeURIComponent(sessionId)}` : ""
            }`}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Voir l&apos;offre
          </a>
        )}
      </div>
    </li>
  );
}

/** Barre de composition du coût brut (cotisation / change / retrait). */
function CompositionBar({ shares }: { shares: CostShare[] }) {
  const POST_LABEL: Record<CostShare["post"], string> = {
    cotisation: "Cotisation",
    change: "Change",
    retrait: "Retrait",
  };
  const POST_COLOR: Record<CostShare["post"], string> = {
    cotisation: "bg-slate-400",
    change: "bg-indigo-500",
    retrait: "bg-amber-500",
  };
  const visible = shares.filter((s) => s.amountEur > 0);
  if (visible.length === 0) return null;
  const top = visible[0];

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-500">
        Poste principal : {POST_LABEL[top.post].toLowerCase()} (
        {Math.round(top.share * 100)} % du coût brut)
      </p>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
        {visible.map((s) => (
          <div
            key={s.post}
            className={POST_COLOR[s.post]}
            style={{ width: `${Math.round(s.share * 100)}%` }}
            aria-hidden
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        {visible.map((s) => (
          <li key={s.post} className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${POST_COLOR[s.post]}`}
              aria-hidden
            />
            {POST_LABEL[s.post]} {formatEur(s.amountEur)}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface EmailSummary {
  topCardName?: string;
  gainEur?: number;
  currentCostEur?: number;
}

function EmailCapture({
  sessionId,
  summary,
}: {
  sessionId: string | null;
  summary: EmailSummary;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [sent, setSent] = useState(false);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email, consent, summary }),
      });
      const data = await res.json().catch(() => ({}));
      setSent(Boolean(data?.sent));
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-medium text-emerald-800">
          {sent
            ? "C'est envoyé ! Consultez votre boîte mail (pensez aux spams)."
            : "C'est noté. Votre adresse est enregistrée, et vous serez prévenu si une carte moins chère apparaît."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">
        Recevoir ce résultat par email
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Facultatif, après votre résultat. Votre email est stocké séparément de
        vos réponses, et sert aussi à vous prévenir si une carte moins chère
        apparaît.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        />
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600"
          />
          <span>
            J&apos;accepte de recevoir occasionnellement des informations de
            CB180 (facultatif, désinscription à tout moment).
          </span>
        </label>
        <button
          type="submit"
          disabled={!emailValid || status === "sending"}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {status === "sending" ? "Envoi…" : "Recevoir mon résultat"}
        </button>
        {status === "error" && (
          <p className="text-xs text-amber-600">
            L&apos;envoi n&apos;a pas abouti. Réessayez dans un instant.
          </p>
        )}
      </form>
    </section>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  const negative = value < 0;
  return (
    <div className="flex justify-between text-slate-600">
      <dt>{label}</dt>
      <dd className={negative ? "text-emerald-600" : ""}>
        {negative ? "−" : ""}
        {formatEurCents(Math.abs(value))}
      </dd>
    </div>
  );
}
