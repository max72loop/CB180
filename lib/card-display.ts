// lib/card-display.ts
// Helpers d'AFFICHAGE des cartes (labels lisibles, formats). Pur, réutilisable
// par les pages SEO (/cartes) et les composants. Aucune dépendance à React.

import type { Card, CardTier, InsurancesLevel } from "./types";
import { formatEur } from "./format";

export type CardTone = "brand" | "dark" | "emerald" | "slate";

/** Teinte de la vignette selon la gamme (décoratif, neutre). */
export function toneForTier(tier: CardTier): CardTone {
  if (tier === "premium") return "dark";
  if (tier === "haut_de_gamme") return "emerald";
  if (tier === "intermediaire") return "brand";
  return "slate";
}

export const TIER_LABEL: Record<CardTier, string> = {
  entree: "Entrée de gamme",
  intermediaire: "Intermédiaire",
  premium: "Premium",
  haut_de_gamme: "Haut de gamme",
};

export const INSURANCE_LABEL: Record<InsurancesLevel, string> = {
  none: "Aucune assurance incluse",
  basique: "Assurances basiques",
  premier_gold: "Assurances niveau Premier / Gold",
  elite: "Assurances haut de gamme (élite)",
};

/** Cotisation lisible : « Gratuite » ou « 60 €/an (5 €/mois) ». */
export function feeLabel(card: Card): string {
  if (card.annual_fee_eur === 0) return "Gratuite";
  const annual = `${formatEur(card.annual_fee_eur)}/an`;
  if (card.monthly_fee_eur && card.monthly_fee_eur > 0) {
    return `${annual} (${formatEur(card.monthly_fee_eur)}/mois)`;
  }
  return annual;
}

/** Frais de change hors zone euro, ex. « 0 % » / « 2,80 % ». */
export function fxLabel(card: Card): string {
  return `${card.fx_fee_percent.toString().replace(".", ",")} %`;
}

/** Condition de revenu, ex. « ≥ 2 200 €/mois » / « Sans condition de revenu ». */
export function incomeLabel(card: Card): string {
  const min = card.min_monthly_income_eur;
  if (min == null) return "Sans condition de revenu";
  return `≥ ${formatEur(min)}/mois`;
}

/** Prime de bienvenue, ex. « 80 € (offre volatile) » / « Aucune prime confirmée ». */
export function welcomeLabel(card: Card): string {
  if (!card.welcome_bonus_eur || card.welcome_bonus_eur <= 0) {
    return "Aucune prime de base confirmée";
  }
  return `${formatEur(card.welcome_bonus_eur)} (offre volatile)`;
}

/**
 * Atouts COURTS d'une carte pour un affichage compact (tags), dérivés de ses
 * champs vérifiés et ordonnés du plus DIFFÉRENCIANT au moins (condition de
 * revenu, assurances, retraits, prime, change) : dans une liste de bonnes
 * cartes, les traits rares ressortent avant ceux que tout le monde partage.
 * Descriptif (IOBSP), jamais prescriptif. `max` borne le nombre renvoyé.
 */
export function cardHighlights(card: Card, max = 2): string[] {
  const out: string[] = [];
  if (card.min_monthly_income_eur == null) out.push("Sans condition de revenu");
  if (card.insurances_level === "premier_gold" || card.insurances_level === "elite")
    out.push("Assurances voyage incluses");
  const freeFw = card.free_foreign_withdrawals_per_month ?? 0;
  if (freeFw >= 100) out.push("Retraits illimités à l'étranger");
  else if (freeFw > 0) out.push(`${freeFw} retraits gratuits/mois à l'étranger`);
  if (card.welcome_bonus_eur > 0) out.push(`Prime ${formatEur(card.welcome_bonus_eur)}`);
  if (card.fx_fee_percent === 0) out.push("0 % de frais de change");
  return out.slice(0, max);
}

/**
 * Cartes les plus PERTINENTES à comparer avec `card`, pour le maillage interne.
 *
 * On ne prend PLUS les 4 cartes les moins chères (ce tri privait de liens toute
 * carte payante, aussi bien positionnée soit-elle) : on classe par proximité
 * réelle — même gamme, profils cibles communs, cotisation voisine, même réseau.
 * Résultat : chaque fiche pointe vers ses vraies concurrentes, et les cartes
 * payantes redeviennent des cibles de liens internes (concentre le PageRank).
 * Déterministe (SSG) : départages stables par cotisation puis nom.
 */
export function relatedCards(card: Card, pool: Card[], max = 4): Card[] {
  const relevance = (other: Card): number => {
    let s = 0;
    if (other.tier === card.tier) s += 3;
    const sharedProfiles = other.target_profiles.filter((p) =>
      card.target_profiles.includes(p),
    ).length;
    s += sharedProfiles * 2;
    if (other.network === card.network) s += 0.5;
    // Proximité de cotisation : bonus 0..2, divisé par 2 tous les ~40 € d'écart.
    const feeGap = Math.abs(other.annual_fee_eur - card.annual_fee_eur);
    s += 2 / (1 + feeGap / 40);
    return s;
  };
  return pool
    .filter((c) => c.id !== card.id)
    .map((c) => ({ c, s: relevance(c) }))
    .sort(
      (a, b) =>
        b.s - a.s ||
        a.c.annual_fee_eur - b.c.annual_fee_eur ||
        a.c.name.localeCompare(b.c.name),
    )
    .slice(0, max)
    .map((x) => x.c);
}

/**
 * Slug canonique d'une comparaison de deux cartes : ids triés + « -vs- »,
 * pour qu'une même paire n'ait qu'une seule URL (pas de doublon A-vs-B / B-vs-A).
 */
export function comparisonSlug(aId: string, bId: string): string {
  const [x, y] = [aId, bId].sort();
  return `${x}-vs-${y}`;
}

/** Extrait les deux ids d'un slug de comparaison, ou null si invalide. */
export function parseComparisonSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === parts[1]) {
    return null;
  }
  return [parts[0], parts[1]];
}

/**
 * FAQ factuelle propre à une carte, dérivée de ses champs vérifiés. Cible les
 * requêtes longue traîne « frais X retrait étranger », « X condition de revenu »,
 * « X frais à l'étranger », etc. Réponses strictement descriptives (IOBSP) :
 * aucun jugement, aucun « recommandé ». Alimente aussi le JSON-LD FAQPage.
 */
export function cardFaq(card: Card): { q: string; a: string }[] {
  const faq: { q: string; a: string }[] = [];

  faq.push({
    q: `${card.name} a-t-elle des frais à l'étranger ?`,
    a:
      card.fx_fee_percent === 0
        ? `Non : ${card.name} n'applique aucun frais de change sur les paiements hors zone euro (${fxLabel(card)}). Le taux de change du réseau ${card.network} s'applique néanmoins.`
        : `Oui : ${card.name} applique des frais de change de ${fxLabel(card)} sur les paiements hors zone euro, en plus du taux de change du réseau ${card.network}.`,
  });

  faq.push({
    q: `Quels sont les frais de retrait à l'étranger de ${card.name} ?`,
    a: `${card.foreign_withdrawal} Ces conditions figurent dans la tarification officielle de ${card.issuer}.`,
  });

  faq.push({
    q: `Quelle condition de revenu pour ${card.name} ?`,
    a:
      card.min_monthly_income_eur == null
        ? `${card.name} n'affiche pas de condition de revenu à la souscription. L'ouverture reste soumise à l'acceptation de ${card.issuer}.`
        : `${card.name} demande un revenu net d'environ ${incomeLabel(card).replace("≥ ", "")} pour être éligible, selon les conditions de ${card.issuer}.`,
  });

  faq.push({
    q: `Combien coûte ${card.name} par an ?`,
    a:
      card.annual_fee_eur === 0
        ? `La cotisation de ${card.name} est de 0 €${card.free_condition ? ` (${card.free_condition})` : ""}. Le coût réel dépend ensuite de vos usages (change, retraits) : le simulateur le chiffre.`
        : `La cotisation de ${card.name} est de ${feeLabel(card)}. Le coût réel total dépend en plus de vos usages à l'étranger : le simulateur le chiffre.`,
  });

  // Q/R propres à l'entité (actualité tarifaire, comparaison intra-marque…),
  // ajoutées après le gabarit générique : longue traîne à forte intention.
  if (card.faq_extra) faq.push(...card.faq_extra);

  return faq;
}

/**
 * Segment de texte éditorial : soit du texte brut, soit une mention de carte à
 * transformer en lien interne (`cardId` renseigné). Produit par linkifyCardNames.
 */
export interface TextSegment {
  text: string;
  cardId?: string;
}

/**
 * Découpe un texte éditorial en segments, en repérant les noms EXACTS de cartes
 * du catalogue pour les rendre cliquables vers leur fiche. Maillage interne
 * contextuel : un guide qui cite « Hello Prime » en prose pointe désormais vers
 * /cartes/hellobank-prime, ce qui transmet une pertinence thématique réelle.
 *
 * Discipline anti-suroptimisation : une SEULE occurrence liée par carte (via
 * `alreadyLinked`, partagé entre sections d'un même guide), correspondance
 * sensible à la casse et bornée aux mots (pas de sous-chaîne au milieu d'un
 * mot), noms les plus longs prioritaires (« Nickel Chrome » avant « Nickel »).
 * Fonction pure : ne dépend pas de React, la page décide du rendu du lien.
 */
export function linkifyCardNames(
  body: string,
  cards: { id: string; name: string }[],
  alreadyLinked: Set<string>,
): TextSegment[] {
  const isWordChar = (ch: string | undefined): boolean =>
    ch != null && /[A-Za-zÀ-ÿ0-9]/.test(ch);
  const segments: TextSegment[] = [];
  let i = 0;
  while (i < body.length) {
    // Occurrence la plus proche à partir de i ; à égalité, le nom le plus long.
    let best: { index: number; id: string; name: string } | null = null;
    for (const c of cards) {
      if (alreadyLinked.has(c.id)) continue;
      const idx = body.indexOf(c.name, i);
      if (idx === -1) continue;
      if (
        best === null ||
        idx < best.index ||
        (idx === best.index && c.name.length > best.name.length)
      ) {
        best = { index: idx, id: c.id, name: c.name };
      }
    }
    if (best === null) {
      segments.push({ text: body.slice(i) });
      break;
    }
    const before = body[best.index - 1];
    const after = body[best.index + best.name.length];
    if (isWordChar(before) || isWordChar(after)) {
      // Mention au milieu d'un mot : on la laisse en texte et on avance.
      segments.push({ text: body.slice(i, best.index + best.name.length) });
      i = best.index + best.name.length;
      continue;
    }
    if (best.index > i) segments.push({ text: body.slice(i, best.index) });
    segments.push({ text: best.name, cardId: best.id });
    alreadyLinked.add(best.id);
    i = best.index + best.name.length;
  }
  return segments;
}

/** Date de vérification lisible « JJ/MM/AAAA » ou null si non vérifiée. */
export function verifiedDate(card: Card): string | null {
  const iso = card.last_verified;
  if (!iso || card.to_verify) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}
