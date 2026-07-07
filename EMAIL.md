# Email pro `contact@cb180.xyz`

Configuration de la boîte mail professionnelle du domaine. Deux briques
indépendantes : **ImprovMX** pour recevoir, **Resend (SMTP)** pour envoyer.
DNS géré chez **Vercel** (nameservers `ns1/ns2.vercel-dns.com`).

> ⚠️ **Ne jamais committer la clé API Resend (`re_…`).** Elle n'est stockée
> qu'à deux endroits : le dashboard Resend et la config Gmail « Envoyer en tant
> que ». Ce dépôt est public.

## Architecture

| Sens | Fournisseur | Coût |
|---|---|---|
| **Réception** contact@ → Gmail `landrymax72givet@gmail.com` | ImprovMX (alias + forwarding) | gratuit |
| **Envoi** depuis contact@ (via Gmail « Send as ») | Resend SMTP | gratuit (3 000 mails/mois, 100/jour) |

- La réception marche via un **alias ImprovMX** `contact@ → landrymax72givet@gmail.com`.
- L'envoi passe par le **SMTP Resend** branché dans Gmail (Comptes et
  importation → Envoyer des e-mails en tant que).

## Config SMTP dans Gmail (« Envoyer en tant que »)

| Champ | Valeur |
|---|---|
| Nom | `CB180` |
| Adresse | `contact@cb180.xyz` |
| Serveur SMTP | `smtp.resend.com` |
| Port | `465` (SSL) |
| Nom d'utilisateur | `resend` *(littéralement ce mot, pas l'adresse)* |
| Mot de passe | la clé API Resend `re_…` *(voir dashboard Resend → API Keys)* |

## Enregistrements DNS (Vercel → équipe `max72loops-projects` → Domains → cb180.xyz)

> Les DNS s'éditent au **niveau équipe** (`/max72loops-projects/~/domains`),
> pas dans les Settings du projet `cb-180`.

| Type | Name | Value | Rôle |
|---|---|---|---|
| MX | `@` (racine) | `mx1.improvmx.com` (10), `mx2.improvmx.com` (20) | Réception ImprovMX |
| TXT | `@` (racine) | `v=spf1 include:spf.improvmx.com ~all` | SPF ImprovMX |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (10) | Return-path Resend (région UE) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF Resend/SES |
| TXT | `resend._domainkey` | `p=MIGf…` *(clé RSA, générée par Resend)* | DKIM Resend |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contact@cb180.xyz` | DMARC |

Autres TXT racine présents et sans lien avec l'email : `google-site-verification=…`
(Search Console).

## Vérifier / dépanner

- **Réception** : envoyer un mail à contact@ *depuis une autre adresse* (pas ton
  propre Gmail — Gmail bloque les mails à soi-même et ImprovHX le signale).
- **Envoi + authentification** : test de score sur
  [mail-tester.com](https://www.mail-tester.com) (viser 9–10/10).
- **Audit DNS rapide** :
  ```bash
  nslookup -type=MX cb180.xyz
  nslookup -type=TXT cb180.xyz
  nslookup -type=TXT send.cb180.xyz
  nslookup -type=TXT resend._domainkey.cb180.xyz
  nslookup -type=TXT _dmarc.cb180.xyz
  ```

## À ne pas confondre

`RESEND_API_KEY` / `RESEND_FROM` dans `.env.example` concernent l'**email de
résultat envoyé automatiquement par l'appli** (transactionnel), pas cette boîte
`contact@`. Ce sont deux usages distincts de Resend.
