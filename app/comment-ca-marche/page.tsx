import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";

export const metadata = {
  title: "Comment fonctionne le comparateur : CB180",
};

// Page exigée par le décret comparateurs (art. L111-5 code de la consommation) :
// critères de classement, pondération, caractère affilié des liens.

export default function CommentCaMarchePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Comment fonctionne le comparateur
        </h1>
        <p className="mt-4 text-slate-600">
          CB180 est un outil d&apos;information. Cette page explique, en toute
          transparence, comment le classement est établi et comment le site est
          financé.
        </p>

        <Section title="Le critère de classement">
          <p>
            Les cartes sont triées selon un <strong>unique critère objectif</strong> :
            le coût annuel net, exprimé en euros. En cas d&apos;égalité, le tri
            départage par cotisation annuelle puis par ordre alphabétique, afin
            que le résultat soit toujours déterministe et reproductible.
          </p>
        </Section>

        <Section title="Comment le coût annuel net est calculé">
          <p>Pour chaque carte, à partir des usages que vous saisissez :</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>+ la cotisation annuelle,</li>
            <li>
              + les frais de change estimés (taux de la carte × dépenses
              annuelles hors zone euro),
            </li>
            <li>+ les frais de retrait à l&apos;étranger estimés,</li>
            <li>
              − la valeur de la prime de bienvenue, <strong>amortie sur 3 ans</strong>,
            </li>
            <li>− la valeur estimée du cashback,</li>
            <li>
              − la valeur estimée des miles/points, uniquement si vous déclarez
              vouloir les optimiser.
            </li>
          </ul>
          <p className="mt-3">
            Le résultat est présenté selon <strong>deux vues</strong> : le coût de
            la <strong>1ʳᵉ année</strong> (prime incluse) et le coût{" "}
            <strong>récurrent</strong> des années suivantes (hors prime, qui ne se
            répète pas). Le <strong>même barème et les mêmes hypothèses</strong>{" "}
            s&apos;appliquent à toutes les cartes. Le détail poste par poste est
            affiché et dépliable sur chaque résultat.
          </p>
        </Section>

        <Section title="Les hypothèses de calcul">
          <ul className="mt-1 list-disc space-y-1.5 pl-5">
            <li>Montant moyen supposé d&apos;un retrait à l&apos;étranger : 100 €.</li>
            <li>
              Prime de bienvenue <strong>amortie sur 3 ans</strong> : une prime
              n&apos;est pas récurrente, on la lisse pour ne pas fausser le coût
              des années suivantes.
            </li>
            <li>
              Valeur des miles/points estimée prudemment (facteur de réalisme de
              0,7, pour tenir compte des points expirés ou non utilisés).
            </li>
            <li>
              Situation actuelle estimée à partir d&apos;un profil de frais de
              carte de réseau traditionnelle et de la cotisation que vous
              indiquez.
            </li>
          </ul>
          <p className="mt-3">
            Les montants du catalogue sont indicatifs et chaque carte porte une
            date de dernière vérification. Ils proviennent des documents
            tarifaires publics des établissements.
          </p>
        </Section>

        <Section title="Le financement et les liens affiliés">
          <p>
            Certains liens sont affiliés : si vous ouvrez une carte via un lien,
            l&apos;émetteur peut verser une commission à CB180. Cette commission
            est <strong>affichée en clair</strong> sur chaque carte et{" "}
            <strong>n&apos;influence pas le classement</strong>, qui reste trié par
            coût annuel net. Aucune donnée n&apos;est transmise aux établissements :
            c&apos;est vous qui cliquez, de votre propre initiative.
          </p>
        </Section>

        <Section title="Ce que CB180 n'est pas">
          <p>
            CB180 n&apos;est pas intermédiaire en opérations de banque et en
            services de paiement. Le site informe et compare, il ne prescrit pas
            et ne formule aucune recommandation de souscription. Pour toute
            décision, lisez les conditions générales de la banque et évaluez
            votre situation personnelle.
          </p>
        </Section>

        <div className="mt-10">
          <Link
            href="/simulateur"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:-translate-y-0.5"
          >
            Lancer la simulation
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}
