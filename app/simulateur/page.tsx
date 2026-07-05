// app/simulateur/page.tsx
// Page serveur : charge les cartes côté serveur (données) et délègue
// l'interactivité au composant client Simulateur (moteur exécuté côté client).

import Simulateur from "@/components/questionnaire/Simulateur";
import { cards } from "@/lib/cards";
import { getProfil } from "@/lib/profils";

export const metadata = {
  title: "Simulateur : CB180",
};

export default async function SimulateurPage({
  searchParams,
}: {
  searchParams: Promise<{ profil?: string }>;
}) {
  const { profil } = await searchParams;
  // Arrivée depuis une page profil (/profils/<slug>) : on pré-remplit le
  // parcours et on atterrit sur l'estimation express, sans polluer le funnel.
  const preset = profil ? getProfil(profil) : undefined;
  if (preset) {
    return (
      <Simulateur
        cards={cards}
        initialAnswers={preset.answers}
        initialPhase="quickResult"
        analytics={false}
      />
    );
  }

  return <Simulateur cards={cards} />;
}
