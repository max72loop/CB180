# Candidature affiliation : Revolut (via Impact), CB180

Mise en place **par étapes** du premier programme d'affiliation professionnel
(CPA) de CB180. Réseau : Revolut, opéré par la plateforme **Impact**
(impact.com). Objectif : obtenir un lien de tracking validé, puis le brancher
dans `data/cards.json` (`affiliate.url` des cartes Revolut).

> Champs à compléter par toi : `[SIRET]`, `[Prénom Nom]`, l'email pro
> `contact@cb180.xyz` (vérifie qu'il existe et relève les messages, les
> valideurs y écrivent).

---

## Étape B1 : Créer le compte éditeur et accéder au programme

1. Va sur la page partenaires de Revolut : recherche **« Revolut affiliate
   program »** → tu arrives sur leur page « Partners / Affiliates » (opérée par
   **Impact**).
2. Clique **« Become a partner » / « Join »**. Tu crées un compte **partenaire
   Impact** (ou tu te connectes s'il existe déjà — un seul compte Impact donne
   accès à tous les programmes hébergés chez eux).
3. Renseigne le profil média avec la **fiche d'identité** ci-dessous (Étape B2).
4. Postule au **programme Revolut** ; ajoute le message de l'Étape B3 si un champ
   « message / description de la promotion » est proposé.

---

## Étape B2 : Fiche d'identité du site (à coller dans le formulaire)

| Champ | Valeur |
|---|---|
| Nom du site / éditeur | CB180 |
| URL | https://cb180.xyz |
| Pays / marché | France |
| Langue | Français |
| Catégorie | Comparateur / simulateur : cartes bancaires & comptes |
| Modèle de promotion | Contenu éditorial + SEO (comparatifs, guides, fiches), simulateur de coût |
| Type de rémunération | CPA (ouverture de compte / carte validée) |
| Entité | Micro-entreprise, SIRET `[SIRET]` |
| Email pro | contact@cb180.xyz |
| Moyens d'acquisition | Référencement naturel, communautés finances perso, contenu |
| Sources de trafic interdites (à cocher « non utilisées ») | Cashback, coupons, adware, email non sollicité, marque en enchères SEA |

---

## Étape B3 : Message de candidature (copier-coller)

> Bonjour,
>
> Je souhaite intégrer votre programme d'affiliation pour le site CB180
> (https://cb180.xyz), un comparateur et simulateur d'information sur les cartes
> bancaires françaises, déjà en ligne.
>
> CB180 propose un outil gratuit qui calcule le coût annuel réel d'une carte
> selon les usages de l'utilisateur, puis présente une information chiffrée et
> objective sur les alternatives du marché. Le positionnement repose sur la
> transparence : les critères de classement sont explicités et le caractère
> affilié des liens est affiché clairement, conformément aux obligations des
> comparateurs en ligne.
>
> L'audience visée, des particuliers actifs sur l'optimisation bancaire et les
> finances personnelles, correspond directement au profil de vos futurs
> clients. L'acquisition passe par le référencement naturel et les communautés
> spécialisées. La carte Revolut dispose déjà d'une fiche dédiée, d'un
> comparatif et d'un simulateur de coût sur le site.
>
> Je serais ravi d'échanger sur les modalités du partenariat.
> Bien cordialement, [Prénom Nom], CB180.

---

## Pages de conformité (à fournir si demandé, toutes en ligne)

- Mentions légales : https://cb180.xyz/mentions-legales
- Confidentialité : https://cb180.xyz/confidentialite
- Fonctionnement du comparateur : https://cb180.xyz/comment-ca-marche
- Fiche Revolut (page d'atterrissage du lien) : https://cb180.xyz/cartes/revolut-standard

---

## Étape C : Après validation (ensemble)

Une fois le programme **accepté**, Impact te fournit un **lien de tracking**
(deep link, généralement sur un domaine `*.pxf.io` — ex.
`https://revolut.pxf.io/...` — pointant vers Revolut).

1. Tu me colles ce lien.
2. Je le mets dans `data/cards.json` → cartes `revolut-standard` / `-premium` /
   `-metal` :
   ```json
   "affiliate": {
     "network": "Revolut (Impact)",
     "url": "<ton lien de tracking Impact>",
     "est_commission_eur": 40,
     "status": "actif"
   }
   ```
3. Commit + push → le bouton « Voir l'offre » de la fiche Revolut redirige vers
   **ton** lien affilié, avec clic tracé en base (`/go/revolut-standard`).
4. On teste le parcours A→Z en prod (redirection + événement `click_affilie`),
   comme le test déjà réalisé en local.

---

## Étape D : Mesure bout-en-bout (clic → conversion → revenu)

La plomberie est en place côté CB180 (voir le commit `feat(tracking)`). Il reste
à la câbler à Impact.

### D1 — Sub-id (attribution du clic)

À chaque clic sur « Voir l'offre », la route `/go/[carte]` génère un `click_id`
opaque et l'injecte dans le lien de tracking en **sub-id**. Pour un lien Impact
(`*.pxf.io` ou réseau « Impact »), il est ajouté en paramètre **`subId1`** —
c'est la convention Impact, gérée automatiquement par `lib/affiliate.ts`.

> **À confirmer quand le vrai lien arrive** : si Impact attend le sub-id sous un
> autre nom, régler la variable d'env `AFFILIATE_SUBID_PARAM=<nom_du_param>` —
> aucun changement de code nécessaire.

### D2 — Réception de la conversion (revenu)

Impact suit la conversion **côté annonceur**. Deux voies pour récupérer le
revenu, par ordre de préférence :

1. **Postback / notification partenaire** (si Impact le propose pour ce
   programme) : le configurer vers l'endpoint agnostique
   ```
   https://cb180.xyz/api/postback?token=<POSTBACK_SECRET>
     &conversion_id={ActionId}
     &subid1={subId1}
     &commission={Payout}
     &currency={Currency}
     &status={Status}
   ```
   (les `{…}` sont les macros Impact ; adapter aux noms exacts fournis — l'endpoint
   accepte de nombreux alias : `subid`/`subid1`/`clickref`, `order_id`/
   `conversion_id`/`action_id`, `payout`/`commission`/`value`, etc.)
2. **À défaut**, réconciliation via l'**API / export Impact** : rapprocher notre
   `subId1` (renvoyé dans leurs rapports) avec nos clics. À câbler quand le
   programme est actif, si Impact n'expose pas de postback direct.

L'endpoint est **idempotent** (dédup sur `conversion_id`) : un postback rejoué
ou une mise à jour de statut (pending → approved → rejected) ne double-compte
jamais.

### D3 — Variables d'environnement (Vercel)

| Variable | Rôle |
|---|---|
| `POSTBACK_SECRET` | Secret partagé validant les appels de `/api/postback`. Sans lui, l'endpoint refuse tout. |
| `AFFILIATE_SUBID_PARAM` | *(optionnel)* Force le nom du paramètre de sub-id si Impact en exige un autre que `subId1`. |

### D4 — Lecture

Tableau de bord `/stats?key=<ADMIN_KEY>`, section **« Tunnel affilié &
revenu »** : clics → conversions → revenu confirmé, revenu par visiteur (RPV),
par clic (EPC), revenu potentiel, et détail par carte.

---

## Suivi

| Étape | Qui | Statut |
|---|---|---|
| Alignement marque CB180 | Moi | ✅ |
| Kit de candidature Revolut | Moi | ✅ (ce document) |
| Instrumentation du tunnel (clic → conversion → revenu) | Moi | ✅ |
| Création compte Impact + candidature | Toi | ⏳ |
| Validation programme Revolut | Revolut | ⏳ |
| Branchement du lien de tracking | Moi | ⏳ |
| Test A→Z en prod | Ensemble | ⏳ |
