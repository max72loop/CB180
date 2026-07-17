// lib/card-features.ts
// Taxonomie et AFFICHAGE des fonctionnalités & services d'une carte (au-delà du
// coût). Pur, sans dépendance à React : réutilisable par la fiche produit et le
// comparatif. Le coût reste le seul critère de classement ; ces fonctionnalités
// informent, elles ne prescrivent pas (wording IOBSP).
//
// Discipline tri-état : une fonctionnalité booléenne omise du catalogue vaut
// « non vérifié » (status "unknown"), jamais « non ». On ne montre « Non » que
// lorsqu'une absence a été explicitement confirmée (valeur `false`).

import type { Card, CardFeatures } from "./types";

/** Statut d'affichage d'une fonctionnalité booléenne. */
export type FeatureStatus = "yes" | "no" | "unknown";

/** Clé d'une fonctionnalité booléenne (exclut les champs enum). */
export type BoolFeatureKey = {
  [K in keyof CardFeatures]-?: NonNullable<CardFeatures[K]> extends boolean ? K : never;
}[keyof CardFeatures];

/** Icône symbolique (mappée vers un SVG côté composant via FEATURE_ICON). */
export type FeatureIcon =
  | "clock"
  | "shield"
  | "phone"
  | "layers"
  | "piggy"
  | "flag"
  | "cheque"
  | "cash"
  | "sparkle"
  | "lock"
  | "card";

/** Un groupe de fonctionnalités affiché ensemble. */
export interface FeatureGroup {
  id: string;
  title: string;
  /** Clés booléennes du groupe, dans l'ordre d'affichage. */
  keys: BoolFeatureKey[];
}

/** Libellé court de chaque fonctionnalité booléenne. */
export const FEATURE_LABEL: Record<BoolFeatureKey, string> = {
  authorizedOverdraft: "Découvert autorisé",
  applePay: "Apple Pay",
  googlePay: "Google Pay",
  virtualCard: "Carte virtuelle",
  disposableVirtualCards: "Cartes virtuelles jetables",
  instantCard: "Carte utilisable dès l'ouverture",
  subAccounts: "Sous-comptes / espaces",
  sharedSpace: "Espace partageable à deux",
  remuneratedBalance: "Solde rémunéré",
  frenchIban: "IBAN français",
  chequebook: "Chéquier",
  cashDeposit: "Dépôt d'espèces",
  instantFreeze: "Gel de la carte instantané",
};

/** Icône associée à chaque fonctionnalité booléenne. */
export const FEATURE_ICON: Record<BoolFeatureKey, FeatureIcon> = {
  authorizedOverdraft: "clock",
  applePay: "phone",
  googlePay: "phone",
  virtualCard: "card",
  disposableVirtualCards: "shield",
  instantCard: "sparkle",
  subAccounts: "layers",
  sharedSpace: "layers",
  remuneratedBalance: "piggy",
  frenchIban: "flag",
  chequebook: "cheque",
  cashDeposit: "cash",
  instantFreeze: "lock",
};

/**
 * Groupes de fonctionnalités, ordre d'affichage. Le débit et la matière (enum)
 * sont traités à part (voir debitLabel / materialLabel).
 */
export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "paiement",
    title: "Paiement & mobile",
    keys: ["applePay", "googlePay", "virtualCard", "disposableVirtualCards", "instantCard"],
  },
  {
    id: "compte",
    title: "Compte & épargne",
    keys: ["subAccounts", "sharedSpace", "remuneratedBalance", "frenchIban", "chequebook", "cashDeposit"],
  },
  {
    id: "gestion",
    title: "Découvert & sécurité",
    keys: ["authorizedOverdraft", "instantFreeze"],
  },
];

/** Statut tri-état d'une fonctionnalité booléenne pour une carte. */
export function featureStatus(card: Card, key: BoolFeatureKey): FeatureStatus {
  const v = card.features?.[key];
  if (v === true) return "yes";
  if (v === false) return "no";
  return "unknown";
}

/** Libellé lisible du mode de débit, ou null si non renseigné. */
export function debitLabel(card: Card): string | null {
  switch (card.features?.debitType) {
    case "immediat":
      return "Débit immédiat";
    case "differe":
      return "Débit différé";
    case "choix":
      return "Débit immédiat ou différé, au choix";
    default:
      return null;
  }
}

/** Libellé lisible de la matière de la carte, ou null si non renseigné. */
export function materialLabel(card: Card): string | null {
  switch (card.features?.cardMaterial) {
    case "plastique":
      return "Carte plastique";
    case "metal":
      return "Carte métal";
    case "recycle":
      return "Carte en plastique recyclé";
    default:
      return null;
  }
}

/** True si la carte porte au moins une fonctionnalité renseignée (section à afficher). */
export function hasFeatures(card: Card): boolean {
  const f = card.features;
  if (!f) return false;
  return Object.values(f).some((v) => v !== undefined);
}

/** Une ligne de fonctionnalité prête à afficher. */
export interface FeatureRow {
  key: BoolFeatureKey;
  label: string;
  icon: FeatureIcon;
  status: FeatureStatus;
}

/**
 * Lignes d'un groupe pour une carte, en n'incluant que les fonctionnalités
 * dont le statut est CONNU (yes/no). Les non vérifiées sont masquées de la fiche
 * pour ne pas afficher une grille pleine de « ? ». Le comparatif, lui, garde le
 * "unknown" (une ligne existe si au moins une des deux cartes la renseigne).
 */
export function groupRows(card: Card, group: FeatureGroup): FeatureRow[] {
  return group.keys
    .map((key) => ({
      key,
      label: FEATURE_LABEL[key],
      icon: FEATURE_ICON[key],
      status: featureStatus(card, key),
    }))
    .filter((r) => r.status !== "unknown");
}

/**
 * Atouts de fonctionnalités marquants pour un affichage compact (pills), ordonnés
 * du plus différenciant au moins. Ne renvoie QUE des faits confirmés positifs.
 * Descriptif, jamais prescriptif. `max` borne le nombre renvoyé.
 */
export function featureHighlights(card: Card, max = 3): string[] {
  const f = card.features;
  if (!f) return [];
  const out: string[] = [];
  if (f.remuneratedBalance === true) out.push("Solde rémunéré");
  if (f.debitType === "differe" || f.debitType === "choix") out.push("Débit différé possible");
  if (f.disposableVirtualCards === true) out.push("Cartes virtuelles jetables");
  if (f.cardMaterial === "metal") out.push("Carte métal");
  if (f.subAccounts === true) out.push("Sous-comptes");
  if (f.chequebook === true) out.push("Chéquier disponible");
  if (f.cashDeposit === true) out.push("Dépôt d'espèces");
  return out.slice(0, max);
}

/**
 * Fonctionnalités candidates au DÉPARTAGE de cartes à coût égal, ordonnées du
 * plus au moins différenciant pour un usage grand public. Sert de vivier au
 * mini-parcours « à coût égal, qu'est-ce qui compte pour vous ? » : on n'expose
 * que celles qui séparent réellement les cartes ex æquo (cf. distinguishingFeatures).
 */
export const TIEBREAK_FEATURE_KEYS: BoolFeatureKey[] = [
  "chequebook",
  "cashDeposit",
  "subAccounts",
  "remuneratedBalance",
  "applePay",
  "googlePay",
  "disposableVirtualCards",
  "frenchIban",
  "instantFreeze",
];

/** Une fonctionnalité proposée comme critère de départage. */
export interface TiebreakOption {
  key: BoolFeatureKey;
  label: string;
  icon: FeatureIcon;
}

/**
 * Parmi un ensemble de cartes à coût égal, les fonctionnalités qui les
 * DIFFÉRENCIENT réellement : au moins une carte les confirme (« yes ») et au
 * moins une ne les confirme pas (« no » ou « unknown »). Une fonctionnalité que
 * toutes offrent (ou qu'aucune ne confirme) ne départage rien et est écartée.
 * Ordre stable = TIEBREAK_FEATURE_KEYS.
 */
export function distinguishingFeatures(cards: Card[]): TiebreakOption[] {
  return TIEBREAK_FEATURE_KEYS.filter((key) => {
    let anyYes = false;
    let anyNot = false;
    for (const card of cards) {
      if (featureStatus(card, key) === "yes") anyYes = true;
      else anyNot = true;
    }
    return anyYes && anyNot;
  }).map((key) => ({ key, label: FEATURE_LABEL[key], icon: FEATURE_ICON[key] }));
}

/**
 * Nombre de fonctionnalités sélectionnées que la carte offre de façon CONFIRMÉE
 * (statut « yes »). Sert à reclasser les cartes ex æquo selon les critères cochés.
 * Le non vérifié ne compte pas (discipline tri-état).
 */
export function featureMatchCount(card: Card, keys: BoolFeatureKey[]): number {
  return keys.reduce(
    (n, key) => n + (featureStatus(card, key) === "yes" ? 1 : 0),
    0,
  );
}

/**
 * Valeur d'affichage d'une fonctionnalité pour le tableau comparatif : « Oui »,
 * « Non », ou null si non vérifié. Une seule source de vérité du wording tri-état.
 * Le null est délibéré : il laisse `rowHasData` masquer une ligne qu'aucune carte
 * ne renseigne, et le rendu d'une cellule vide (« — ») aux composants.
 */
export function featureCompareValue(card: Card, key: BoolFeatureKey): string | null {
  switch (featureStatus(card, key)) {
    case "yes":
      return "Oui";
    case "no":
      return "Non";
    default:
      return null;
  }
}
