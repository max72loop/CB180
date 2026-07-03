import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

// Inter pour le texte courant, Sora (géométrique) pour les titres — auto-hébergées.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CB180 — Comparateur d'information sur les cartes bancaires",
  description:
    "Outil d'information : renseignez vos usages, obtenez le coût annuel chiffré de votre carte et le classement objectif des alternatives. CB180 n'est pas intermédiaire en opérations de banque.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
