# CB180, setup Turso en 10 minutes

## 1. Installer le CLI et créer la base

```bash
# installer le CLI Turso
curl -sSfL https://get.tur.so/install.sh | bash

# se connecter (ouvre le navigateur)
turso auth signup

# créer la base, région Paris pour la conformité UE et la latence
turso db create cb180 --location cdg

# récupérer l'URL de connexion
turso db show cb180 --url

# générer un token d'authentification
turso db tokens create cb180
```

## 2. Charger le schéma

```bash
turso db shell cb180 < schema.sql
```

## 3. Variables d'environnement

Dans `.env.local` (jamais commité, ajoute, le à `.gitignore`) ,

```
TURSO_DATABASE_URL=libsql://cb180-xxxxx.turso.io
TURSO_AUTH_TOKEN=ton_token_ici
```

Sur Vercel, ajoute ces deux variables dans Settings, Environment Variables.

## 4. Installer le client

```bash
npm install @libsql/client
```

## 5. Utilisation dans le code

Le calcul se fait côté client (ton moteur TypeScript pur), tu n'envoies au serveur que le profil anonymisé et le résultat déjà calculé. Exemple d'appel depuis la page résultats ,

```typescript
// après calcul du classement côté client
const res = await fetch("/api/audit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    profile,   // les fourchettes du questionnaire
    result: {
      top_card_id: ranking[0].id,
      current_annual_cost: currentCost,
      best_annual_gain: currentCost - ranking[0].annualCost,
    },
  }),
});
const { sessionId } = await res.json();
// sessionId sert ensuite à relier l'email si l'utilisateur le laisse
```

## Pourquoi ce découpage

Le profil (fourchettes, aucune donnée identifiante) et l'email vivent dans deux tables séparées, reliées seulement par un id de session opaque. Ça respecte la règle RGPD posée dès le départ, et si un jour tu dois supprimer un email sur demande, tu n'affectes pas les statistiques agrégées des audits.

## Volumétrie, aucun souci

Un audit pèse 1 à 2 Ko. Le plan gratuit Turso couvre des centaines de millions de lignes lues par mois et plusieurs Go de stockage, tu es tranquille pour très longtemps. Le stockage ne sera jamais ta contrainte, la distribution l'est.

## Bonus, tes stats kill/continue en une commande

La fonction `getStats()` de `db.ts` te sort les trois chiffres qui comptent pour le verdict du 31 janvier, audits complétés, clics affiliés, emails collectés. Tu peux l'exposer sur une petite page admin protégée ou la lire en shell ,

```bash
turso db shell cb180 "SELECT COUNT(*) FROM audits"
```
