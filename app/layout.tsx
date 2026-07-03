import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
