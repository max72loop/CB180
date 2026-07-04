# Rapport de vérification : 15 cartes bancaires (projet Grappi)

**Date de vérification :** 3 juillet 2026
**Méthode :** chaque valeur chiffrée a été cherchée sur la source officielle de l'émetteur (page produit, brochure ou conditions générales tarifaires). Aucun forum ni blog n'a servi de source à un chiffre. Les valeurs non confirmables officiellement sont mises à `null` ou `0` avec la mention « non confirmé » dans `verif_note`. Distinction systématique zone euro / hors zone euro (devises).

Le fichier de données complet, avec toutes les URL, dates et citations, est `cards_v1_verified.json`.

## Fiabilité globale

**FIABILITÉ GLOBALE : élevée.** 13 des 15 cartes sont confirmées par une source officielle sur la quasi-totalité des champs chiffrés. Les 2 cartes de référence génériques (Visa Premier et Gold Mastercard « banque traditionnelle ») restent en valeurs indicatives non sourcées, conformément à ton choix, car aucune brochure unique n'existe pour elles.

## Corrections importantes par rapport à tes valeurs de départ

Trois écarts significatifs ont été relevés entre le fichier `cards_v0` et les sources officielles, à intégrer en priorité.

La cotisation **American Express Gold** n'est pas de 180 €/an mais de **252 €/an (21 €/mois)** : une hausse est entrée en vigueur le 1er juillet 2026 selon les conditions générales officielles. La page web tarifaire affiche encore l'ancien tarif de 192 €, elle n'est pas à jour ; c'est le PDF des CG qui fait foi.

La cotisation de la **Carte Air France KLM Amex Gold** n'est pas de 199 € mais de **252 €/an** également (mêmes conditions générales).

Le tarif **Revolut Premium** est de **10,99 €/mois** et non 9,99 € comme indiqué. La commission de change de la carte Amex Gold est de **2,80 %** (et non 2,5 %).

## Points de vigilance sur les frais en devises (hors zone euro)

Sur les cartes gratuites « voyage », les paiements et retraits en devises sont réellement gratuits et illimités chez **Fortuneo** (Fosfo, Gold, World Elite), **BoursoBank Metal**, **Hello Prime** et **Monabanq Uniq+**, au taux réseau sans marge de l'émetteur. Attention toutefois : « sans frais » côté banque ne supprime pas le taux de change du réseau ni les éventuels frais du distributeur étranger.

Sur les BoursoBank **Welcome** et **Ultim**, les retraits en devises ne sont gratuits que dans la limite du quota (1/mois pour Welcome, 3/mois pour Ultim), au-delà 1,69 % par retrait. Une offre temporaire les rend gratuits illimités du 1er juillet au 30 septembre 2026, mais elle n'est pas structurelle et n'a pas été retenue comme valeur de base.

Chez **Revolut Standard**, le change est gratuit jusqu'à 1 000 €/mois puis 1 %, avec une majoration de 1 % le week-end même sous le plafond ; les retraits DAB sont gratuits jusqu'à 5 retraits ou 200 €/mois, puis 2 % (minimum 1 €). Chez **Revolut Premium**, le change est illimité sans frais mais les retraits restent plafonnés à 400 €/mois gratuits puis 2 %.

Chez **N26 Standard**, les paiements étrangers sont gratuits, mais les retraits hors zone euro coûtent 1,7 % dès le premier (le quota de 2 retraits gratuits ne concerne que la zone euro).

Les cartes **American Express** sont les plus coûteuses à l'étranger : 2,80 % de commission de change sur les paiements et, sur les retraits, une avance d'espèces à 2 % (minimum 3 €) qui se cumule avec la commission de change, sans aucun retrait gratuit.

## Primes de bienvenue : forte volatilité

Les primes récurrentes de base confirmées sont : **Fortuneo Fosfo 30 €**, **Fortuneo Gold 80 €**, **Hello Prime ~80 €** (l'affichage « jusqu'à 280 € » est gonflé par 200 € de bons d'achat conditionnés à la mobilité bancaire). 

Ont été mises à `null` ou `0` faute de base récurrente confirmable : les BoursoBank (seule visible = promo à code BBKOPE160, jusqu'à 160 €, expirant le 2 juillet 2026), Fortuneo World Elite (aucune prime affichée), Monabanq et N26 (aucune prime officielle chiffrée). Les 20 € de **Revolut** proviennent d'une promotion « NBA » conditionnelle (lien unique), donc volatile et non garantie. Le bonus de 20 000 miles de la carte **Air France KLM Amex** correspondait à une offre datée close le 1er juin 2026.

## Réserve de traçabilité

Pour BoursoBank et Fortuneo, les brochures tarifaires PDF existent et ont été localisées mais leur texte n'a pas pu être extrait ligne à ligne dans cet environnement ; les chiffres proviennent donc des pages produit officielles, concordantes avec les FAQ officielles. Les pages produit American Express étant rendues en JavaScript, les valeurs Amex s'appuient sur le PDF des conditions générales et la page tarifaire officielle, tous deux extractibles.

## Détail de fiabilité par carte

| Carte | Fiabilité | Réserve principale |
|---|---|---|
| BoursoBank Welcome | élevée | prime null (promo à code uniquement) |
| BoursoBank Ultim | élevée | prime null ; seuil revenus concerne le débit différé |
| BoursoBank Ultim Metal | élevée | cotisation mensuelle (annual_fee laissé null) |
| Fortuneo Fosfo | élevée | texte exact du PDF non lu |
| Fortuneo Gold | élevée | seuil 2 200 €/mois confirmé (hausse depuis 1 800) |
| Fortuneo World Elite | bonne | aucune prime affichée ; cotisation hors condition inconnue |
| Hello Prime | élevée | « sans frais » ≠ 0 % tout compris ; hausse tarif au 01/10/2026 |
| Monabanq Uniq+ | élevée | aucune prime officielle chiffrée |
| Revolut Standard | élevée | prime NBA volatile ; valeur RevPoint non publiée |
| Revolut Premium | élevée (prix annuel dérivé) | 10,99 €/mois (≠ 9,99) ; annual_fee calculé |
| N26 Standard | élevée | distinction forfait 2 € (euro) vs 1,7 % (devises) |
| American Express Gold | élevée | cotisation 252 € au 01/07/2026 (page web pas à jour) |
| Carte AF KLM Amex Gold | moyenne-élevée | prime miles close ; valeur mile estimée |
| Visa Premier (référence) | indicative | générique, non sourçable (choix assumé) |
| Gold Mastercard (référence) | indicative | générique, non sourçable (choix assumé) |
