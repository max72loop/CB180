// app/alertes/page.tsx : page de statut des alertes tarifaires.
// Cible des redirections de confirmation et de désinscription (?etat=...).
// Non indexée : c'est une page transactionnelle, pas du contenu.

import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Alerte tarifaire : CB180",
  robots: { index: false, follow: false },
};

type Etat = "confirme" | "deja" | "desabonne" | "invalide";

const MESSAGES: Record<Etat, { icon: string; title: string; body: string }> = {
  confirme: {
    icon: "✓",
    title: "Alerte confirmée",
    body: "C'est fait : vous serez prévenu par email si le coût suivi évolue. Vous pouvez vous désinscrire à tout moment depuis n'importe lequel de nos emails.",
  },
  deja: {
    icon: "✓",
    title: "Alerte déjà active",
    body: "Cette alerte était déjà confirmée. Rien à faire de plus : vous êtes bien inscrit.",
  },
  desabonne: {
    icon: "✕",
    title: "Désinscription prise en compte",
    body: "Vous ne recevrez plus d'alerte tarifaire. Vous pouvez vous réinscrire quand vous le souhaitez depuis n'importe quelle fiche carte.",
  },
  invalide: {
    icon: "!",
    title: "Lien invalide ou expiré",
    body: "Ce lien n'a pas pu être traité. Réessayez depuis l'email reçu, ou réinscrivez-vous depuis une fiche carte.",
  },
};

export default async function AlertesPage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const { etat } = await searchParams;
  const key: Etat = (["confirme", "deja", "desabonne", "invalide"] as const).includes(
    etat as Etat,
  )
    ? (etat as Etat)
    : "invalide";
  const msg = MESSAGES[key];
  const positive = key === "confirme" || key === "deja";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold",
            positive
              ? "bg-emerald-50 text-emerald-600"
              : key === "desabonne"
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-50 text-amber-600",
          ].join(" ")}
        >
          {msg.icon}
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          {msg.title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {msg.body}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/simulateur"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5"
          >
            Lancer une simulation
          </Link>
          <Link
            href="/cartes"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Voir toutes les cartes
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
