# pressay-web

La livraison compte/administration, sa recette et son déploiement sont décrits dans
[le guide compte et administration](docs/ACCOUNT_ADMIN_ROLLOUT.md).

Site public et espace compte de Pressay, construit avec Next.js 16. Le domaine
canonique est `https://press-say.app`; l’API Hono reste séparée sur
`https://api.press-say.app/v1`.

## Développement

```sh
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

Sans fournisseur d’identité configuré, le site public, le pricing et le
téléchargement restent fonctionnels ; les pages de connexion et paiement
affichent un état de bêta fermée. Better Auth est auto-hébergé dans ce projet :
Google OAuth, sessions, passkeys, TOTP et le fournisseur OAuth 2.1 macOS
utilisent les tables `auth_*` de Neon. Aucun secret Better Auth, Google ou JWT
ne doit utiliser le préfixe `NEXT_PUBLIC_`.

## Identité

Better Auth est l’unique fournisseur d’identité (Google, Apple, passkeys, TOTP
et fournisseur OAuth 2.1 de l’app macOS). La migration depuis Clerk est
terminée : le code, la dépendance et les domaines CSP Clerk ont été retirés.
Les variables `CLERK_*` et `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` peuvent être
supprimées de tous les environnements Vercel.

Avant le premier déploiement en Better Auth 1.7.7, exécuter
`docs/migrations/2026-10-11-better-auth-1.7.7-account-issuer.sql` sur Neon
(colonne `auth_accounts.issuer` rendue facultative).

Le Cloud supprime l’identité web par `POST /api/internal/identity-deletion`
(JWT HS256 signé avec `PRESSAY_INTERNAL_JWT_SECRET`, émetteur
`PRESSAY_CLOUD_INTERNAL_JWT_ISSUER`, audience `pressay-web-internal`, 5 min
maximum). Les jetons du proxy serveur portent l’audience
`PRESSAY_WEB_PROXY_JWT_AUDIENCE` (`pressay-web-proxy` par défaut), identique
côté Cloud.

Le proxy navigateur `/api/pressay/*` ne relaie que les couples méthode/route
listés dans `lib/pressay-proxy-routes.ts` ; les routes `me` n’y passent jamais.
La suppression de compte passe par `/api/auth/delete-user` (connexion de moins
de 10 minutes exigée par Better Auth). Le jeton proxy transmet l’heure de
connexion de la session (`pressay_auth_at`), que le Cloud revérifie avant
toute suppression.

## Pages publiques, langue et région

Les pages publiques (`/fr`, `/en`, tarifs, téléchargement, sécurité, pages
légales) n’initialisent pas le client Better Auth et ne font aucune requête de
session : l’en-tête pointe simplement vers `/account`, dont la mise en page
porte le menu de session. Elles restent rendues à la demande, car la CSP exige
un nonce par requête.

`/` et `/download` redirigent (307) vers la langue du visiteur : cookie
`pressay_locale` s’il existe (dernière langue choisie ou lue), sinon
`Accept-Language`, sinon le français (`x-default`). Les robots et aperçus de
liens reçoivent toujours le français, et les URL localisées (`/fr/...`,
`/en/...`) ne sont jamais redirigées.

Les fonctions Vercel tournent en `fra1` (`vercel.json`), à côté de Neon
(`aws-eu-central-1`) et de l’API (`fra1`).

## Vérifications

`pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm build` et
`pnpm test:e2e` tournent en CI (`.github/workflows/ci.yml`), ainsi que la suite
compte (`playwright.account.config.ts`) sur une base PostgreSQL jetable.

## Déploiement

- production : `press-say.app` ;
- redirection permanente : `www.press-say.app` → apex ;
- staging protégé : `staging.press-say.app` ;
- API : `api.press-say.app` et `api-staging.press-say.app`.

Le domaine est actuellement enregistré chez OVH et doit être relié au projet
Vercel après validation du déploiement Preview. Les analytics sont absents par
défaut ; toute mesure future doit être opt-in et sans contenu utilisateur.
