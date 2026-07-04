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
  // Redirige l'URL Vercel de production vers le domaine canonique (évite le
  // contenu dupliqué). Les URLs de preview des PR (cb-180-*.vercel.app) ne
  // matchent pas cet hôte exact et restent donc accessibles telles quelles.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "cb-180.vercel.app" }],
        destination: "https://cb180.xyz/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
