# Candidature affiliation : Revolut (via Partnerize), CB180

Mise en place **par étapes** du premier programme d'affiliation professionnel
(CPA) de CB180. Réseau : Revolut en direct, opéré par la plateforme
**Partnerize**. Objectif : obtenir un lien de tracking validé, puis le brancher
dans `data/cards.json` (`affiliate.url` de la carte Revolut).

> Champs à compléter par toi : `[SIRET]`, `[Prénom Nom]`, l'email pro
> `contact@cb180.xyz` (vérifie qu'il existe et relève les messages, les
> valideurs y écrivent).

---

## Étape B1 : Créer le compte éditeur et accéder au programme

1. Va sur la page partenaires de Revolut : recherche **« Revolut affiliate
   program »** → tu arrives sur leur page « Partners / Affiliates » (opérée par
   Partnerize).
2. Clique **« Become a partner » / « Join »**. Tu crées un compte **éditeur
   Partnerize** (ou tu te connectes s'il existe déjà).
3. Renseigne le profil éditeur avec la **fiche d'identité** ci-dessous (Étape B2).
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

Une fois le programme **accepté**, Partnerize te fournit un **lien de tracking**
(souvent un lien « deep link » de la forme `https://prf.hn/click/...` ou
`https://track.partnerize.com/...` pointant vers Revolut).

1. Tu me colles ce lien.
2. Je le mets dans `data/cards.json` → carte `revolut-standard` :
   ```json
   "affiliate": {
     "network": "Revolut (Partnerize)",
     "url": "<ton lien de tracking Partnerize>",
     "est_commission_eur": 40,
     "status": "actif"
   }
   ```
3. Commit + push → le bouton « Voir l'offre » de la fiche Revolut redirige vers
   **ton** lien affilié, avec clic tracé en base (`/go/revolut-standard`).
4. On teste le parcours A→Z en prod (redirection + événement `click_affilie`),
   comme le test déjà réalisé en local.

> Remarque attribution : Partnerize suit la conversion **côté annonceur**. On
> pourra en option passer notre `sid` (session) en sous-ID du lien pour
> réconcilier nos clics avec leurs conversions, à voir à l'étape C.

---

## Suivi

| Étape | Qui | Statut |
|---|---|---|
| Alignement marque CB180 | Moi | ✅ |
| Kit de candidature Revolut | Moi | ✅ (ce document) |
| Création compte Partnerize + candidature | Toi | ⏳ |
| Validation programme Revolut | Revolut | ⏳ |
| Branchement du lien de tracking | Moi | ⏳ |
| Test A→Z en prod | Ensemble | ⏳ |
