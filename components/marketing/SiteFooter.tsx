// components/marketing/SiteFooter.tsx
// Pied de page commun. Porte les liens légaux obligatoires (LCEN, décret
// comparateurs, RGPD) et la mention de non-intermédiation IOBSP.

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import PriceAlertSignup from "@/components/marketing/PriceAlertSignup";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        {/* Bandeau d'alerte tarifaire : capture email récurrente et légitime */}
        <div className="mb-10 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Les tarifs des cartes changent chaque année
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Recevez une alerte par email si le coût d&apos;une carte augmente,
              ou si une option moins chère apparaît. Gratuit, désinscription en
              un clic.
            </p>
          </div>
          <PriceAlertSignup source="footer" />
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <Logo size={24} />
            <p className="text-sm leading-relaxed text-slate-500">
              Comparateur et simulateur d&apos;information sur les cartes
              bancaires françaises.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Le comparateur
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/simulateur" className="text-slate-600 hover:text-slate-900">
                  Lancer la simulation
                </Link>
              </li>
              <li>
                <Link href="/cartes" className="text-slate-600 hover:text-slate-900">
                  Toutes les cartes
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-slate-600 hover:text-slate-900">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/banques" className="text-slate-600 hover:text-slate-900">
                  Banques
                </Link>
              </li>
              <li>
                <Link
                  href="/comment-ca-marche"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Comment fonctionne le comparateur
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Légal
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">
            CB180 est un site d&apos;information et de comparaison des offres de
            cartes bancaires. CB180 n&apos;est pas intermédiaire en opérations de
            banque et en services de paiement. Les informations proviennent des
            documents tarifaires publics des établissements et ne constituent ni
            un conseil personnalisé ni une recommandation de souscription.
            Certains liens sont affiliés et n&apos;influencent pas le classement.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            © {new Date().getFullYear()} CB180. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
