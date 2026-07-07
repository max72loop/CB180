# CB180 — Extension aux segments « Comptes Joints » et « Micro-pro »
### Analyse stratégique & technique — ancrée sur le code réel du repo

> Rédigé après lecture de `lib/engine.ts`, `lib/types.ts`, `lib/answers.ts`, `lib/affiliate.ts`, `schema.sql`.
> Stack constaté : **Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 · Turso/libSQL · Vitest · Vercel**.
> Boucle d'affiliation **déjà en prod** : `clicks` → sub-id (Impact/Partnerize/Awin) → postback S2S → `conversions`.

---

## 0. Note de synthèse exécutive (1 page)

**Le constat qui change tout.** CB180 n'est pas « un comparateur de cartes ». C'est un **moteur de coût annuel net pur + une boucle d'attribution affiliée S2S fonctionnelle**. Le moteur ne sait comparer qu'un objet à formule unique (cotisation + change + retrait − prime − cashback). La boucle d'attribution, elle, est **agnostique au produit** : elle attribue un revenu à un clic quel que soit ce qui est vendu derrière. C'est cet actif-là, pas le catalogue de cartes, qui justifie l'extension.

**Pourquoi foncer — mais sur UN segment.**
- **Le Pro est le levier de rentabilité, de loin.** Un compte pro affilié (Qonto, Shine, Revolut Business) paie **50–120 € de CPA** contre **5–40 €** pour une carte grand public — soit **3 à 8×**. L'intention est plus forte (ouvrir un compte pro est une obligation quasi-légale au-delà d'un seuil de CA, pas un arbitrage de confort), et le segment est **mal servi par des comparateurs indépendants** : la SERP est saturée de contenus affiliés déguisés (Indy, Legalstart, blogs) mais aucun n'applique une **formule de coût net transparente**. C'est exactement l'angle CB180.
- **Le Joint est un piège rentabilité.** Il n'existe **quasi aucun programme d'affiliation « compte joint »** : le compte joint est une *fonctionnalité* d'un compte courant, pas un produit vendu à part. Monétiser le joint = revendre de l'affiliation carte/compte classique avec un habillage « couple ». Faible uplift de commission, forte complexité de formule (asymétrie d'usage entre cotitulaires), risque de diluer le positionnement. **À traiter en contenu SEO d'acquisition, pas en tunnel affilié dédié.**

**Pourquoi ne pas foncer tête baissée.**
1. **Rupture de comparabilité.** Le pro empile des dimensions non réductibles à un coût (facturation, compta, intégration URSSAF, support humain, encaissement de chèques). Forcer un tri mono-critère « coût net » sur le pro serait **malhonnête** — c'est le premier pilier de CB180 qui craque. Il faut un critère dérivé **borné et explicite** (coût net *à périmètre de services équivalent*), affiché en **fourchette**, jamais en chiffre unique (le coût d'un freelance varie ×10 selon son CA et son usage encaissement).
2. **Risque de positionnement.** « Comparateur qui ne vend aucune carte » vs pousser un abonnement à 29 €/mois : la promesse tient **si et seulement si** le classement reste piloté par le coût, pas par la commission, et que le lien reste étiqueté. Le pro rend ce garde-fou plus visible, donc plus fragile. À surveiller.
3. **Affiliation pro capricieuse.** Programmes fermés/sur validation, cookies courts, CPA conditionné à un compte *approvisionné* (funded), pas juste ouvert. Prévoir un **modèle hybride** dès le départ : affiliation + lead qualifié + contenu labélisé.

**Les 3 inconnues majeures (détaillées §2).**
- Les CPA réels et conditions des programmes pro (Qonto, Shine, Revolut Business) — **à confirmer par candidature**, pas déductibles.
- L'existence d'un différentiel de conversion pro assez fort pour compenser un trafic pro plus cher/plus rare à acquérir en SEO.
- La capacité à modéliser un coût pro **honnête en fourchette** sans transformer le simulateur en usine à gaz (le pro a 6–8 composantes vs 5 pour le particulier).

**Recommandation.** MVP **Pro-only**, en **sous-répertoire** `/pro` (pas de sous-domaine), en **réutilisant le moteur existant élargi par un champ `segment`** (pas de refonte). Joint = **3 guides SEO** branchés sur le catalogue particulier existant, **zéro nouveau tunnel**. Décision Go/No-Go conditionnée à **2 candidatures d'affiliation acceptées** (Qonto + un challenger) avant d'écrire la moindre ligne de tunnel.

---

## 1. Cadrage stratégique

### 1.1 Pourquoi « levier de rentabilité »

| Axe | Micro-pro | Compte joint |
|---|---|---|
| **Valeur unitaire (CPA)** | **50–120 €**/compte funded (Qonto/Shine/Revolut Business) — *à confirmer* | 5–40 € (= carte classique ; pas de produit « joint » affiliable) |
| **Intensité du besoin** | Forte : ouvrir un compte dédié est quasi-obligatoire (séparation des flux, seuil URSSAF), douleur = temps perdu + rejet bancaire | Moyenne : optimisation de confort, inertie forte des couples |
| **Conversion attendue** | Élevée : intention transactionnelle (« ouvrir un compte pro ») en fin de tunnel | Basse : décision à deux, cycle long, un seul cotitulaire clique |
| **Profondeur d'offre** | 10–14 produits réellement comparables (néobanques pro + offres pro banques) | Faible : ~aucune offre « joint » différenciée à comparer sur le coût |
| **Barrière à l'entrée / sous-service** | **Oui** : pas de comparateur indépendant à formule transparente ; SERP = affiliation déguisée | Non : sujet ultra-couvert par forums/banques, peu monétisable |

**Verdict :** le Pro coche les 5 axes, le Joint en coche 1,5. Le Joint reste utile en **acquisition SEO** (volume de recherche « meilleure carte compte joint », « compte joint en ligne gratuit ») qui **renvoie vers le catalogue particulier existant** — donc rentabilisé sans investissement produit.

### 1.2 Marché adressable France (2024-2026) — ordres de grandeur, à sourcer avant décision

- **Micro-pro :** ~2,6 M auto-entrepreneurs administrativement actifs (URSSAF/ACOSS fin 2023), dont ~la moitié économiquement actifs ; ~4 M d'indépendants tous statuts. Flux d'entrée : plusieurs centaines de milliers de créations/an (INSEE « créations d'entreprises », dont la majorité en micro). Équipement en compte pro dédié : **en croissance forte** sous pression de l'obligation (compte dédié obligatoire au-delà de 10 000 € de CA deux années de suite pour un micro-entrepreneur).
  - **Dominants :** Qonto (leader néobanque pro FR/EU), Shine (groupe Société Générale), Propulse by CA / Blank (Crédit Agricole).
  - **Challengers :** Indy (ex-Georges, angle compta/déclaration), Revolut Business, Anytime, Finom, Hero, Sumeria/Lydia Pro.
- **Comptes joints :** la quasi-totalité des couples cohabitants disposent d'un compte joint ou envisagent d'en ouvrir ; marché « produit » ≈ 0 (fonctionnalité incluse). Émetteurs : toutes les banques classiques + néobanques offrant le joint (N26 Shared/Spaces, Revolut, Lydia comptes partagés, Helios, Fortuneo, BoursoBank).
  - **Dominants (offres joint en ligne) :** BoursoBank, Fortuneo, N26. **Challengers :** Revolut (sous-comptes partagés), Lydia, Helios.

> ⚠️ Tous les chiffres ci-dessus sont des **ordres de grandeur mémoire (cutoff jan-2026)**. Méthode de rafraîchissement en §2.

### 1.3 Concurrence spécifique

| Acteur | Segment | Angle | Monétisation | Ce qu'ils NE font pas |
|---|---|---|---|---|
| Indy | Pro | Compta + compte | Abonnement + lead | Pas de comparateur neutre ; juge et partie |
| Legalstart / Captain Contrat / Dougs | Pro | Création + compta | Lead/abo | Comparaison de coût compte absente ou biaisée |
| Blogs affiliés « meilleur compte pro » | Pro | Listicles SEO | Affiliation cachée | **Aucune formule de coût, aucune transparence commission** |
| Forums (moneyvox, reddit r/vosfinances) | Joint | Retours d'usage | Aucune | Pas de simulateur, pas de tri objectif |
| Comparateurs banque généralistes | Joint | Listes | Affiliation | Pas de critère « joint » spécifique |

**Trou de marché exploitable :** un comparateur pro **indépendant, à formule de coût net affichée et commission étiquetée**. C'est littéralement le positionnement CB180 transposé — et personne ne l'occupe.

---

## 2. Hypothèses critiques à valider AVANT de coder

| # | Hypothèse | Méthode de validation | Coût |
|---|---|---|---|
| H1 | Le CPA pro moyen (funded) ≥ 50 € | Candidature aux programmes Qonto/Shine/Revolut Business + lecture des CGU réseau (Kwanko/Impact/propre) | Temps only (0 €) |
| H2 | ≥ 2 programmes pro acceptent CB180 comme éditeur | Envoi des candidatures (réutiliser `candidature_affiliation.md`) | 0 € |
| H3 | Le CPA pro est ≥ 3× le CPA carte constaté | Comparer H1 aux `est_commission_eur` déjà en base (`cards_v1_verified.json`) | 0 € |
| H4 | Le trafic pro se capte en SEO à coût raisonnable | Extraction volumes + difficulté (« compte pro auto-entrepreneur », « qonto vs shine ») via un outil SEO | ~0–100 € (outil) |
| H5 | Le taux de conversion clic→funded pro ≥ celui des cartes | A/B non dispo au départ → proxy : benchmarks réseau + 1er mois de données `clicks`/`conversions` | Temps |
| H6 | Un freelance accepte 9–29 €/mois si le coût *net de services* est justifié | Test qualitatif (5 interviews) + analyse SERP intent | ½ j |
| H7 | Le coût pro est modélisable honnêtement en **fourchette** (pas chiffre unique) | Prototype de `computeProAnnualCost` sur 3 profils de CA + revue | 1 j (livré ici) |
| H8 | Ajouter « Quel est votre statut ? » ne casse pas l'anonymat RGPD | Revue CNIL : le statut pro n'est pas une donnée identifiante isolée (voir §3.4) | Temps |
| H9 | Les URLs `/pro/*` ne cannibalisent pas les guides particuliers existants | Audit des `/guides/[slug]` actuels + cartographie mots-clés | ½ j |
| H10 | Le joint n'a **pas** de programme d'affiliation propre (⇒ SEO-only) | Recherche programmes réseau « compte joint » | 0 € |
| H11 | Le coût d'acquisition SEO pro < LTV pro | Modèle simple ARPU×taux (voir §5.2) une fois H1/H4/H5 connus | Temps |
| H12 | La commission n'influence jamais le tri (garde-fou testable) | Test unitaire : `rankCards` insensible à `est_commission_eur` (déjà vrai dans le code ; à figer par test) | 0 € (livré ici) |

**Règle de sortie :** ne pas écrire une ligne de tunnel `/pro` tant que **H1, H2, H3** ne sont pas confirmées. Elles sont gratuites et bloquantes.

---

## 3. Adaptation du modèle — compatibilité avec les 3 piliers

### 3.1 Anonymat par design
- **Tient.** Le pro n'exige aucune donnée identifiante. Questions ajoutées admissibles : *statut* (micro/EI/société), *fourchette de CA annuel*, *encaissez-vous des chèques ?*, *avez-vous besoin d'une facturation/compta intégrée ?*. Aucune n'identifie une personne.
- **Taboues (inchangé) :** SIREN, nom, secteur précis, banque actuelle. On reste en **fourchettes** comme pour le particulier (`band` dans `answers.ts`).

### 3.2 Pilier « un seul critère »
- **Particulier :** inchangé, `netAnnualCostEur` reste roi.
- **Joint :** le critère reste **le coût net**, mais amorti sur **2 cartes/2 cotitulaires** (formule §4). Pilier respecté.
- **Pro :** le critère « coût net » **seul devient trompeur** (services non comparables). Solution honnête : **coût net à périmètre de services déclaré équivalent**, en **fourchette min/réaliste/complet**, + un flag qualitatif *non classant* « services inclus » affiché à côté (jamais fusionné dans le tri). ⚠️ **C'est un amendement explicite du pilier** : on garde *un seul critère de tri* (coût net borné), mais on assume d'afficher un contexte de services que le tri ignore. À valider par vous.

### 3.3 Affiliation transparente
- Pro : programmes existent (Qonto, Shine, Revolut Business, Indy, Finom…), souvent en **CPA funded**, cookies variables (30–90 j selon réseau). La boucle `clicks`/`conversions`/`withClickRef` **fonctionne déjà** avec Impact/Partnerize/Awin — les réseaux pro sont les mêmes familles. **Aucun dev d'attribution nécessaire**, juste de nouvelles entrées catalogue + candidatures.
- Joint : **pas de programme dédié** → SEO-only, monétisé via les liens carte particulier déjà en place.

---

## 4. Formules de coût — TypeScript commenté

> Principe : **ne pas dupliquer le moteur**. On garde `computeAnnualCost` (particulier) intact, on ajoute deux fonctions pures sœurs qui réutilisent ses briques. Le discriminant `segment` route vers la bonne formule.

### 4.1 Joint — `computeJointAnnualCost`

```ts
// lib/engine.joint.ts — fonction PURE, réutilise computeAnnualCost.
import type { Card, CostBreakdown, EngineAssumptions, UsageProfile } from "./types";
import { computeAnnualCost, DEFAULT_ASSUMPTIONS } from "./engine";

/** Entrées spécifiques au compte joint (fourchettes → valeurs, comme UsageProfile). */
export interface JointProfile extends UsageProfile {
  /** Nombre de cartes physiques souhaitées (1 ou 2 cotitulaires actifs). */
  cardsCount: 1 | 2;
  /** Part des dépenses portée par le 2e cotitulaire, 0..1 (asymétrie d'usage). */
  secondHolderShare: number;
}

/** Coût facturé pour une 2e carte sur le même compte (souvent ≠ cotisation pleine). */
export interface JointCardPricing {
  /** Cotisation annuelle de la 2e carte, en €. Beaucoup d'offres : gratuite ou réduite. */
  secondCardAnnualFeeEur: number;
}

/**
 * Coût annuel net d'un compte joint.
 *
 * Idée clé : le change et le retrait étranger sont facturés PAR CARTE, donc on
 * répartit les dépenses hors-euro entre les deux cotitulaires selon leur part
 * d'usage, puis on somme. La cotisation = 1re carte (card.annual_fee_eur) + 2e
 * carte (pricing.secondCardAnnualFeeEur) si cardsCount === 2. La prime de
 * bienvenue et le cashback restent au niveau du COMPTE (non dupliqués).
 *
 * net_joint = cotisation_carte1 + cotisation_carte2
 *           + change_carte1 + change_carte2        (chacun sur SA part de dépenses)
 *           + retrait_carte1 + retrait_carte2
 *           − prime_amortie (compte)               (une seule prime par compte)
 *           − cashback (compte, plafond commun)
 */
export function computeJointAnnualCost(
  card: Card,
  pricing: JointCardPricing,
  profile: JointProfile,
  assumptions: EngineAssumptions = DEFAULT_ASSUMPTIONS,
): CostBreakdown {
  const twoCards = profile.cardsCount === 2;
  const share2 = twoCards ? clamp01(profile.secondHolderShare) : 0;
  const share1 = 1 - share2;

  // On réutilise le moteur particulier en projetant la part de CHAQUE cotitulaire
  // sur un sous-profil : mêmes % de frais, dépenses réparties. On neutralise
  // prime+cashback dans les sous-calculs (compte-niveau, ajoutés une seule fois).
  const noReward = { ...assumptions };
  const sub = (share: number, feeEur: number): CostBreakdown =>
    computeAnnualCost(
      { ...card, annual_fee_eur: feeEur, welcome_bonus_eur: 0, cashback_rate_percent: 0 },
      { ...profile, monthlySpendingEur: profile.monthlySpendingEur * share },
      noReward,
    );

  const c1 = sub(share1, card.annual_fee_eur);
  const c2 = twoCards ? sub(share2, pricing.secondCardAnnualFeeEur) : null;

  const annualFeeEur = c1.annualFeeEur + (c2?.annualFeeEur ?? 0);
  const fxFeeEur = c1.fxFeeEur + (c2?.fxFeeEur ?? 0);
  const foreignWithdrawalFeeEur =
    c1.foreignWithdrawalFeeEur + (c2?.foreignWithdrawalFeeEur ?? 0);
  const grossCostEur = annualFeeEur + fxFeeEur + foreignWithdrawalFeeEur;

  // Prime + cashback : une seule fois, au niveau compte, sur la dépense TOTALE.
  const account = computeAnnualCost(card, profile, assumptions);
  const welcomeBonusAmortizedEur = account.welcomeBonusAmortizedEur;
  const cashbackValueEur = account.cashbackValueEur;
  const rewardsValueEur = account.rewardsValueEur;

  const netAnnualCostEur =
    grossCostEur - welcomeBonusAmortizedEur - cashbackValueEur - rewardsValueEur;

  return {
    ...account, // hypothèses + structure inputs
    cardId: card.id,
    annualFeeEur: round2(annualFeeEur),
    fxFeeEur: round2(fxFeeEur),
    foreignWithdrawalFeeEur: round2(foreignWithdrawalFeeEur),
    grossCostEur: round2(grossCostEur),
    welcomeBonusAmortizedEur,
    cashbackValueEur,
    rewardsValueEur,
    netAnnualCostEur: round2(netAnnualCostEur),
    netAnnualCostWithoutBonusEur: round2(netAnnualCostEur + welcomeBonusAmortizedEur),
  };
}
```

**Coûts cachés joint** capturés : 2e cotisation (souvent le vrai piège), change/retrait *par carte* (un couple qui voyage paie 2× les frais), plafonds de cashback partagés (non doublés). Non capturé volontairement : frais de tenue de compte par cotitulaire (rares en néobanque) — à ajouter comme `PricingComponent` si un produit du catalogue en facture.

### 4.2 Pro — `computeProAnnualCost` (fourchette min / réaliste / complet)

```ts
// lib/engine.pro.ts — fonction PURE. Le pro NE réutilise PAS la formule change/retrait
// grand public (non pertinente) : il a ses propres composantes.
export interface ProProfile {
  /** CA annuel HT en €, fourchette → valeur représentative. */
  annualRevenueEur: number;
  /** Virements émis par mois (au-delà du quota inclus). */
  transfersPerMonth: number;
  /** Encaissements de chèques par mois (0 si jamais). */
  chequeDepositsPerMonth: number;
  /** Paiements/encaissements en devises par an, en € (change pro). */
  foreignVolumeEur: number;
  /** L'utilisateur a besoin de facturation/compta intégrée. */
  needsInvoicingAccounting: boolean;
  /** L'utilisateur a besoin d'une intégration URSSAF/déclaration. */
  needsUrssaf: boolean;
}

export interface ProProduct {
  id: string;
  /** Abonnement mensuel HT de chaque formule, du starter au complet. */
  tiers: {
    key: "free" | "starter" | "standard" | "premium";
    monthlyFeeEur: number;
    includedTransfersPerMonth: number;
    /** La formule inclut-elle facturation/compta ? URSSAF ? */
    hasInvoicing: boolean;
    hasUrssaf: boolean;
    hasCheques: boolean;
  }[];
  /** Frais unitaires au-delà des quotas. */
  extraTransferFeeEur: number;   // par virement hors quota
  chequeDepositFeeEur: number;   // par remise de chèque (0 si inclus)
  fxFeePercent: number;          // % sur les paiements en devises
}

/** Fourchette honnête : le coût pro varie ×10 selon le CA/usage → 3 chiffres, jamais 1. */
export interface ProCostRange {
  productId: string;
  /** Formule la moins chère qui reste UTILISABLE (free/starter). */
  minEur: number;
  /** Formule médiane payante couvrant l'usage déclaré. */
  realisticEur: number;
  /** Formule complète avec toutes les options réellement utiles au profil. */
  fullEur: number;
  /** Formule retenue pour le tri = réaliste (à périmètre de services déclaré). */
  sortKeyEur: number;
  /** Détail par poste, pour la transparence radicale (comme CostBreakdown). */
  chosenTierKey: string;
  breakdown: {
    subscriptionEur: number;
    extraTransfersEur: number;
    chequesEur: number;
    fxEur: number;
  };
}

/**
 * Coût annuel net d'un compte pro pour un profil.
 *
 * On sélectionne, parmi les formules du produit, la MOINS CHÈRE qui satisfait
 * les besoins déclarés (invoicing/urssaf/chèques), puis on ajoute les frais
 * variables au-delà des quotas. On renvoie 3 bornes (min/réaliste/complet).
 *
 * réaliste = 12 × abo_formule_adéquate
 *          + max(0, virements − quota) × 12 × frais_virement
 *          + chèques × 12 × frais_chèque
 *          + volume_devises × fx% / 100
 */
export function computeProAnnualCost(p: ProProduct, u: ProProfile): ProCostRange {
  const satisfies = (t: ProProduct["tiers"][number]) =>
    (!u.needsInvoicingAccounting || t.hasInvoicing) &&
    (!u.needsUrssaf || t.hasUrssaf) &&
    (u.chequeDepositsPerMonth === 0 || t.hasCheques);

  const usable = p.tiers.filter(satisfies).sort((a, b) => a.monthlyFeeEur - b.monthlyFeeEur);
  const realisticTier = usable[0] ?? [...p.tiers].sort((a, b) => a.monthlyFeeEur - b.monthlyFeeEur)[0];
  const minTier = [...p.tiers].sort((a, b) => a.monthlyFeeEur - b.monthlyFeeEur)[0];
  const fullTier = [...p.tiers].sort((a, b) => b.monthlyFeeEur - a.monthlyFeeEur)[0];

  const variableFor = (t: ProProduct["tiers"][number]) => {
    const subscriptionEur = t.monthlyFeeEur * 12;
    const extraTransfersEur =
      Math.max(0, u.transfersPerMonth - t.includedTransfersPerMonth) * 12 * p.extraTransferFeeEur;
    const chequesEur = t.hasCheques
      ? u.chequeDepositsPerMonth * 12 * p.chequeDepositFeeEur
      : u.chequeDepositsPerMonth * 12 * p.chequeDepositFeeEur; // facturé même hors formule si l'option existe
    const fxEur = (p.fxFeePercent / 100) * u.foreignVolumeEur;
    return { subscriptionEur, extraTransfersEur, chequesEur, fxEur };
  };

  const total = (t: ProProduct["tiers"][number]) => {
    const b = variableFor(t);
    return b.subscriptionEur + b.extraTransfersEur + b.chequesEur + b.fxEur;
  };

  const realisticBreakdown = variableFor(realisticTier);
  return {
    productId: p.id,
    minEur: round2(total(minTier)),
    realisticEur: round2(total(realisticTier)),
    fullEur: round2(total(fullTier)),
    sortKeyEur: round2(total(realisticTier)),
    chosenTierKey: realisticTier.key,
    breakdown: {
      subscriptionEur: round2(realisticBreakdown.subscriptionEur),
      extraTransfersEur: round2(realisticBreakdown.extraTransfersEur),
      chequesEur: round2(realisticBreakdown.chequesEur),
      fxEur: round2(realisticBreakdown.fxEur),
    },
  };
}
```

**Ce qui change structurellement vs particulier :** disparition du couple change/retrait grand public au profit d'un modèle **abonnement + quotas dépassés + services**. Le tri se fait sur `sortKeyEur` (formule *réaliste* à périmètre déclaré), mais on **affiche toujours la fourchette min→complet** — c'est la seule façon honnête vu le ×10 de dispersion.

> `round2` et `clamp01` sont ceux de `lib/engine.ts` (à exporter, actuellement privés).

---

## 5. Schéma de données — extension NON invasive de `lib/types.ts`

```ts
// Ajouts à lib/types.ts — rétrocompatibles (segment défaut "particulier").
export type Segment = "particulier" | "joint" | "pro";

// 1. On rend Card discriminable sans casser l'existant :
export interface CardBase { /* … champs actuels de Card … */ }
export interface ParticulierCard extends CardBase { segment?: "particulier"; }
export interface JointCard extends CardBase {
  segment: "joint";
  second_card_annual_fee_eur: number;  // cotisation 2e carte
  max_holders: number;                 // 2, 3…
}
export interface ProCard {
  segment: "pro";
  id: string; name: string; issuer: string; network: string;
  affiliate: CardAffiliate;            // ⟵ MÊME bloc affiliation, MÊME boucle clicks/conversions
  last_verified: string | null; source_url: string;
  tiers: ProProduct["tiers"];
  extra_transfer_fee_eur: number; cheque_deposit_fee_eur: number; fx_fee_percent: number;
  included_services: string[];         // affiché à côté du tri, NON classant
}
export type CatalogItem = ParticulierCard | JointCard | ProCard;

// 2. Composant tarifaire paramétrable (généralise les postes de coût)
export interface PricingComponent {
  key: "cotisation" | "change" | "retrait" | "prime" | "cashback"
     | "abonnement" | "virement" | "cheque" | "fx_pro" | "option";
  segment: Segment;
  /** true = coût (ajouté), false = déduction (prime, cashback). */
  isCost: boolean;
  unit: "eur_an" | "eur_mois" | "percent" | "eur_unite";
}

// 3. Formule paramétrique par segment
export interface Formula {
  segment: Segment;
  components: PricingComponent[];
  sortKey: "netAnnualCostEur" | "sortKeyEur";
}

// 4. Entrées utilisateur par segment (fourchettes validées, comme answers.ts)
export type SegmentedInput =
  | { segment: "particulier"; profile: UsageProfile }
  | { segment: "joint"; profile: JointProfile }
  | { segment: "pro"; profile: ProProfile };

// 5. AffiliateLink — mappe sur la table `clicks` + lib/affiliate.ts existants
export interface AffiliateLink {
  cardId: string; segment: Segment;
  network: string | null;              // "Impact" | "Partnerize" | "Awin" | réseau pro
  url: string; cookieDays: number | null;
  estCommissionEur: number;            // figé au clic (déjà en base : clicks.est_commission_eur)
  model: "cpa" | "cpl" | "revshare";   // pro souvent CPA funded
}

// 6. AuditLog — mappe sur les champs last_verified/source_url déjà présents
export interface AuditLog {
  cardId: string; segment: Segment;
  verifiedAt: string;                  // ISO ; alimente l'observatoire
  sourceUrl: string; note?: string;
}
```

**Impact DB (`schema.sql`) :** ajouter une colonne `segment TEXT DEFAULT 'particulier'` sur `audits`, `clicks`, `conversions`. **Rien d'autre à changer** — la boucle d'attribution est déjà produit-agnostique. C'est le point fort : **zéro refonte de la monétisation.**

---

## 6. Moteur paramétrique & routage

### 6.1 Dispatch (fonctions pures, testables)
```ts
// lib/engine.dispatch.ts
export function rankCatalog(items: CatalogItem[], input: SegmentedInput): RankedAny[] {
  switch (input.segment) {
    case "particulier": return rankCards(items as Card[], input.profile);            // existant, inchangé
    case "joint":       return rankJoint(items as JointCard[], input.profile);       // §4.1
    case "pro":         return rankPro(items as ProCard[], input.profile);           // §4.2, tri sur sortKeyEur
  }
}
```
Le moteur particulier n'est **jamais touché** — garantie de non-régression.

### 6.2 URLs & SEO
- **Sous-répertoire, pas sous-domaine** : `/pro`, `/pro/[produit]` (ex. `/pro/qonto`), `/pro/comparatif/[slug]`, `/guides/compte-pro-freelance`. Un sous-domaine repartirait l'autorité SEO de zéro ; le sous-répertoire capitalise sur le domaine existant. **Décision claire : sous-répertoire.**
- **Joint** : pas de tunnel → **guides only** `/guides/carte-compte-joint`, `/guides/meilleur-compte-joint-en-ligne`, `/guides/compte-joint-sans-frais-etranger`, canonical vers eux-mêmes, liens internes vers `/cartes` particulier.
- **Canonicals** : chaque produit pro auto-canonical ; éviter les near-duplicates entre `/guides/*` existants et nouveaux `/pro/*` (hypothèse H9).
- **hreflang** : le site reste **FR-only** ; pas de hreflang nécessaire tant qu'il n'y a pas de version étrangère.

### 6.3 Détection d'identité sans tracking (RGPD/CNIL)
- Question segment posée en **Q1** via un simple choix (`particulier` / `joint` / `pro`) **stocké en state React + `band` anonymisé**, exactement comme les fourchettes actuelles. Aucune donnée identifiante.
- Segmentation portée par **l'URL** (`/pro` pré-sélectionne le segment) + state, **pas de cookie de profilage, pas de fingerprint**. Cohérent avec l'anonymat par design déjà en place (`audits` en fourchettes).
- **CNIL** : le statut pro et la fourchette de CA ne sont pas des données identifiantes isolées ; base légale inchangée (mesure d'audience anonyme + consentement explicite pour l'email via double opt-in déjà implémenté dans `alertes`). Durée de conservation : aligner sur l'existant.

### 6.4 Deux scénarios d'implémentation
- **(a) Intégration minimale (recommandée pour MVP) :** champ `segment` + 2 fonctions moteur + routes `/pro` + catalogue `data/cards-pro.json`. **Pas de refonte.** Effort **M**.
- **(b) Refonte modulaire :** `CatalogItem` discriminé partout, `rankCatalog` unique, questionnaire paramétré par segment dans `answers.ts`, DB colonnée. **L** — à faire seulement après validation commerciale du pro.

---

## 7. UX & parcours

### 7.1 Tunnels
**Pro** (5 questions, jamais identifiantes) : `statut` → `CA annuel (fourchette)` → `virements/mois` → `chèques ? devises ?` → `besoin facturation/compta ?`. Résultat = **fourchette min→complet** + services inclus à côté (non classant) → CTA lien affilié étiqueté « lien partenaire » (comme l'existant `/go/[id]`).

**Joint** : pas de tunnel dédié ; réutiliser le simulateur particulier avec une question « 1 ou 2 cartes ? » optionnelle qui bascule sur `computeJointAnnualCost`.

### 7.2 Frictions spécifiques
- **Joint** : un seul cotitulaire clique pour deux → gérer via `secondHolderShare` (part d'usage) et un wording « pour le couple ». Ne pas sur-modéliser.
- **Pro** : vocabulaire **HT** par défaut (le pro raisonne HT), afficher TTC en secondaire. Comparaison B2B = attente de tableau détaillé, pas de « carte pour vous ».

### 7.3 A/B tests
| # | Hypothèse | Métrique | n min |
|---|---|---|---|
| A1 | Question « statut » en Q1 vs Q3 augmente la complétion pro | taux complétion | ~1 500/variante |
| A2 | Afficher coût **HT** en premier ↑ clic affilié pro | CTR `/go` | ~2 000 |
| A3 | Fourchette (min→complet) vs chiffre unique ↑ confiance/clic | CTR + temps page | ~2 000 |
| A4 | Badge « lien partenaire » explicite ne baisse pas le CTR | CTR | ~2 000 |
| A5 | Guide joint → simulateur particulier vs page carte directe | conversion | ~1 500 |

*(n indicatifs pour détecter +2–3 pts de CTR à 80 % de puissance, α 5 % ; à recalculer sur le CTR de base réel.)*

---

## 8. Business model & ARPU

### 8.1 État des lieux affiliation
- **Pro** : programmes existants (Qonto, Shine, Revolut Business, Indy, Finom, Anytime) — modèle dominant **CPA funded**, cookies 30–90 j. **À confirmer par candidature** (H1/H2).
- **Joint** : **pas de programme dédié** → SEO-only, monétisé via liens carte particulier.

### 8.2 Tableau ARPU (hypothèses explicites — à remplacer par les données réelles `clicks`/`conversions`)

| Segment | Commission moy. | CTR affilié | Conv. clic→validé | ARPU/visiteur | Base |
|---|---|---|---|---|---|
| Particulier (actuel) | 5–40 € (réel en base `cards_v1_verified.json`) | ~8–12 % | ~10–20 % | **~0,10–0,40 €** | données réelles à extraire |
| Joint (projeté) | = particulier | ~6–10 % | ~8–15 % | **~0,08–0,30 €** | proxy particulier, hypothèse |
| Pro (projeté) | **50–120 €** (H1) | ~4–8 % (intention forte, volume moindre) | ~10–20 % funded | **~0,40–1,90 €** | hypothèse H1×H5, à valider |

**Lecture :** même avec un CTR plus faible, le pro sort **~4–6× l'ARPU particulier** grâce au CPA. C'est le cœur du business case. **Toutes ces valeurs sont des hypothèses** ; les vraies sont calculables dès aujourd'hui en agrégeant `clicks`/`conversions` par carte (particulier) pour caler la base, puis en projetant.

### 8.3 Risques business
- **Pollution du positionnement** : pousser 29 €/mois fragilise « ne vend aucune carte ». Garde-fou = tri par coût + commission étiquetée + fourchette honnête. **Testable** (H12).
- **Conflit éditorial** : services pro non comparables → assumé via affichage « services inclus » non classant.
- **Dépendance** : si seul Qonto affilie, risque de mono-source → viser ≥ 2 programmes (H2) avant lancement.

---

## 9. Roadmap 3 vagues

### Vague 1 — MVP Pro (Go conditionné à H1+H2+H3)
- **Objectif** : valider l'ARPU pro sur trafic réel.
- **Périmètre** : segment `pro`, `computeProAnnualCost`, route `/pro` + `/pro/[produit]`, catalogue `data/cards-pro.json` (8 produits), tunnel 5 questions, 1 guide `/guides/compte-pro-freelance`, colonne `segment` en DB.
- **Livrables** : `lib/engine.pro.ts`, `<ProSimulator>`, `computeProAnnualCost()`, `data/cards-pro.json`, 10 tests unitaires (§10), extension `schema.sql`.
- **Effort** : **M** (~8–12 j).
- **KPIs** : ≥ 2 programmes affiliés actifs ; ARPU pro ≥ 2× particulier sur 500 sessions ; ≥ 3 guides pro indexés.

### Vague 2 — Joint SEO + affinage Pro
- **Objectif** : capter le volume SEO joint sans coût produit ; enrichir le pro.
- **Périmètre** : 3 guides joint → catalogue particulier ; option « 2 cartes » + `computeJointAnnualCost` ; observatoire tarifaire pro (réutilise `lib/observatoire.ts`).
- **Livrables** : `lib/engine.joint.ts`, guides joint, snapshot pro dans l'observatoire.
- **Effort** : **S–M** (~5–8 j).
- **KPIs** : trafic organique joint > 0 ; +30 % de produits pro comparés.

### Vague 3 — Refonte modulaire (si Pro validé)
- **Objectif** : industrialiser les 3 segments sans dette.
- **Périmètre** : `CatalogItem` discriminé, `rankCatalog` unique, `answers.ts` paramétré par segment, monétisation hybride (lead/contenu labélisé là où l'affiliation manque).
- **Livrables** : refonte moteur/questionnaire, dashboard ARPU par segment (`app/stats`).
- **Effort** : **L** (~15–20 j).
- **KPIs** : coût marginal d'ajout d'un segment ≈ 0 ; ARPU global ↑.

---

## 10. Dix tests unitaires critiques (Vitest, cohérents avec `engine.test.ts`)

```ts
// lib/engine.pro.test.ts / engine.joint.test.ts
1.  computeProAnnualCost: minEur ≤ realisticEur ≤ fullEur (fourchette ordonnée)
2.  computeProAnnualCost: un profil sans besoin de service prend la formule la moins chère (chosenTierKey === free/starter)
3.  computeProAnnualCost: needsInvoicing force un tier hasInvoicing (le tri ignore les formules insuffisantes)
4.  computeProAnnualCost: virements > quota ⇒ extraTransfersEur > 0, linéaire au dépassement
5.  computeProAnnualCost: fxEur = fx% × foreignVolume, indépendant de la formule
6.  computeJointAnnualCost: cardsCount=1 ⇒ résultat IDENTIQUE à computeAnnualCost (non-régression)
7.  computeJointAnnualCost: secondHolderShare=0.5 répartit le change 50/50, somme = change compte entier
8.  computeJointAnnualCost: prime + cashback comptés UNE seule fois (pas ×2 cartes)
9.  computeJointAnnualCost: 2e carte payante ⇒ annualFeeEur = fee1 + fee2
10. rankCatalog(pro/joint): tri INSENSIBLE à affiliate.est_commission_eur (garde-fou anti-biais, H12)
    + rankPro déterministe (coût, puis nom) comme rankCards
```

---

## 11. Cinq questions bloquantes (contrat de passage en implémentation)

1. **Affiliation pro** : lance-t-on les candidatures Qonto + un challenger **maintenant** (préalable H1/H2/H3) ? Sans ≥ 2 acceptations, on ne code pas le tunnel.
2. **Amendement du pilier « un seul critère »** : acceptez-vous, pour le pro, un critère de tri = **coût net à périmètre de services équivalent en fourchette** + un bloc « services inclus » *non classant* ? (Le pilier est amendé, pas cassé — décision vôtre.)
3. **Scénario technique** : MVP **(a) intégration minimale** d'abord, puis refonte (b) seulement si le pro convertit ? (Ma reco.)
4. **Joint = SEO-only** confirmé (pas de tunnel dédié, réutilisation du catalogue particulier) ?
5. **Données réelles** : puis-je extraire les agrégats `clicks`/`conversions`/`audits` existants pour **remplacer les ARPU hypothétiques par les vrais** avant de figer le business case ?

---
*Toutes les valeurs de marché et d'ARPU sont des ordres de grandeur (cutoff mémoire jan-2026) explicitement marqués ; les seules données fiables sont celles déjà dans votre base Turso — à extraire en priorité.*
