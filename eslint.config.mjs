// eslint.config.mjs
// Config plate ESLint 9. `next lint` étant déprécié (retiré en Next 16), le
// script `npm run lint` appelle l'ESLint CLI directement.
//
// « next/core-web-vitals » : règles Next + accessibilité + Core Web Vitals.
// « next/typescript »      : règles TypeScript recommandées.

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Le préfixe « _ » marque un binding volontairement inutilisé. Le cas qui
      // compte ici est le destructuring qui RETIRE un champ d'un objet (cf.
      // lib/cards.ts, qui écarte `verif_note` du payload client) : la variable
      // n'existe que pour que le rest la laisse de côté — ne pas l'utiliser EST
      // l'intention, pas un oubli.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default config;
