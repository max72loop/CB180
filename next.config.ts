import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @libsql/client embarque des binaires natifs : on le laisse hors du bundle
  // webpack pour éviter les erreurs/blocages de compilation des routes API.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
