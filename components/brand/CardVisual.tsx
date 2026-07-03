// components/brand/CardVisual.tsx
// Visuel de carte bancaire générique (aucun vrai nom de banque) : puce,
// sans-contact, numéro masqué, réseau. Sert d'illustration produit sur la
// landing. Purement décoratif (aria-hidden).

type CardTone = "brand" | "dark" | "emerald" | "slate";

const TONES: Record<CardTone, string> = {
  brand: "bg-brand",
  dark: "bg-gradient-to-br from-slate-800 to-slate-950",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-700",
  slate: "bg-gradient-to-br from-slate-500 to-slate-700",
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

/** Puce EMV stylisée. */
function Chip() {
  return (
    <svg viewBox="0 0 40 32" className="h-7 w-9" aria-hidden>
      <rect
        x="1"
        y="1"
        width="38"
        height="30"
        rx="5"
        fill="#f5d67b"
        stroke="#d9b24a"
        strokeWidth="1"
      />
      <path
        d="M14 1v30M26 1v30M1 11h13M26 11h13M1 21h13M26 21h13"
        stroke="#c79a34"
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="14" y="11" width="12" height="10" rx="2" fill="#e6c25c" />
    </svg>
  );
}

/** Ondes « sans contact ». */
function Contactless() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/80" aria-hidden>
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

/**
 * Vignette de carte compacte pour les listes (en-tête de ligne de résultat).
 * Décorative, neutre : une petite carte au dégradé + puce.
 */
export function MiniCard({
  tone = "brand",
  className = "",
}: {
  tone?: CardTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={[
        "relative inline-flex h-8 w-12 shrink-0 items-end overflow-hidden rounded-md p-1 shadow-sm ring-1 ring-black/5",
        TONES[tone],
        className,
      ].join(" ")}
    >
      <span className="absolute left-1 top-1 h-2 w-2.5 rounded-[2px] bg-[#f5d67b]" />
      <span className="h-1 w-6 rounded-full bg-white/50" />
    </span>
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
        "relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl p-5 text-white shadow-xl ring-1 ring-white/10",
        TONES[tone],
        sheen ? "card-sheen" : "",
        className,
      ].join(" ")}
    >
      {/* Halo lumineux d'angle */}
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

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
