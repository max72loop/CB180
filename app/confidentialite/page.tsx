import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Politique de confidentialité — CB180",
};

// Politique de confidentialité RGPD. Le questionnaire constitue un profilage :
// base légale, finalités, destinataires, durée, droits, hébergement UE.

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

        <Section title="Données collectées">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Vos réponses au questionnaire, exclusivement sous forme de{" "}
              <strong>fourchettes</strong> (dépenses, revenus, fréquences…). Aucun
              montant exact, aucun nom de banque, aucune donnée identifiante ne
              sont demandés.
            </li>
            <li>
              Si vous le choisissez, votre <strong>adresse email</strong>, pour
              recevoir votre résultat. Elle est facultative et stockée{" "}
              <strong>séparément</strong> de vos réponses.
            </li>
          </ul>
        </Section>

        <Section title="Finalités et base légale">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Réaliser la simulation et afficher le résultat :{" "}
              <strong>exécution du service</strong> demandé.
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

        <Section title="Destinataires">
          <p>
            Vos données ne sont pas transmises aux établissements bancaires.
            Aucun profil, aucune coordonnée n&apos;est envoyé à une banque. Les
            liens affiliés n&apos;emportent aucune transmission de données : vous
            cliquez de votre propre initiative.
          </p>
        </Section>

        <Section title="Hébergement et durée de conservation">
          <p>
            Les données sont hébergées sur une infrastructure Supabase située en{" "}
            <strong>Union européenne</strong>. Les réponses anonymisées sont
            conservées <Todo>durée, ex. 13 mois</Todo> ; les adresses email le
            sont jusqu&apos;à votre désinscription ou{" "}
            <Todo>durée, ex. 3 ans</Todo> d&apos;inactivité.
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
            rectification, d&apos;opposition, de limitation et d&apos;effacement,
            ainsi que du droit de retirer votre consentement. Pour les exercer,
            écrivez à <Todo>adresse email de contact</Todo>. Vous pouvez
            également introduire une réclamation auprès de la CNIL.
          </p>
        </Section>

        <Section title="Cookies et stockage local">
          <p>
            CB180 n&apos;utilise pas de stockage navigateur (type localStorage)
            pour vos réponses : elles restent en mémoire le temps de la
            simulation. Toute mesure d&apos;audience éventuelle sera anonymisée et
            décrite ici.
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
