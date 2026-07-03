import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Mentions légales — CB180",
};

// Mentions légales (LCEN). Les champs [À compléter] doivent être renseignés
// avant mise en ligne publique.

export default function MentionsLegalesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Mentions légales
        </h1>

        <Section title="Éditeur du site">
          <p>
            Le site CB180 est édité par <Todo>nom / raison sociale</Todo>,{" "}
            <Todo>statut juridique (micro-entreprise, société…)</Todo>.
          </p>
          <ul className="mt-2 list-none space-y-1">
            <li>Adresse : <Todo>adresse postale</Todo></li>
            <li>SIREN / SIRET : <Todo>numéro</Todo></li>
            <li>Contact : <Todo>adresse email de contact</Todo></li>
            <li>Directeur de la publication : <Todo>nom</Todo></li>
          </ul>
        </Section>

        <Section title="Hébergement">
          <p>
            Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut,
            CA 91789, États-Unis. Les données du questionnaire sont stockées via
            Supabase, sur une infrastructure située en Union européenne.
          </p>
        </Section>

        <Section title="Nature du service">
          <p>
            CB180 est un site d&apos;information et de comparaison des offres de
            cartes bancaires. CB180 n&apos;est pas intermédiaire en opérations de
            banque et en services de paiement. Les informations proviennent des
            documents tarifaires publics des établissements et ne constituent ni
            un conseil personnalisé ni une recommandation de souscription.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus du site (textes, éléments graphiques,
            mise en forme) est protégé. Toute reproduction sans autorisation est
            interdite. Les marques et logos des établissements cités appartiennent
            à leurs titulaires respectifs.
          </p>
        </Section>

        <Section title="Liens affiliés">
          <p>
            Certains liens sortants sont affiliés et peuvent donner lieu au
            versement d&apos;une commission à l&apos;éditeur. Cette rémunération
            est indiquée en clair et n&apos;influence pas le classement des
            cartes. Voir la page « Comment fonctionne le comparateur ».
          </p>
        </Section>

        <p className="mt-10 text-xs text-slate-400">
          Dernière mise à jour : <Todo>date</Todo>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 text-amber-800">
      [à compléter : {children}]
    </span>
  );
}
