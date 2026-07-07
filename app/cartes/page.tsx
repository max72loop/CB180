// app/cartes/page.tsx
// Index SEO des cartes : une grille de fiches vers /cartes/[id]. Généré depuis
// le catalogue vérifié. Page serveur (statique), indexable.

import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { ProductCardVisual } from "@/components/brand/CardVisual";
import CardsExplorer, { type CardListItem } from "@/components/cartes/CardsExplorer";
import { publicCards } from "@/lib/cards";
import { feeLabel, verifiedDate } from "@/lib/card-display";
import { featureHighlights } from "@/lib/card-features";
import { buildCompareData } from "@/lib/card-compare";
import { cardBadges } from "@/lib/card-badges";
import { computeAnnualCost } from "@/lib/engine";
import { USAGE_SCENARIOS } from "@/lib/scenarios";

export const metadata: Metadata = {
  title: "Cartes bancaires comparées",
  description:
    "Les cartes bancaires françaises passées au crible : cotisation, frais de change, retraits à l'étranger et conditions, sur données officielles vérifiées. Information objective, sans conseil.",
  alternates: { canonical: "/cartes" },
};

export default function CartesIndex() {
  // Données de chaque carte, chiffrées côté serveur (SSG) : fourchette de coût
  // réel net sur les 3 scénarios d'usage, atouts de fonctionnalités et drapeaux
  // de filtre. Le visuel est rendu ici et passé à l'île client (SEO préservé).
  const items: CardListItem[] = publicCards().map((card) => {
    const nets = USAGE_SCENARIOS.map(
      (s) => computeAnnualCost(card, s.profile).netAnnualCostEur,
    );
    // Plancher à 0 : un coût net négatif (« la carte rapporte ») s'affiche 0 €.
    const minCost = Math.max(0, Math.round(Math.min(...nets)));
    const maxCost = Math.max(0, Math.round(Math.max(...nets)));
    const debit = card.features?.debitType;
    return {
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      fee: feeLabel(card),
      minCost,
      maxCost,
      verified: verifiedDate(card),
      highlights: featureHighlights(card, 2),
      isFree: card.annual_fee_eur === 0,
      zeroFx: card.fx_fee_percent === 0,
      noIncomeCondition: card.min_monthly_income_eur == null,
      deferredDebit: debit === "differe" || debit === "choix",
      badges: cardBadges(card),
      compare: buildCompareData(card),
      visual: <ProductCardVisual card={card} className="w-full" />,
    };
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">
            Le catalogue
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Les cartes bancaires, passées au crible
          </h1>
          <p className="mt-4 text-slate-600">
            Cotisation, frais de change, retraits à l&apos;étranger et conditions
            : sur documents tarifaires officiels. Une information factuelle, pas
            un conseil. Pour chiffrer le coût selon <em>vos</em> usages, lancez le
            simulateur.
          </p>
          <Link
            href="/simulateur"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5"
          >
            Lancer la simulation, gratuit
          </Link>
        </header>

        <CardsExplorer items={items} />

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-slate-500">
          CB180 est un site d&apos;information et de comparaison. Ces fiches ne
          constituent ni un conseil personnalisé ni une recommandation de
          souscription. Certains liens sont affiliés et n&apos;influencent pas le
          classement. Les informations proviennent des documents tarifaires
          publics des établissements.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
