// lib/site.ts
// URL publique du site — SOURCE UNIQUE. Surchargée en production par la variable
// d'environnement NEXT_PUBLIC_SITE_URL (Vercel) ; à défaut, la valeur ci-dessous.
// Sert aux URLs canoniques, au sitemap, aux images Open Graph et aux emails.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cb180.xyz";
