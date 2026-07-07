// lib/affiliate.ts
// Attribution affiliée : injecte NOTRE identifiant de clic (click_id) dans le
// lien du partenaire, en « sub-id ». Le réseau nous le renvoie ensuite dans le
// postback de conversion, ce qui referme la boucle revenu → clic → visiteur.
//
// Le format d'insertion dépend du réseau. Chaque réseau a sa convention (Impact
// pour Revolut : `subId1` ; Partnerize : segment `pubref` ; Awin & la plupart :
// `clickref`). L'ordre de résolution est pensé pour être sûr et ajustable SANS
// redéploiement de logique :
//   1. AFFILIATE_SUBID_PARAM (env) : nom de paramètre de query explicite —
//      levier pour forcer le format si un réseau attend autre chose ;
//   2. heuristique Partnerize (liens prf.hn / partnerize) : segment `/pubref:` ;
//   3. heuristique Impact (liens *.pxf.io / *.sjv.io / impact) : query `subId1` ;
//   4. repli générique (Awin & co.) : query `clickref`.
// En cas de doute, l'URL d'origine est renvoyée intacte (jamais de lien cassé).

/** Nom de paramètre de query forcé pour le sub-id (override de config). */
const SUBID_PARAM = process.env.AFFILIATE_SUBID_PARAM?.trim() || null;

/** True si l'URL ou le réseau relève de Partnerize (liens prf.hn / partnerize). */
function isPartnerize(host: string, network: string | null): boolean {
  return (
    /(^|\.)prf\.hn$/i.test(host) ||
    /partnerize/i.test(host) ||
    /partnerize/i.test(network ?? "")
  );
}

/** True si l'URL ou le réseau relève d'Impact (domaines de tracking pxf.io…). */
function isImpact(host: string, network: string | null): boolean {
  return (
    /(^|\.)(pxf\.io|sjv\.io|ojrq\.net|7eer\.net|evyy\.net)$/i.test(host) ||
    /impact/i.test(network ?? "")
  );
}

/**
 * Insère le sub-id façon Partnerize : un segment `/pubref:<id>` dans le chemin
 * du lien de tracking, avant `/destination:` s'il est présent (forme deeplink
 * `.../camref:XXX/pubref:<id>/destination:https://...`), sinon en fin de chemin.
 */
function withPartnerizePubref(url: string, clickId: string): string {
  const seg = `pubref:${encodeURIComponent(clickId)}`;
  // Déjà présent (ex. double passage) : on ne duplique pas.
  if (url.includes("/pubref:")) return url;
  const marker = "/destination:";
  const at = url.indexOf(marker);
  if (at !== -1) return `${url.slice(0, at)}/${seg}${url.slice(at)}`;
  return `${url.replace(/\/+$/, "")}/${seg}`;
}

/**
 * Renvoie l'URL affiliée enrichie de notre click_id en sub-id. `clickId` est un
 * uuid (sûr en URL). N'altère l'URL que si elle est http(s) et parsable.
 */
export function withClickRef(
  url: string,
  network: string | null,
  clickId: string,
): string {
  if (!url || !/^https?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);

    // 1. Override explicite : paramètre de query de config.
    if (SUBID_PARAM) {
      u.searchParams.set(SUBID_PARAM, clickId);
      return u.toString();
    }

    // 2. Partnerize : segment /pubref: dans le chemin.
    if (isPartnerize(u.hostname, network)) {
      return withPartnerizePubref(url, clickId);
    }

    // 3. Impact (Revolut) : paramètre de query subId1.
    if (isImpact(u.hostname, network)) {
      u.searchParams.set("subId1", clickId);
      return u.toString();
    }

    // 4. Repli générique (Awin & co.) : ?clickref=<id>.
    u.searchParams.set("clickref", clickId);
    return u.toString();
  } catch {
    return url;
  }
}
