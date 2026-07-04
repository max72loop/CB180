import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Politique de confidentialité",
};

// Politique de confidentialité RGPD. Le questionnaire ne collecte que des
// fourchettes anonymisées ; l'email (facultatif) est stocké séparément.

const LAST_UPDATE = "4 juillet 2026";

export default function ConfidentialitePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Politique de confidentialité
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          CB180 est conçu pour fonctionner avec le minimum de données et sans
          information identifiante. Cette page décrit ce qui est collecté,
          pourquoi, et les droits dont vous disposez.
        </p>

        <Section title="Responsable de traitement">
          <p>
            Le responsable de traitement est l&apos;éditeur du site,{" "}
            <Todo>nom / raison sociale de l&apos;éditeur</Todo>. Pour toute
            question relative à vos données, écrivez à{" "}
            <a href="mailto:contact@cb180.xyz" className="text-indigo-600 hover:underline">contact@cb180.xyz</a>.
          </p>
        </Section>

        <Section title="Données collectées">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Vos réponses au questionnaire, exclusivement sous forme de{" "}
              <strong>fourchettes</strong> (dépenses, revenus, fréquences…). Aucun
              montant exact, aucun nom de banque, aucune donnée identifiante ne
              sont demandés. Ces données sont <strong>anonymes</strong> : elles ne
              permettent pas de vous identifier.
            </li>
            <li>
              Des <strong>événements de parcours anonymes</strong> (arrivée,
              démarrage, résultat, clic sur une offre), enregistrés côté serveur
              sans cookie ni identifiant publicitaire, pour mesurer l&apos;usage
              de l&apos;outil.
            </li>
            <li>
              Si vous le choisissez, votre <strong>adresse email</strong>, pour
              recevoir votre résultat ou être prévenu si une carte moins chère
              apparaît. Elle est facultative, soumise à consentement, et stockée{" "}
              <strong>séparément</strong> de vos réponses (reliée uniquement par un
              identifiant de session opaque).
            </li>
          </ul>
        </Section>

        <Section title="Finalités et base légale">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Réaliser la simulation et afficher le résultat :{" "}
              <strong>exécution du service</strong> que vous demandez.
            </li>
            <li>
              Mesure d&apos;audience anonymisée pour améliorer l&apos;outil :{" "}
              <strong>intérêt légitime</strong>.
            </li>
            <li>
              Envoi du résultat ou d&apos;informations par email :{" "}
              <strong>consentement</strong>, séparé et révocable à tout moment.
            </li>
          </ul>
        </Section>

        <Section title="Destinataires et sous-traitants">
          <p>
            Vos données <strong>ne sont pas transmises aux établissements
            bancaires</strong>. Aucun profil ni coordonnée n&apos;est envoyé à une
            banque. Les liens affiliés n&apos;emportent aucune transmission de
            données : vous cliquez de votre propre initiative.
          </p>
          <p className="mt-2">
            Les sous-traitants techniques sont l&apos;hébergeur{" "}
            <strong>Vercel</strong> (fonctions exécutées en région UE) et la base
            de données <strong>Turso</strong> (région Paris, UE). Les données au
            repos sont stockées en <strong>Union européenne</strong>.
          </p>
        </Section>

        <Section title="Durée de conservation">
          <p>
            Les audits anonymisés sont conservés au maximum{" "}
            <strong>25 mois</strong> à des fins de mesure d&apos;audience. Les
            adresses email sont conservées jusqu&apos;à votre désinscription, et au
            plus <strong>3 ans</strong> après le dernier contact.{" "}
            <span className="text-slate-400">
              (durées ajustables selon votre politique)
            </span>
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
            rectification, d&apos;opposition, de limitation et d&apos;effacement,
            ainsi que du droit de retirer votre consentement. Pour les exercer,
            écrivez à <a href="mailto:contact@cb180.xyz" className="text-indigo-600 hover:underline">contact@cb180.xyz</a>. Les réponses au
            questionnaire étant anonymes, elles ne peuvent pas être rattachées à
            une personne ; le droit d&apos;effacement s&apos;applique pleinement à
            votre adresse email. Vous pouvez également introduire une réclamation
            auprès de la{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              CNIL
            </a>
            .
          </p>
        </Section>

        <Section title="Cookies et stockage local">
          <p>
            CB180 <strong>n&apos;utilise pas de cookie de traçage</strong> ni de
            stockage navigateur (type localStorage) pour vos réponses : elles
            restent en mémoire le temps de la simulation et sont perdues si vous
            fermez la page. Toute mesure d&apos;audience reste anonymisée et
            décrite sur cette page.
          </p>
        </Section>

        <p className="mt-8 text-sm text-slate-600">
          Voir aussi les{" "}
          <Link href="/mentions-legales" className="text-indigo-600 hover:underline">
            mentions légales
          </Link>{" "}
          et la page{" "}
          <Link href="/comment-ca-marche" className="text-indigo-600 hover:underline">
            « Comment ça marche »
          </Link>
          .
        </p>

        <p className="mt-8 text-xs text-slate-400">
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

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 text-amber-800">
      [à compléter : {children}]
    </span>
  );
}
