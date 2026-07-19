import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { cards, publicCards } from "@/lib/cards";

export const metadata = {
  title: "Mentions légales",
};

// Mentions légales (LCEN) + informations obligatoires du comparateur
// (Code de la consommation, décret n°2016-505).

const LAST_UPDATE = "19 juillet 2026";

export default function MentionsLegalesPage() {
  const total = cards.length;
  const listed = publicCards().length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Mentions légales
        </h1>

        <Section title="Éditeur du site">
          <p>
            Le site CB180 est édité par <strong>Max Landry</strong>,{" "}
            entrepreneur individuel (micro-entreprise).
          </p>
          <ul className="mt-2 list-none space-y-1">
            <li>Adresse : 80 rue Robespierre, 93170 Bagnolet</li>
            <li>SIREN : 952&nbsp;242&nbsp;428 — SIRET : 952&nbsp;242&nbsp;428&nbsp;00011</li>
            <li>
              Contact :{" "}
              <a
                href="mailto:contact@cb180.xyz"
                className="text-indigo-600 hover:underline"
              >
                contact@cb180.xyz
              </a>
            </li>
            <li>Directeur de la publication : <strong>Max Landry</strong></li>
          </ul>
        </Section>

        <Section title="Hébergement">
          <p>
            L&apos;application est hébergée par <strong>Vercel Inc.</strong>{" "}
            (<a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              vercel.com
            </a>), 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis ; les
            fonctions serveur sont exécutées en région{" "}
            <strong>Union européenne (Paris)</strong>.
          </p>
          <p className="mt-2">
            La base de données (audits anonymisés et adresses email) est fournie
            par <strong>Turso</strong> (libSQL), en région{" "}
            <strong>Paris (Union européenne)</strong>.
          </p>
        </Section>

        <Section title="Nature du service">
          <p>
            CB180 est un site d&apos;information et de comparaison des offres de
            cartes bancaires. <strong>CB180 n&apos;est pas intermédiaire</strong>{" "}
            en opérations de banque et en services de paiement (IOBSP) et ne
            fournit ni conseil personnalisé ni recommandation de souscription. Les
            informations proviennent des documents tarifaires publics des
            établissements.
          </p>
        </Section>

        <Section title="Informations sur le comparateur">
          <p className="text-slate-500">
            Conformément aux obligations d&apos;information des comparateurs en
            ligne (Code de la consommation, décret n°2016-505) :
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Critère de classement.</strong> Les cartes sont classées
              exclusivement par <strong>coût annuel net croissant</strong>,
              calculé avec le même barème transparent pour chaque carte. Aucun
              critère subjectif n&apos;intervient. La méthode est détaillée sur la
              page{" "}
              <Link href="/comment-ca-marche" className="text-indigo-600 hover:underline">
                « Comment ça marche »
              </Link>.
            </li>
            <li>
              <strong>Référencement non payant.</strong> Aucun établissement ne
              peut payer pour figurer dans le comparateur ni pour être mieux
              classé. Le classement ne dépend d&apos;aucune contrepartie
              financière.
            </li>
            <li>
              <strong>Relations et rémunération.</strong> Certains liens sortants
              sont <strong>affiliés</strong> : une commission peut être versée à
              l&apos;éditeur si vous ouvrez une carte via un lien. Cette
              rémunération <strong>n&apos;influence pas le classement</strong>,
              établi objectivement selon le coût annuel net.
            </li>
            <li>
              <strong>Périmètre.</strong> Le comparateur porte sur une{" "}
              <strong>sélection</strong> de {total} cartes (dont {listed}{" "}
              présentées publiquement et 2 cartes de réseau servant de référence).
              Il <strong>n&apos;est pas exhaustif</strong> et ne couvre pas
              l&apos;intégralité du marché.
            </li>
            <li>
              <strong>Mise à jour.</strong> Chaque carte porte une{" "}
              <strong>date de dernière vérification</strong>, indiquée sur sa
              fiche. Les données sont revues périodiquement à partir des documents
              tarifaires publics des établissements.
            </li>
          </ul>
        </Section>

        <Section title="Données personnelles">
          <p>
            Le traitement des données est décrit dans la{" "}
            <Link href="/confidentialite" className="text-indigo-600 hover:underline">
              politique de confidentialité
            </Link>
            . Le service est conçu pour fonctionner sans donnée identifiante :
            seules des fourchettes anonymisées sont traitées, et l&apos;email
            (facultatif) est stocké séparément.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus du site (textes, éléments graphiques,
            mise en forme) est protégé. Toute reproduction sans autorisation est
            interdite. Les marques et logos des établissements cités appartiennent
            à leurs titulaires respectifs et ne sont pas reproduits.
          </p>
        </Section>

        <Section title="Médiation de la consommation">
          <p>
            CB180 est un service d&apos;information gratuit : aucune vente ni
            contrat de consommation n&apos;est conclu avec l&apos;utilisateur. Le
            cas échéant, les coordonnées d&apos;un médiateur seront indiquées ici.
          </p>
        </Section>

        <p className="mt-10 text-xs text-slate-500">
          Dernière mise à jour : {LAST_UPDATE}.
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
