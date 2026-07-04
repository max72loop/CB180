// lib/types.ts
// Types partagés CB180 : aucune dépendance à React.
// Le moteur (lib/engine.ts) ne consomme QUE ces types.

/** Gamme de la carte. */
export type CardTier = "entree" | "intermediaire" | "premium" | "haut_de_gamme";

/** Niveau d'assurances/assistance associé à la carte. */
export type InsurancesLevel = "none" | "basique" | "premier_gold" | "elite";

/** Bloc affiliation. La commission est affichée en clair côté UI (transparence). */
export interface CardAffiliate {
  network: string | null;
  est_commission_eur: number;
  status?: string;
  /**
   * Lien de tracking affilié (Awin, Kwanko…). Quand il est renseigné, la route
   * /go/[carte] y redirige ; sinon elle retombe sur `source_url` (page officielle).
   * À remplir une fois la candidature au programme acceptée.
   */
  url?: string;
}

/**
 * Schéma de carte.
 *
 * Les champs "métier" ci-dessous correspondent au schéma fourni : ils sont
 * la source d'affichage. Les politiques de retrait/cashback y sont en TEXTE
 * LIBRE, non calculable.
 *
 * Les champs suffixés d'un commentaire "[moteur]" sont des dérivés numériques
 * OPTIONNELS de ces politiques, ajoutés uniquement pour rendre le calcul
 * déterministe et testable. Ils n'ont pas vocation à être affichés bruts ;
 * `foreign_withdrawal` / `cashback` restent les textes de référence pour l'UI.
 */
export interface Card {
  id: string;
  name: string;
  issuer: string;
  network: string;
  tier: CardTier;
  monthly_fee_eur: number | null;
  annual_fee_eur: number;
  free_condition: string | null;
  /** Frais de change hors zone euro, en % (ex. 1.69). */
  fx_fee_percent: number;
  /** Politique de retrait à l'étranger, texte libre, source d'affichage. */
  foreign_withdrawal: string;
  insurances_level: InsurancesLevel;
  cashback: string | null;
  miles_program: string | null;
  welcome_bonus_eur: number;
  affiliate: CardAffiliate;
  target_profiles: string[];
  last_verified: string | null;
  source_url: string;
  to_verify?: boolean;
  verif_note?: string;
  /**
   * Chemin d'une image officielle de la carte, servie depuis /public
   * (ex. "/cartes/revolut-standard.webp"). Fournie via les kits d'affiliation
   * (Awin/Kwanko) sous licence. Si absente, un visuel rendu fidèle à la marque
   * (lib/card-brand.ts) est affiché à la place.
   */
  image?: string;

  // --- Dérivés numériques pour le moteur (optionnels) ---
  /** [moteur] Frais % appliqué à un retrait étranger facturé. Défaut 0. */
  foreign_withdrawal_fee_percent?: number;
  /** [moteur] Frais fixe par retrait étranger facturé, en €. Défaut 0. */
  foreign_withdrawal_flat_eur?: number;
  /** [moteur] Nombre de retraits étrangers gratuits par mois. Défaut 0. */
  free_foreign_withdrawals_per_month?: number;
  /** [moteur] Taux de cashback effectif en % sur les dépenses éligibles. Défaut 0. */
  cashback_rate_percent?: number;
  /** [moteur] Plafond annuel de cashback en €. null = illimité. */
  cashback_cap_eur?: number | null;
  /** [moteur] Revenu mensuel net minimum requis, en €. null = aucune condition. */
  min_monthly_income_eur?: number | null;

  // --- Récompenses miles/points (P2), dérivés à vérifier comme les autres ---
  /** [moteur] Points/miles gagnés par euro dépensé. Défaut 0. */
  points_per_euro?: number;
  /** [moteur] Valeur en € d'un point/mile. Défaut 0. */
  point_value_eur?: number;
  /** [moteur] Source et date des valeurs de récompense (traçabilité). */
  rewards_source?: string;
}

/** Profil type déclaré par l'utilisateur (usage informatif, non prescriptif). */
export type ProfileType =
  | "petit_budget_sedentaire"
  | "voyageur_regulier"
  | "gros_depensier_optimiseur"
  | "jeune_actif"
  | "autre";

/**
 * Profil d'usage NORMALISÉ consommé par le moteur.
 *
 * Le questionnaire collecte des fourchettes ; la couche de mapping
 * (à venir avec l'UI) traduit chaque fourchette en une valeur représentative
 * numérique avant d'appeler le moteur. Le moteur ne voit jamais de fourchette.
 */
export interface UsageProfile {
  /** Dépenses mensuelles totales représentatives, en €. */
  monthlySpendingEur: number;
  /** Part des dépenses hors zone euro, ratio 0..1. */
  foreignSpendingShare: number;
  /** Nombre de voyages hors Europe par an (signal, non monétisé directement). */
  travelOutsideEuropePerYear: number;
  /** Nombre de retraits à l'étranger par mois. */
  foreignWithdrawalsPerMonth: number;
  /** Cotisation annuelle actuellement payée par l'utilisateur, en €. */
  currentAnnualFeeEur: number;
  /** L'utilisateur déclare un intérêt pour les miles / le cashback. */
  valuesRewards: boolean;
  /** Revenu mensuel net représentatif, en € (sert au filtre d'éligibilité). */
  monthlyIncomeEur: number;
  profileType: ProfileType;
}

/** Hypothèses de calcul, explicites et surchargées. */
export interface EngineAssumptions {
  /** Montant moyen supposé d'un retrait à l'étranger, en € (P5, paramétrable). */
  averageForeignWithdrawalEur: number;
  /** Horizon d'amortissement de la prime de bienvenue, en années (P1, défaut 3). */
  welcomeBonusAmortizationYears: number;
  /** Facteur de réalisme des récompenses (points expirés/non utilisés), 0..1 (P2). */
  rewardsRealizationFactor: number;
}

/** Détail chiffré du calcul pour une carte (transparence radicale). */
export interface CostBreakdown {
  cardId: string;
  /** Cotisation annuelle. */
  annualFeeEur: number;
  /** Frais de change estimés sur les dépenses hors zone euro. */
  fxFeeEur: number;
  /** Frais de retrait étranger estimés. */
  foreignWithdrawalFeeEur: number;
  /** Somme des postes de COÛT avant déductions (cotisation + change + retrait). */
  grossCostEur: number;
  /** Valeur amortie de la prime de bienvenue (déduite). */
  welcomeBonusAmortizedEur: number;
  /** Valeur estimée du cashback (déduite). */
  cashbackValueEur: number;
  /** Valeur estimée des miles/points (déduite, uniquement si valuesRewards). */
  rewardsValueEur: number;
  /**
   * Coût annuel NET, vue « année 1 » (prime incluse au prorata), clé de tri.
   * = coût brut − prime amortie − cashback − récompenses.
   */
  netAnnualCostEur: number;
  /** Coût annuel NET, vue « vitesse de croisière » (sans prime de bienvenue). */
  netAnnualCostWithoutBonusEur: number;
  /** Hypothèses utilisées pour ce calcul. */
  assumptions: EngineAssumptions;
  /** Entrées dérivées, exposées pour l'explicabilité. */
  inputs: {
    annualSpendingEur: number;
    foreignAnnualSpendingEur: number;
    foreignWithdrawalsPerYear: number;
  };
}

/** Poids d'un poste de coût dans le coût brut (P6, pour l'explication lisible). */
export interface CostShare {
  post: "cotisation" | "change" | "retrait";
  amountEur: number;
  /** Part du poste dans le coût brut, 0..1. */
  share: number;
}

/** Ligne de classement objective. */
export interface RankedCard {
  card: Card;
  breakdown: CostBreakdown;
  /** Éligibilité au regard du revenu déclaré (true si condition inconnue). */
  eligible: boolean;
  /** Économie annuelle vs situation actuelle : positif = carte moins chère. */
  savingsVsCurrentEur: number;
}
