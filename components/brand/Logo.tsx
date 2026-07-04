// components/brand/Logo.tsx
// Marque CB180 (cf. audit logo / identité).
// Le symbole illustre un « demi-tour 180° » : le trait monte, fait demi-tour et
// redescend en flèche — l'argent de la carte qui revient. Verrouillage
// principal : le symbole est calé sur la hauteur de capitale et la ligne de
// base du mot, habillé du dégradé de marque *réel* du site (indigo → violet →
// fuchsia). Le mot pose « CB » en sombre et « 180 » en dégradé.

// Stops du dégradé de marque, alignés sur --brand-gradient (globals.css).
const BRAND_STOPS = [
  { offset: "0", color: "#4f46e5" },
  { offset: "0.5", color: "#7c3aed" },
  { offset: "1", color: "#d946ef" },
] as const;

// Tracé nu du symbole, dans un viewBox calé pour occuper la hauteur de capitale
// une fois posé sur la ligne de base (sommet de l'arc = ligne de capitale,
// pointe de flèche = ligne de base).
function GlyphPaths({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <>
      <path
        d="M32,78 L32,42 A18,18 0 0 1 68,42 L68,56"
        stroke={stroke}
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
      <path d="M54,55 L82,55 L68,83 Z" fill={fill} />
    </>
  );
}

interface LogoProps {
  /** Affiche le mot « CB180 » à côté du symbole. */
  withWordmark?: boolean;
  /** Taille du mot en px ; le symbole s'aligne sur sa hauteur de capitale. */
  size?: number;
  className?: string;
  /** Variante de couleur du mot (sombre sur fond clair, ou clair sur sombre). */
  tone?: "dark" | "light";
}

// Symbole seul, en pastille au dégradé de marque (favicon, avatars, usages
// hors-lockup). Reste l'export par défaut pour compatibilité.
export default function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-[30%] bg-brand shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="24 18 60 65"
        fill="none"
        style={{ height: size * 0.56, width: "auto" }}
      >
        <GlyphPaths stroke="#fff" fill="#fff" />
      </svg>
    </span>
  );
}

export function Logo({
  withWordmark = true,
  size = 24,
  className = "",
  tone = "dark",
}: LogoProps) {
  const glyph = (
    <svg
      viewBox="24 18 60 65"
      fill="none"
      aria-hidden
      style={{ height: "0.72em", width: "auto" }}
    >
      <defs>
        <linearGradient id="cb180-glyph" x1="0" y1="0" x2="1" y2="1">
          {BRAND_STOPS.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <GlyphPaths stroke="url(#cb180-glyph)" fill="url(#cb180-glyph)" />
    </svg>
  );

  if (!withWordmark) {
    return (
      <span
        className={`inline-flex ${className}`}
        style={{ fontSize: size }}
        aria-label="CB180"
      >
        {glyph}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-baseline gap-[0.24em] ${className}`}
      style={{ fontSize: size, fontFamily: "var(--font-display)" }}
    >
      {glyph}
      <span
        className={`font-extrabold leading-none tracking-tight ${
          tone === "light" ? "text-white" : "text-slate-900"
        }`}
      >
        CB<span className="text-gradient">180</span>
      </span>
    </span>
  );
}
