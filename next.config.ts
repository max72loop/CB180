import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @libsql/client embarque des binaires natifs : on le laisse hors du bundle
  // webpack pour éviter les erreurs/blocages de compilation des routes API.
  serverExternalPackages: ["@libsql/client"],
  // Épingle la racine de traçage sur ce projet (évite l'ambiguïté quand un
  // lockfile parent existe, ex. en monorepo ou dossier utilisateur).
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
