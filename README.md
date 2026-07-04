# CB180

Comparateur et simulateur d'**information** sur les cartes bancaires françaises.
L'utilisateur renseigne ses usages, le site calcule le coût annuel réel de sa
carte et affiche une information chiffrée objective sur les alternatives, avec
liens affiliés transparents.

> **Positionnement légal (non négociable).** CB180 est un outil d'information,
> jamais un conseil personnalisé. On ne dit jamais « recommandé pour vous »,
> « meilleure carte pour vous », « souscrivez », « courtier ». On dit « résultat
> de la simulation », « cartes triées par coût annuel », « information
> chiffrée ». Voir `wording_iobsp.md`.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS v4 · Turso / libSQL (SQLite, région UE) · Vercel.
State en React natif (`useState`/`useReducer`), **aucun `localStorage`**.

### Stockage (Turso)

Setup complet dans [SETUP_TURSO.md](SETUP_TURSO.md). Trois tables (`audits`,
`emails`, `events`) séparées par un `session_id` opaque (voir [schema.sql](schema.sql)).
Variables d'env dans `.env.local` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`),
gabarit : [.env.example](.env.example). **Sans configuration, l'app fonctionne
et les routes renvoient `stored:false`** (aucun plantage).

- `lib/db.ts` : client libSQL paresseux + `saveAudit`/`saveEmail`/`logEvent`/`getStats` (server-only).
- `lib/audit.ts` : mapping réponses → `AuditProfile` (fourchettes anonymisées), client-safe.
- `app/api/{audit,email,event}/route.ts` : endpoints. L'audit + l'event `complete` sont
  postés automatiquement à l'arrivée sur les résultats ; l'email est optionnel et stocké séparément.

## Architecture (3 couches)

| Couche  | Emplacement            | Rôle |
| ------- | ---------------------- | ---- |
| Données | `data/cards.json`      | Catalogue des cartes (schéma ci-dessous), chargé côté serveur via `lib/cards.ts`. |
| Moteur  | `lib/engine.ts`        | Fonctions **pures**, zéro React. Calcul du coût annuel et classement objectif. |
| UI      | `app/`                 | Questionnaire multi-étapes et page résultats (sessions suivantes). |

## Moteur : `lib/engine.ts`

- `computeAnnualCost(card, profile, assumptions?)` → `CostBreakdown`.
  Coût net = cotisation + frais de change (`fx_fee_percent` × dépenses hors zone
  euro) + frais de retrait étranger − prime de bienvenue amortie − cashback
  estimé. Renvoie le **détail complet** de chaque poste (transparence).
- `rankCards(cards, profile, options?)` → `RankedCard[]` triées par coût annuel
  **croissant** (tri objectif, déterministe : coût, puis cotisation, puis nom).
- `computeCurrentSituationCost(profile)` → coût chiffré de la situation actuelle
  (modèle de carte de réseau traditionnelle + cotisation déclarée).
- `isEligible(card, profile)` → éligibilité au regard du revenu déclaré.

### Champs `[moteur]` dans `cards.json`

Le schéma fourni décrit `foreign_withdrawal` et `cashback` en **texte libre**
(source d'affichage, non calculable). Pour rendre le calcul déterministe, chaque
carte porte des dérivés numériques **optionnels** : `foreign_withdrawal_fee_percent`,
`foreign_withdrawal_flat_eur`, `free_foreign_withdrawals_per_month`,
`cashback_rate_percent`, `cashback_cap_eur`, `min_monthly_income_eur`. Ils sont à
vérifier en même temps que les politiques texte dont ils dérivent.

### Hypothèses de calcul (explicites, surchargées)

- Montant moyen d'un retrait étranger : **100 €**.
- Amortissement de la prime de bienvenue : **1 an** (la totalité compte en année 1).
- Situation actuelle : fx **2,7 %**, retrait **2,9 % + 3 €**, 0 retrait gratuit.

## Tests

```bash
npm install
npm test        # vitest run : trois profils types + invariants + données réelles
```

## Schéma de carte

`id, name, issuer, network, tier, monthly_fee_eur, annual_fee_eur,
free_condition, fx_fee_percent, foreign_withdrawal, insurances_level, cashback,
miles_program, welcome_bonus_eur, affiliate {network, est_commission_eur},
target_profiles, last_verified, source_url` (+ dérivés `[moteur]` ci-dessus).

## Reste à faire (sessions suivantes)

- Questionnaire multi-étapes (8–10 questions, fourchettes, mobile-first) + mapping fourchette → valeur.
- Page résultats (situation actuelle, classement détaillé, liens affiliés avec commission affichée, « dernière vérification »).
- ~~Stockage : table `audits` (profil anonymisé) + email séparé + event de complétion~~ ✅ fait (Turso).
- Pages conformité : mentions légales, confidentialité RGPD, « comment fonctionne le comparateur ».
