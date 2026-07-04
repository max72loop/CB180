# Déployer CB180 sur Vercel

Next.js + Vercel = zéro config. Le dépôt GitHub est déjà prêt
(`github.com/max72loop/CB180`), la CI passe, le build génère 197 pages.

## 1. Créer la base Turso (région Paris)

Voir `SETUP_TURSO.md` en détail. En résumé :

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create cb180 --location cdg      # Paris (UE, RGPD)
turso db shell cb180 < schema.sql          # charge les 3 tables
turso db show cb180 --url                  # -> TURSO_DATABASE_URL
turso db tokens create cb180               # -> TURSO_AUTH_TOKEN
```

> Le site fonctionne **sans** Turso (dégradation propre : pas d'audits/emails/
> events persistés). Tu peux déployer d'abord, brancher la base ensuite.

## 2. Importer le projet dans Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → choisir
   `max72loop/CB180`.
2. Vercel détecte Next.js automatiquement (aucune commande à changer).
3. **Root Directory** : laisser la racine du repo (`.`).
4. Avant de cliquer *Deploy*, ajouter les **variables d'environnement** (étape 3).

Une fois connecté, **chaque push sur `main` redéploie automatiquement** (et les
PR obtiennent une preview).

## 3. Variables d'environnement (Vercel → Settings → Environment Variables)

| Variable | Valeur | Requis |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | l'URL publique finale (ex. `https://cb180.xyz`, ou l'URL `*.vercel.app` au début) | **oui** (canoniques, sitemap, OG) |
| `TURSO_DATABASE_URL` | depuis `turso db show cb180 --url` | pour l'analytics |
| `TURSO_AUTH_TOKEN` | depuis `turso db tokens create cb180` | pour l'analytics |
| `ADMIN_KEY` | une chaîne secrète (accès à `/stats`) | pour l'analytics |

Les mettre pour les 3 environnements (Production, Preview, Development).

## 4. Domaine

Vercel → **Settings → Domains** → ajouter ton domaine et suivre la config DNS.
Puis **mettre à jour `NEXT_PUBLIC_SITE_URL`** avec ce domaine et redéployer (sinon
les URLs canoniques/sitemap pointeraient vers l'ancienne valeur).

## 5. Vérifications post-déploiement

- [ ] `/` s'affiche, le simulateur tourne de bout en bout
- [ ] `/cartes` et une fiche `/cartes/fortuneo-gold` s'affichent
- [ ] `/sitemap.xml` liste bien les fiches + comparaisons avec le bon domaine
- [ ] `/robots.txt` pointe vers `/sitemap.xml`
- [ ] Aperçu de partage OK (coller une URL de fiche dans un validateur OpenGraph)
- [ ] `/stats?key=TON_ADMIN_KEY` s'ouvre (si Turso configuré)

## 6. Référencement (après mise en ligne)

1. [Google Search Console](https://search.google.com/search-console) → ajouter la
   propriété (domaine), vérifier.
2. **Sitemaps** → soumettre `https://TON_DOMAINE/sitemap.xml`.
3. Idem [Bing Webmaster Tools](https://www.bing.com/webmasters).

C'est tout : à partir de là, le SEO déjà en place (fiches, comparaisons, JSON-LD,
OG) commence à être indexé.
