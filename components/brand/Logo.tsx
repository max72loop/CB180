// components/brand/Logo.tsx
// Marque CB180 : un carré au dégradé de marque portant un arc « 180° »
// (retourner le coût de sa carte). Réutilisé par le header, le footer, etc.

interface LogoProps {
  /** Affiche le mot « CB180 » à côté de la marque. */
  withWordmark?: boolean;
  /** Taille du glyphe en px (le mot s'adapte). */
  size?: number;
  className?: string;
  /** Variante de couleur du mot (sur fond clair par défaut, ou clair sur sombre). */
  tone?: "dark" | "light";
}

export default function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-[30%] bg-brand shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        {/* Arc de demi-tour (180°) + pointe de flèche. */}
        <path
          d="M6 14a6 6 0 1 1 6 6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M12 20l-3.2-1.2M12 20l1.2-3.2"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  withWordmark = true,
  size = 28,
  className = "",
  tone = "dark",
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className={`text-[0.95rem] font-extrabold tracking-tight ${
            tone === "light" ? "text-white" : "text-slate-900"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          CB<span className="text-gradient">180</span>
        </span>
      )}
    </span>
  );
}
