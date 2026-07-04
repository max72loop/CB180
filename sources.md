# CB180, sources de prix des cartes bancaires

> Référentiel des sources pour le scraping hebdomadaire.
> Dernière vérification manuelle des URL, 4 juillet 2026.
> Priorité aux sources officielles (grilles tarifaires des banques). Les comparateurs servent de contrôle croisé, pas de source primaire.

## Principe

Chaque carte du `cards_v0.json` doit être rattachée à au moins une source officielle. Les comparateurs (Selectra, MoneyVox, Finance Héros, Milesopedia) servent uniquement à détecter un écart, pas à écrire la valeur finale.

Statut des sources, `officiel` = grille tarifaire ou page produit de la banque, `croisement` = comparateur tiers à consulter pour vérification.

---

## Sources officielles (primaires)

### BoursoBank

| Champ | URL |
|---|---|
| Page produit carte Ultim | https://www.boursobank.com/banque/carte-bancaire-gratuite-ultim |
| Frais à l'étranger, retraits, plafonds | https://www.boursobank.com/banque/cartes-sans-frais-et-services-a-l-etranger |
| Brochure tarifaire (PDF, source de vérité tarifs) | https://www.boursorama.com/content/brochure_tarifaire/boursorama_bt.pdf |

Champs à extraire, cotisation mensuelle, bonus de bienvenue (variable, actuellement jusqu'à 160 €), condition de revenus débit différé (2 400 € nets ou 6 000 € d'encours, ancienneté 6 mois depuis août 2025), plafonds paiement/retrait, frais retrait devises (1,69 % au delà du quota).

Attention, le bonus de bienvenue et les offres promo retraits changent souvent (offre temporaire retraits gratuits jusqu'au 30/09/2026 par exemple). À rescraper chaque semaine sans exception.

### Fortuneo

| Champ | URL |
|---|---|
| Compte courant et cartes | https://www.fortuneo.fr/compte-et-cartes |
| Carte Fosfo | https://www.fortuneo.fr/compte-bancaire/comparateur-cartes-bancaires-gratuites |
| Carte Gold Mastercard | https://www.fortuneo.fr/compte-bancaire/carte-gold-mastercard |
| Carte World Elite | https://www.fortuneo.fr/compte-bancaire/carte-world-elite-mastercard |
| Conditions d'octroi (revenus par carte) | https://www.fortuneo.fr/compte-bancaire/conditions-octroi-carte-bancaire |

Champs à extraire, condition de revenus par carte (Fosfo sans condition, Gold 2 200 € nets ou 10 000 € d'épargne, World Elite 4 000 €), cotisation (gratuites sous réserve d'un paiement par mois, sinon frais 3 € / 9 € / 50 € par trimestre selon la carte), bonus de bienvenue (code BIENVENUEFTO, variable), frais étranger (0 € paiements et retraits sur les trois cartes), plafonds de retrait.

### Revolut

| Champ | URL |
|---|---|
| Page tarifs / plans | https://www.revolut.com/fr-FR/our-pricing-plans/ |

Champs à extraire, prix mensuel par plan, Standard gratuit, Plus 3,99 €, Premium, Metal, Ultra. Plafonds de retrait gratuit par plan, frais de change au delà des plafonds.

ATTENTION, hausse tarifaire au 9 juillet 2026. Premium passe de 9,99 € à 10,99 €, Metal de 16,99 € à 18,99 €, Ultra de 55 € à 60 €. Standard et Plus inchangés. Les nouveaux clients paient déjà le nouveau tarif, les abonnés annuels basculent à leur échéance. Le premier scrape après le 9 juillet doit capturer ces nouveaux montants, ne pas figer les anciens.

### Hello bank!

| Champ | URL |
|---|---|
| Page Hello Prime | https://www.hellobank.fr/fr/offre/compte-et-cartes/hello-prime/ |
| Page compte courant (toutes offres) | https://www.hellobank.fr/fr/offre/compte-et-cartes/compte-courant/ |
| Page tarifs | https://www.hellobank.fr/fr/tarifs/ |
| Document d'information tarifaire (PDF) | https://m-webservices.hellobank.fr/rsc/contrib/pdf/tarifs-hellobank.pdf |

Champs à extraire, cotisation Hello Prime, offres Hello One (sans condition de revenus). Bonus de bienvenue (variable, jusqu'à 280 € début juillet 2026).

ATTENTION, changement de tarification Hello Prime au 1er octobre 2026. Nouvelle règle, 0 €/mois sous réserve de verser 1 500 €/mois sur le compte, sinon 6 €/mois. Condition de revenus 1 500 € nets minimum pour souscrire. Le scraper doit détecter ce basculement.

### Monabanq

| Champ | URL |
|---|---|
| Page compte courant (toutes offres) | https://www.monabanq.com/fr/produits/compte_courant.html |
| Compte Pratiq+ (Visa Classic) | https://www.monabanq.com/fr/pratiq-plus-visa-classic.html |
| Compte Uniq (Visa Classic) | https://www.monabanq.com/fr/uniq-visa-classic.html |
| Compte Uniq+ (Visa Premier) | https://www.monabanq.com/fr/uniq-plus-visa-premier.html |
| Guide de tarification (PDF) | https://www.monabanq.com/fr/pdf/tarifications/monabanq_tarification-no.pdf |

Champs à extraire, cotisation par offre (Pratiq+ 3 €/mois, Uniq 6 €/mois, Uniq+ 12 €/mois, aucune carte gratuite), plafonds paiement/retrait, frais étranger (Uniq+ 0 € partout, Uniq et Pratiq+ limités), bonus de bienvenue (variable, jusqu'à 280 €). Particularité, cotisation mensuelle mais aucune carte gratuite, contrairement à la plupart des concurrents.

### N26

| Champ | URL |
|---|---|
| Page tarifs / plans | https://n26.com/fr-fr/tarifs |

Champs à extraire, prix mensuel par plan, Standard gratuit, Smart 4,90 €, Go 9,90 €, Metal 16,90 €. Sans condition de revenus. Retraits gratuits par mois selon le plan, frais retrait devises (1,7 % Standard/Smart, gratuit Go/Metal). IBAN allemand (DE), à noter dans le comparateur car certains créanciers français peuvent le refuser.

ATTENTION, l'offre "You" a été renommée "Go". Certains comparateurs affichent encore "You" ou un prix Go à 7,90 €, alors que la source officielle N26 donne 9,90 €. Traiter la source officielle comme prioritaire et signaler l'écart si un comparateur diverge.

### Nickel

| Champ | URL |
|---|---|
| Page tarifs officielle | https://nickel.eu/fr/tarifs |
| Document d'information tarifaire (PDF) | https://nickel.eu/sites/default/files/Tariff-Information-document-Nickel_FR_fr.pdf |
| Conditions générales et tarifaires (PDF, à jour 1er juillet 2026) | https://nickel.eu/sites/default/files/General-Terms-and-Conditions_FR_fr.pdf |

Champs à extraire, cotisation annuelle par carte (Nickel Classic 25 €/an, My Nickel 10 € sur 5 ans, Chrome 55 €/an, Metal 105 €/an), plafonds paiement/retrait, frais étranger (paiement 1,50 € Classic, gratuit Chrome/Metal, retrait hors zone euro 2,50 € Classic, 1,50 € Chrome, gratuit Metal), commission dépôt espèces 3 %.

Particularité, la cotisation Nickel se règle une fois par an, pas chaque mois. Prévoir dans le moteur une normalisation annuel vers mensuel pour comparer avec les autres cartes. Nickel est un établissement de paiement, pas une banque, sans condition de revenus, accessible aux interdits bancaires.

### American Express France

| Champ | URL |
|---|---|
| Toutes les cartes (comparateur officiel) | https://www.americanexpress.com/fr-fr/carte-de-paiement/toutes-les-cartes/ |
| Univers de cartes | https://www.americanexpress.com/fr-fr/carte-de-paiement/types-cartes/ |
| Cartes propriétaires (Blue, Gold, Platinum) | https://www.americanexpress.com/fr-fr/carte-de-paiement/types-cartes/cartes-proprietaires/ |
| Cartes premium (Platinum) | https://www.americanexpress.com/fr-fr/carte-de-paiement/types-cartes/cartes-premium/ |
| Cartes Air France KLM Amex (Silver, Gold, Platinum) | https://www.americanexpress.com/fr-fr/carte-de-paiement/types-cartes/cartes-air-france-klm-amex/ |

Champs à extraire, cotisation annuelle ou mensuelle par carte (par exemple Gold 252 €/an soit 21 €/mois, Platinum 792 €/an soit 66 €/mois, AF KLM Silver 65 €/an sinon gratuite au delà de 10 000 € de dépenses, AF KLM Platinum 708 €/an soit 59 €/mois), taux d'accumulation de points ou Miles, offres de bienvenue (variables, en points/Miles ou en euros).

Note importante, Amex est un émetteur de carte, pas une banque de dépôt. En France, une carte Amex se rattache à un compte bancaire existant, ou se souscrit via une banque partenaire (Fortuneo pour Green/Gold/Platinum, BNP Paribas, SG). Le modèle ne se compare pas directement à un compte type BoursoBank ou N26. Bien cadrer dans le moteur CB180 comment tu positionnes ces cartes, comme carte adossée et non comme compte principal.

---

## Sources de croisement (secondaires)

À consulter pour détecter un écart, jamais comme valeur finale. Ces pages affichent une date de dernière vérification, utile pour juger la fraîcheur.

| Source | URL | Portée |
|---|---|---|
| Selectra, cartes BoursoBank | https://selectra.info/finance/banques/boursorama-banque/carte-bancaire | BoursoBank multi cartes |
| Selectra, carte Ultim | https://selectra.info/finance/banques/boursorama-banque/ultim | Ultim détail |
| MoneyVox, Ultim | https://www.moneyvox.fr/banque-en-ligne/ultim-boursorama | BoursoBank |
| Finance Héros, Ultim | https://finance-heros.fr/avis-carte-bancaire/avis-carte-boursorama-ultim/ | BoursoBank |
| Milesopedia, Ultim | https://milesopedia.fr/cartes/carte-ultim-boursobank/ | BoursoBank + valorisation miles |
| Selectra, cartes Nickel | https://selectra.info/finance/banques/nickel/cartes-bancaires | Nickel multi cartes |
| JeChange, Nickel | https://www.jechange.fr/banques/nickel | Nickel |

---

## Paramètres internes (hors scraping)

Ces valeurs ne viennent d'aucune source externe, ce sont des paramètres de calcul définis pour le moteur CB180. À ne pas scraper, à versionner à la main.

| Carte | Paramètre de valorisation |
|---|---|
| Amex Air France KLM Gold | 1 mile / € à 0,01 €, facteur de réalisme 70 % |
| Amex Gold | 1 point / € à 0,012 € |
| Revolut Premium | 1 point / € à 0,005 € |
| Revolut Standard | 0 |

---

## Notes pour le scraper

Les PDF de brochure tarifaire (BoursoBank, Hello bank!, Monabanq) sont la source de vérité pour les cotisations et plafonds. Le HTML des pages produit peut retarder sur les promos.

Prévoir un champ `date_verif_source` par carte, pour tracer la fraîcheur.

Prévoir une alerte si la valeur scrapée diffère de plus de X % de la valeur en base, à confirmer manuellement avant écriture.

Les CPA d'affiliation (commissions Awin/Kwanko) ne sont PAS dans ces sources, ils se vérifient dans l'interface réseau, pas par scraping public.

Trois basculements tarifaires datés à surveiller de près, Revolut le 9 juillet 2026 (hausse Premium/Metal/Ultra), Hello Prime le 1er octobre 2026 (nouvelle règle de gratuité), et le renommage N26 You vers Go déjà effectif. Le scraper doit capturer les nouveaux montants à ces dates et ne pas figer les anciens.

Toutes les URL officielles ont été vérifiées le 4 juillet 2026. Aucune entrée ne reste `à confirmer`. Le référentiel est directement exploitable pour le premier run.
