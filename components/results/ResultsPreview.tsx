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
//  4. Caractère affilié des liens indiqué (sans montant) + composition du coût (costComposition).
//
// L'audit est déjà enregistré par le parent (fire-and-forget). Ici : capture email
// (stockage séparé du profil) et event de clic affilié.

import { useEffect, useMemo, useState } from "react";
import { costComposition, splitByEligibility } from "@/lib/engine";
import { distinguishingFeatures } from "@/lib/card-features";
import { MiniCard } from "@/components/brand/CardVisual";
import PriceAlertSignup from "@/components/marketing/PriceAlertSignup";
import ShareResult from "@/components/results/ShareResult";
import TiebreakByFeatures from "@/components/results/TiebreakByFeatures";
import { shareCompoFromBreakdown } from "@/lib/share";
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
   * P5, false si l'utilisateur a choisi de ne pas renseigner son revenu :
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

/** Intitulés et couleurs des postes de coût, partagés révélation ⇄ détail. */
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
  // prime de bienvenue non récurrente. La bascule ne pilote QUE le classement
  // détaillé (acte 3) ; la révélation (actes 1-2) reste sur le récurrent, stable.
  const [view, setView] = useState<CostView>("recurring");
  // Dévoilement progressif du classement : d'abord les premières cartes.
  const [showAllCards, setShowAllCards] = useState(false);

  const { eligible, ineligible } = useMemo(() => {
    const sorted = sortForView(ranked, view);
    // Sans revenu déclaré : pas de jugement d'éligibilité, tout dans le classement.
    if (!incomeDisclosed) return { eligible: sorted, ineligible: [] as RankedCard[] };
    return splitByEligibility(sorted);
  }, [ranked, view, incomeDisclosed]);

  // Carte de référence de la RÉVÉLATION : la moins chère en récurrent, choisie
  // indépendamment de la bascule pour que le grand chiffre ne bouge pas quand on
  // explore les vues du tableau.
  const bestRecurring = useMemo(() => {
    const pool = incomeDisclosed ? ranked.filter((r) => r.eligible) : ranked;
    return (
      [...pool].sort(
        (a, b) =>
          a.breakdown.netAnnualCostWithoutBonusEur -
          b.breakdown.netAnnualCostWithoutBonusEur,
      )[0] ?? null
    );
  }, [ranked, incomeDisclosed]);

  const INITIAL_VISIBLE = 3;
  const visibleEligible = showAllCards
    ? eligible
    : eligible.slice(0, INITIAL_VISIBLE);
  const hiddenCount = eligible.length - visibleEligible.length;

  // Départage : cartes ACCESSIBLES à coût récurrent le plus bas, à égalité (≥ 2).
  // Ancré sur le récurrent (hors prime), indépendant de la bascule de vue, pour
  // rester cohérent avec la révélation. Le coût ne tranche plus → on proposera de
  // départager sur les fonctionnalités qui les différencient réellement.
  const tiedTop = useMemo(() => {
    if (eligible.length < 2) return [] as RankedCard[];
    const byRecurring = [...eligible].sort(
      (a, b) =>
        a.breakdown.netAnnualCostWithoutBonusEur -
        b.breakdown.netAnnualCostWithoutBonusEur,
    );
    const minCents = Math.round(
      byRecurring[0].breakdown.netAnnualCostWithoutBonusEur * 100,
    );
    return byRecurring.filter(
      (r) => Math.round(r.breakdown.netAnnualCostWithoutBonusEur * 100) === minCents,
    );
  }, [eligible]);

  // On ne montre le départage que s'il y a une vraie égalité ET au moins une
  // fonctionnalité qui sépare ces cartes (sinon aucune case n'aurait d'effet).
  const showTiebreak =
    tiedTop.length >= 2 &&
    distinguishingFeatures(tiedTop.map((r) => r.card)).length > 0;
  const tiedCostEur = tiedTop[0]?.breakdown.netAnnualCostWithoutBonusEur ?? 0;

  return (
    <div className="space-y-8">
      {/* ─── Actes 1 & 2 : la révélation (grand chiffre + décomposition) ─── */}
      {bestRecurring && (
        <Reveal current={current} best={bestRecurring} sessionId={sessionId} />
      )}

      {/* Le détail garde une largeur de lecture confortable sous la révélation. */}
      <div className="mx-auto w-full max-w-2xl space-y-8">
      {!incomeDisclosed && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          Revenu non renseigné : toutes les cartes sont affichées sans
          vérification des conditions d&apos;accès. Certaines peuvent exiger un
          revenu minimum, indiqué sur la page de la banque.
        </p>
      )}

      {/* ─── Acte 3 : le classement détaillé, en dévoilement progressif ─── */}
      <section className="space-y-4 border-t border-slate-200 pt-7">
        <div className="space-y-1">
          <p className="text-sm font-medium text-indigo-600">
            Le détail, poste par poste
          </p>
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
            Trié par coût{" "}
            {view === "year1" ? "(1ʳᵉ année, prime incluse)" : "(récurrent, hors prime)"}.
            Certains liens sont affiliés et n&apos;influencent pas cet ordre.
          </p>
        </div>

        {/* Bascule des deux vues de coût : pilote le tri du tableau. */}
        <ViewToggle view={view} onChange={setView} />

        <ol className="space-y-3">
          {visibleEligible.map((row, index) => (
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

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllCards(true)}
            className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Voir les {hiddenCount} autres cartes du panel
          </button>
        )}
      </section>

      {/* Départage sur fonctionnalités quand le coût ne tranche plus (ex æquo). */}
      {showTiebreak && (
        <TiebreakByFeatures cards={tiedTop} costEur={tiedCostEur} />
      )}

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
          topCardName: bestRecurring?.card.name,
          gainEur: bestRecurring?.savingsVsCurrentEur,
          currentCostEur: current.netAnnualCostEur,
        }}
      />

      {/* Rétention : l'alerte tarifaire, mécanisme de ré-engagement, promue au
          moment du résultat plutôt qu'enfouie ailleurs (audit, chantier 05). */}
      {bestRecurring && (
        <section className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-600">
            La mieux placée aujourd&apos;hui selon vos réponses&nbsp;:{" "}
            <span className="font-semibold text-slate-900">
              {bestRecurring.card.name}
            </span>
            . Mais les cotisations et frais changent chaque année. On garde
            l&apos;œil pour vous.
          </p>
          <PriceAlertSignup card={bestRecurring.card} source="results" />
        </section>
      )}

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

/** Détecte la préférence système « animations réduites » (accessibilité). */
function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

/** Compteur animé 0 → target (easeOutCubic), instantané si motion réduite. */
function useCountUp(target: number, durationMs = 1100): number {
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduce]);
  return value;
}

/**
 * La révélation, en deux temps forts.
 *  · Acte 1 : un seul grand chiffre animé — « vous pourriez économiser X €/an ».
 *  · Acte 2 : la décomposition poste par poste (barres empilées comparées).
 * Toujours en vue récurrente : le chiffre honnête, jamais gonflé par une prime
 * de bienvenue non récurrente. Wording IOBSP : un écart chiffré conditionnel,
 * jamais « recommandé pour vous ».
 */
function Reveal({
  current,
  best,
  sessionId,
}: {
  current: CostBreakdown;
  best: RankedCard;
  sessionId: string | null;
}) {
  const currentCost = current.netAnnualCostWithoutBonusEur;
  const bestCost = best.breakdown.netAnnualCostWithoutBonusEur;
  const gain = Math.round((currentCost - bestCost) * 100) / 100;
  const improves = gain > 0;
  const counted = useCountUp(improves ? gain : currentCost);

  return (
    <div
      className={
        improves
          ? "space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0"
          : "space-y-6"
      }
    >
      {/* ─ Acte 1 : le grand chiffre, au-dessus de la ligne de flottaison ─ */}
      <section
        className={[
          "animate-step flex flex-col justify-center overflow-hidden rounded-3xl border p-6 text-center md:p-8",
          improves
            ? "border-emerald-200 bg-gradient-to-b from-emerald-50 to-white"
            : "border-slate-200 bg-slate-50",
        ].join(" ")}
      >
        <p className="text-sm font-medium text-slate-500">
          Résultat de votre simulation
        </p>
        {improves ? (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Vous pourriez économiser
            </p>
            <p className="mt-1 text-6xl font-extrabold tracking-tight text-emerald-600 tabular-nums md:text-7xl">
              {formatEur(Math.round(counted))}
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-700">par an</p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              En passant de votre carte actuelle (
              <span className="font-semibold text-slate-800">
                {formatEur(currentCost)}/an
              </span>
              ) à la moins chère du panel,{" "}
              <span className="font-semibold text-slate-800">{best.card.name}</span>{" "}
              ({formatEur(bestCost)}/an), selon vos réponses.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Votre carte est déjà bien placée
            </p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums md:text-6xl">
              {formatEur(Math.round(counted))}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-500">par an</p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Aucune carte du panel ne fait mieux que votre situation actuelle
              selon vos réponses. La moins chère,{" "}
              <span className="font-semibold text-slate-800">{best.card.name}</span>
              , ressort à {formatEur(bestCost)}/an.
            </p>
          </>
        )}

        <p className="mx-auto mt-4 max-w-sm text-xs text-slate-400">
          Estimation fondée sur les fourchettes que vous avez saisies.
        </p>

        {/* Boucle virale : le chiffre est le contenu de partage (audit, chantier 05) */}
        {improves && (
          <div className="mt-5 border-t border-emerald-200 pt-5">
            <ShareResult
              gainEur={gain}
              composition={shareCompoFromBreakdown(current)}
              sessionId={sessionId}
            />
          </div>
        )}
      </section>

      {/* ─ Acte 2 : la décomposition poste par poste ─ */}
      {improves && <ComparisonBars current={current} best={best} />}
    </div>
  );
}

/**
 * Acte 2 : deux barres empilées (votre carte actuelle vs la moins chère),
 * décomposées poste par poste (cotisation, change, retrait) à la MÊME échelle,
 * pour rendre l'écart visible d'un coup d'œil avant le tableau détaillé.
 */
function ComparisonBars({
  current,
  best,
}: {
  current: CostBreakdown;
  best: RankedCard;
}) {
  const maxGross = Math.max(current.grossCostEur, best.breakdown.grossCostEur, 1);
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">
          D&apos;où vient l&apos;écart
        </h3>
        <p className="text-xs leading-relaxed text-slate-500">
          Décomposition poste par poste, à la même échelle. Le montant affiché est
          le coût net annuel, primes et cashback déduits.
        </p>
      </div>

      <div className="space-y-4">
        <CompareRow
          label="Votre carte actuelle"
          net={current.netAnnualCostWithoutBonusEur}
          shares={costComposition(current)}
          maxGross={maxGross}
        />
        <CompareRow
          label={best.card.name}
          accent
          net={best.breakdown.netAnnualCostWithoutBonusEur}
          shares={costComposition(best.breakdown)}
          maxGross={maxGross}
        />
      </div>

      {/* Légende commune des postes. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {(["cotisation", "change", "retrait"] as CostShare["post"][]).map((p) => (
          <li key={p} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${POST_COLOR[p]}`}
              aria-hidden
            />
            {POST_LABEL[p]}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Une ligne de comparaison : intitulé, coût net, barre empilée à l'échelle. */
function CompareRow({
  label,
  net,
  shares,
  maxGross,
  accent = false,
}: {
  label: string;
  net: number;
  shares: CostShare[];
  maxGross: number;
  accent?: boolean;
}) {
  const visible = shares.filter((s) => s.amountEur > 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={
            accent
              ? "truncate text-sm font-semibold text-slate-900"
              : "truncate text-sm font-medium text-slate-600"
          }
        >
          {label}
        </span>
        <span className="shrink-0 text-sm font-bold text-slate-900 tabular-nums">
          {formatEur(net)}
          <span className="text-xs font-normal text-slate-500"> / an</span>
        </span>
      </div>
      <div className="mt-1.5 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
        {visible.map((s) => (
          <div
            key={s.post}
            className={POST_COLOR[s.post]}
            style={{ width: `${(s.amountEur / maxGross) * 100}%` }}
            title={`${POST_LABEL[s.post]} ${formatEur(s.amountEur)}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
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

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <div className="text-xs text-slate-500">
          Vérifié : {formatDate(card.last_verified)}
          {/* Caractère affilié indiqué une fois, au plus près du lien (compact). */}
          {card.affiliate.network && " · lien affilié"}
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
