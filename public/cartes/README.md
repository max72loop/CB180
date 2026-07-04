# Images officielles des cartes

Déposez ici les visuels **officiels** des cartes, fournis sous licence par vos
programmes d'affiliation (Awin, Kwanko, ou le kit média de la banque). Ne
récupérez pas d'images depuis les sites des banques sans droit d'usage.

## Comment les activer

1. Nommez le fichier avec l'**identifiant de la carte** (champ `id` dans
   `data/cards.json`), par ex. `revolut-standard.webp`.
2. Renseignez le chemin dans `data/cards.json` sur la carte concernée :

   ```json
   { "id": "revolut-standard", "image": "/cartes/revolut-standard.webp" }
   ```

3. Sans le champ `image`, un visuel rendu fidèle à la marque
   (`lib/card-brand.ts`) s'affiche automatiquement, rien ne casse.

## Format recommandé

- **Ratio** : ~1.586 / 1 (proportion carte bancaire ISO). Le composant recadre
  en `object-cover`, prévoyez donc une image cadrée sur la carte.
- **Format** : `.webp` de préférence (ou `.png` avec transparence).
- **Largeur** : ≥ 800 px pour rester net sur la fiche.

## Identifiants disponibles

boursobank-welcome · boursobank-ultim · boursobank-metal · fortuneo-fosfo ·
fortuneo-gold · fortuneo-world-elite · hellobank-prime · monabanq-uniq-plus ·
revolut-standard · revolut-premium · n26-standard · amex-gold · amex-afklm-gold
