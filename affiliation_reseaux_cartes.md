# Où candidater : programmes d'affiliation par carte (CB180)

Cartographie des **programmes** d'affiliation pour chaque carte du catalogue :
via quel **réseau** (ou en direct) et **où candidater**. Ce ne sont PAS des liens
de tracking, ceux-ci te sont fournis par le réseau **après validation**, et sont
liés à ton compte éditeur (SIRET requis).

Légende accès : 🟢 compte Awin déjà existant · 🟡 nouveau compte réseau à créer ·
🔵 programme en direct · ⚪ pas de programme éditeur FR.

Commission = **par ouverture de compte validée** (CPA). ✅ = chiffre public confirmé ·
~ = estimation à confirmer dans le dashboard du réseau · ❌ = pas de programme.
Attention : la commission est **par compte ouvert**, pas par carte, plusieurs cartes
d'un même émetteur partagent en général la même rémunération.

| # | Carte | Émetteur | Réseau / Programme | Commission (CPA) | Où candidater | Accès |
|---|-------|----------|--------------------|:---:|---------------|:---:|
| 1 | BoursoBank Welcome | BoursoBank | **Awin** (annonceur 6992) | **~80 €** ✅ | ui.awin.com → *Boursorama Banque* | 🟢 |
| 2 | BoursoBank Ultim | BoursoBank | **Awin** (6992) | **~80 €** ✅ | idem | 🟢 |
| 3 | BoursoBank Ultim Metal | BoursoBank | **Awin** (6992) | **~80 €** ✅ | idem | 🟢 |
| 4 | Fortuneo Fosfo | Fortuneo | **TimeOne** (prog. 1325) | **~5,73 € (CPL/formulaire)** ✅ | performance.timeonegroup.com | 🟡 |
| 5 | Fortuneo Gold | Fortuneo | **TimeOne** (1325) | **CPL variable (bas)** ✅ | idem | 🟡 |
| 6 | Fortuneo World Elite | Fortuneo | **TimeOne** (1325) | **CPL variable (bas)** ✅ | idem | 🟡 |
| 7 | Hello Prime | Hello bank! (BNP) | **TimeOne** (prog. 2934) · aussi Kwanko | **non public**, à confirmer | performance.timeonegroup.com | 🟡 |
| 8 | Monabanq Uniq+ | Monabanq (Créd. Mutuel) | **Monalink** : direct Monabanq (sur Tradedoubler) ✅ | **non public**, à confirmer | monalink.com → *Inscrivez-vous* | 🔵 |
| 9 | Revolut Standard | Revolut | **Impact** (retail) | **à partir de ~10,50 €** ✅ | revolut.com → *Become a partner* | 🔵 |
| 10 | Revolut Premium | Revolut | **Impact** (retail) | **à partir de ~10,50 €** ✅ | idem | 🔵 |
| 11 | N26 Standard | N26 | **Programme direct** | **non public**, offre personnalisée | n26.com/fr-fr/affiliate | 🔵 |
| 12 | American Express Carte Gold | Amex France | **Aucun programme éditeur FR** | **0 €** ❌ | - (parrainage MGM seult) | ⚪ |
| 13 | Carte Air France KLM Amex Gold | Amex France | **Aucun programme éditeur FR** | **0 €** ❌ | - | ⚪ |

### Précisions commissions (vérifs de juillet 2026)

- **Fortuneo** paie ses **cartes** en **CPL faible** (~5,73 € par formulaire Fosfo, CPL variable sur Gold/World Elite). Les produits lucratifs de Fortuneo sont ailleurs : **Bourse ~81 €** et **Assurance-vie ~106 €** par formulaire, à garder en tête si tu ajoutes ces angles au site.
- **Hello bank!, Monabanq (Monalink), N26** : montants **non publiés**, visibles uniquement dans le dashboard après acceptation. Impossible à confirmer de l'extérieur.
- **BoursoBank ~80 €** et **Revolut « dès 10,50 € »** sont les seuls chiffres cartes publiquement confirmés.

## Regroupé par réseau (pour candidater efficacement)

- **Awin** 🟢 (ton compte existe) → **BoursoBank** (cartes 1-3). Vérifier aussi **Amex FR** dans l'annuaire annonceurs.
- **TimeOne** 🟡 (nouveau compte à créer) → **Fortuneo** (4-6) + **Hello bank!** (7). Deux gros émetteurs d'un coup.
- **Impact** 🔵 → **Revolut** (9-10), via *Become a partner*.
- **Direct** 🔵 → **N26** (11), email affiliate@n26.com.
- **Monalink** 🔵 → **Monabanq** (8), inscription sur monalink.com. Programme **en direct** : 100 % de la rému, sans intermédiaire, avec dashboard et affiliate manager. ✅ confirmé.
- **Amex** ⚪ (12-13) : **pas de programme éditeur FR confirmé** pour les cartes. Amex opère de l'affiliation via CJ Affiliate dans d'autres pays (Canada, Pays-Bas) mais pas de programme FR public. Reste le **parrainage MGM** (il faut détenir la carte). Monétisation la plus difficile du catalogue → à laisser en dernier.

## Couverture

- **11 cartes / 13** ont un programme d'affiliation confirmé (Awin, TimeOne, Impact, N26 direct, Monalink).
- **2 cartes Amex** = pas de programme éditeur FR, parrainage MGM uniquement, à traiter en dernier ou via `source_url` (page officielle) en attendant.
- Priorité déjà lancée : **Revolut (Impact)**, voir `affiliation_revolut_partnerize.md`
  (⚠️ à corriger : Revolut passe par **Impact**, pas Partnerize, la recherche l'a confirmé).

## Rappel

Pour chaque programme : tu candidates → validation (1 j. à 3 sem.) → le réseau te
donne un **lien de tracking** → tu me le colles → je le branche dans
`data/cards.json` (`affiliate.url`) → test A→Z. Aucun changement de code entre les
réseaux : le champ `affiliate.url` + la route `/go/[id]` gèrent tout.

## Sources

- BoursoBank/Awin : boursorama.com/aide/affiliation · ui.awin.com/merchant-profile-terms/6992
- Fortuneo/TimeOne : performance.timeonegroup.com/fr/editeurs/programme/affiliation-fortuneo-1325.html
- Hello bank!/TimeOne : performance.timeonegroup.com/fr/editeurs/programme/affiliation-hellobank!-2934.html
- Revolut/Impact : revolut.com/en-US/become-a-revolut-affiliate · affiliates@revolut.com
- N26 direct : n26.com/fr-fr/affiliate · affiliate@n26.com
- Monabanq/Monalink : monalink.com (programme direct confirmé)
- Amex : programme via CJ Affiliate hors FR (Canada, Pays-Bas) ; pas de programme éditeur FR confirmé
