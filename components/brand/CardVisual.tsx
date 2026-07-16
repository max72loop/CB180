// components/brand/CardVisual.tsx
// Visuel de carte bancaire générique (aucun vrai nom de banque) : puce,
// sans-contact, numéro masqué, réseau. Sert d'illustration produit sur la
// landing. Purement décoratif (aria-hidden).
//
// ProductCardVisual (plus bas) rend, lui, une carte NOMMÉE sur les fiches ET
// dans les listes (prop `size`) : image officielle si fournie (card.image),
// sinon visuel fidèle à la marque.

import Image from "next/image";
import type { Card } from "@/lib/types";
import { cardBrand, type CardPatternKind } from "@/lib/card-brand";

type CardTone = "brand" | "dark" | "emerald" | "slate";

const TONES: Record<CardTone, string> = {
  brand: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700",
  dark: "bg-gradient-to-br from-slate-700 via-slate-900 to-slate-950",
  emerald: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700",
  slate: "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700",
};

interface CardVisualProps {
  tone?: CardTone;
  /** Petit label discret en haut (ex. « Carte A »). Neutre, non nominatif. */
  label?: string;
  /** 4 derniers chiffres factices. */
  last4?: string;
  className?: string;
  /** Active le reflet animé qui balaie la carte. */
  sheen?: boolean;
}

/** Puce EMV stylisée (dorée ou argentée). */
function Chip({
  tone = "gold",
  className = "h-7 w-9",
}: {
  tone?: "gold" | "silver";
  className?: string;
}) {
  const fill = tone === "silver" ? "#d7dbe0" : "#f5d67b";
  const stroke = tone === "silver" ? "#a9b0b8" : "#d9b24a";
  const line = tone === "silver" ? "#9098a1" : "#c79a34";
  const inner = tone === "silver" ? "#c3c9d0" : "#e6c25c";
  return (
    <svg viewBox="0 0 40 32" className={className} aria-hidden>
      <rect x="1" y="1" width="38" height="30" rx="5" fill={fill} stroke={stroke} strokeWidth="1" />
      <path
        d="M14 1v30M26 1v30M1 11h13M26 11h13M1 21h13M26 21h13"
        stroke={line}
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="14" y="11" width="12" height="10" rx="2" fill={inner} />
    </svg>
  );
}

/** Ondes « sans contact ». */
function Contactless({ className = "h-6 w-6 text-white/80" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M9 8a6 6 0 0 1 0 8M13 5a10 10 0 0 1 0 14M5 11a2.5 2.5 0 0 1 0 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CardVisual({
  tone = "brand",
  label = "Carte",
  last4 = "1802",
  className = "",
  sheen = false,
}: CardVisualProps) {
  return (
    <div
      aria-hidden
      className={[
        "relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl p-5 text-white shadow-xl ring-1 ring-white/15",
        TONES[tone],
        sheen ? "card-sheen" : "",
        className,
      ].join(" ")}
    >
      {/* Texture guilloché très discrète (relief « carte imprimée ») */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 7px)",
        }}
      />
      {/* Reflet de surface : lumière en haut, ombre en bas (volume) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      {/* Halo lumineux d'angle */}
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
      {/* Liseré interne clair (tranche de la carte) */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {label}
          </span>
          <Contactless />
        </div>

        <div className="flex items-center gap-3">
          <Chip />
          <span className="font-mono text-sm tracking-widest text-white/85">
            ••••&nbsp;••••&nbsp;{last4}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CB180
          </span>
          {/* Marque réseau abstraite (deux disques), non nominative. */}
          <span className="flex items-center">
            <span className="h-5 w-5 rounded-full bg-white/70" />
            <span className="-ml-2 h-5 w-5 rounded-full bg-white/40" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Motif de fond distinctif d'une carte (original, dessiné en CSS/SVG). `ink` est
 * une encre translucide adaptée au fond (claire sur carte sombre, sombre sur
 * carte claire) ; `accent` colore les éléments de marque. Purement décoratif.
 */
function CardPattern({
  kind,
  ink,
  accent = "rgba(255,255,255,0.4)",
}: {
  kind: CardPatternKind;
  ink: string;
  accent?: string;
}) {
  const box = "pointer-events-none absolute inset-0";
  switch (kind) {
    case "diagonal":
      return (
        <div
          className={box}
          style={{
            background: `repeating-linear-gradient(45deg, transparent 0 12px, ${ink} 12px 19px)`,
          }}
        />
      );
    case "guilloche":
      return (
        <div
          className={box}
          style={{
            background: `repeating-linear-gradient(90deg, transparent 0 4px, ${ink} 4px 5px)`,
          }}
        />
      );
    case "waves":
      return (
        <svg className={box} viewBox="0 0 100 63" preserveAspectRatio="none" aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.14">
            <path d="M100 14 A 62 62 0 0 1 34 63" />
            <path d="M100 30 A 46 46 0 0 1 52 63" />
            <path d="M100 46 A 30 30 0 0 1 70 63" />
          </g>
        </svg>
      );
    case "geo":
      return (
        <svg className={box} viewBox="0 0 100 63" preserveAspectRatio="none" aria-hidden>
          <polygon points="100,0 100,36 58,0" fill={accent} opacity="0.4" />
          <polygon points="0,63 0,30 44,63" fill="currentColor" opacity="0.07" />
        </svg>
      );
    case "edge":
      return (
        <svg className={box} viewBox="0 0 100 63" preserveAspectRatio="none" aria-hidden>
          <rect x="0" y="0" width="6" height="63" fill={accent} />
          <rect x="7.5" y="0" width="1.4" height="63" fill={accent} opacity="0.45" />
        </svg>
      );
    case "airfrance":
      return (
        <>
          <div
            className={box}
            style={{
              background: `repeating-linear-gradient(90deg, transparent 0 4px, ${ink} 4px 5px)`,
            }}
          />
          <svg className={box} viewBox="0 0 100 63" preserveAspectRatio="none" aria-hidden>
            <rect x="0" y="7" width="100" height="6.5" fill="#002157" opacity="0.9" />
            <rect x="0" y="13.5" width="100" height="1.6" fill="#e00034" />
          </svg>
        </>
      );
    default:
      return null;
  }
}

/** Échelle de rendu d'une carte nommée : pleine largeur, ou vignette de liste. */
export type ProductCardSize = "md" | "sm";

/**
 * Gabarits des deux échelles. `sm` garde la même identité (fond de marque,
 * motif, wordmark, puce, réseau) mais retire le numéro masqué et le nom de la
 * carte : à 80 px de large ils ne sont plus lisibles, et la ligne de liste
 * affiche déjà le nom juste à côté. La largeur est fixée ici (et non par
 * l'appelant) pour que toutes les vignettes de l'outil s'alignent.
 */
const PRODUCT_SIZE: Record<
  ProductCardSize,
  { frame: string; pad: string; wordmark: string; chip: string; contactless: string; network: string }
> = {
  md: {
    frame: "w-full rounded-2xl shadow-xl",
    pad: "p-5",
    wordmark: "text-sm",
    chip: "h-7 w-9",
    contactless: "h-6 w-6",
    network: "rounded px-1.5 py-0.5 text-[10px] tracking-wider",
  },
  sm: {
    frame: "w-20 shrink-0 rounded-lg shadow-sm",
    pad: "p-1.5",
    wordmark: "text-[8px]",
    chip: "h-4 w-5",
    contactless: "h-3 w-3",
    network: "rounded-sm px-1 py-px text-[7px] tracking-wide",
  },
};

/**
 * Visuel d'une carte NOMMÉE, pour les fiches / listes de produits réels.
 *
 * - Si `card.image` est renseignée : affiche l'image officielle (sous licence
 *   d'affiliation), servie depuis /public via next/image.
 * - Sinon : rend un visuel fidèle à la marque (couleurs + wordmark émetteur +
 *   réseau), défini dans lib/card-brand.ts.
 *
 * Contrairement à CardVisual (décoratif), ce composant est INFORMATIF : il porte
 * un `alt` descriptif (utile pour l'accessibilité et l'indexation image).
 */
export function ProductCardVisual({
  card,
  className = "",
  sheen = false,
  priority = false,
  size = "md",
}: {
  card: Card;
  className?: string;
  sheen?: boolean;
  priority?: boolean;
  size?: ProductCardSize;
}) {
  const s = PRODUCT_SIZE[size];
  const alt = `Carte ${card.name} (${card.issuer})`;

  if (card.image) {
    return (
      <div
        className={[
          "relative aspect-[1.586/1] overflow-hidden ring-1 ring-black/5",
          s.frame,
          className,
        ].join(" ")}
      >
        <Image
          src={card.image}
          alt={alt}
          fill
          sizes={size === "sm" ? "80px" : "(max-width: 640px) 90vw, 400px"}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }

  const brand = cardBrand(card);
  // Encre du motif adaptée au fond : sombre sur carte claire, claire sur sombre.
  const onLight = brand.foreground !== "#ffffff";
  const ink = onLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
  return (
    <div
      role="img"
      aria-label={alt}
      className={[
        "relative aspect-[1.586/1] overflow-hidden ring-1 ring-black/10",
        s.frame,
        s.pad,
        sheen ? "card-sheen" : "",
        className,
      ].join(" ")}
      style={{ background: brand.background, color: brand.foreground }}
    >
      <CardPattern kind={brand.pattern} ink={ink} accent={brand.accent} />
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-1.5">
          <span
            className={`min-w-0 truncate font-bold leading-tight tracking-tight ${s.wordmark}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {brand.wordmark}
          </span>
          <Contactless className={`shrink-0 opacity-70 ${s.contactless}`} />
        </div>

        {size === "md" && (
          <div className="flex items-center gap-3">
            <Chip tone={brand.chip} className={s.chip} />
            <span className="font-mono text-sm tracking-widest opacity-80">
              ••••&nbsp;••••&nbsp;••••
            </span>
          </div>
        )}

        <div className="flex items-end justify-between gap-1.5">
          {size === "md" ? (
            <span className="max-w-[65%] text-xs font-medium leading-tight opacity-90">
              {card.name}
            </span>
          ) : (
            <Chip tone={brand.chip} className={s.chip} />
          )}
          <span
            className={`shrink-0 font-bold uppercase leading-tight ${s.network}`}
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            {card.network}
          </span>
        </div>
      </div>
    </div>
  );
}
