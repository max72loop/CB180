// app/simulateur/page.tsx
// Page serveur : charge les cartes côté serveur (données) et délègue
// l'interactivité au composant client Simulateur (moteur exécuté côté client).

import Simulateur from "@/components/questionnaire/Simulateur";
import { cards } from "@/lib/cards";

export const metadata = {
  title: "Simulateur : CB180",
};

export default function SimulateurPage() {
  return <Simulateur cards={cards} />;
}
