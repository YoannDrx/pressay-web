# pressay-web

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

## Migration Clerk → Better Auth

1. Appliquer `backend/db/migrations/0009_better_auth_foundation.sql`, puis
   `0010_better_auth_account_issuer.sql` sur une branche Neon de staging.
2. Configurer les variables Better Auth des deux projets et conserver Clerk
   pendant la fenêtre de rollback.
3. Depuis `backend`, exécuter `pnpm auth:migrate-clerk` pour le dry-run, puis
   `pnpm auth:migrate-clerk -- --apply`. Les IDs Clerk sont conservés ; les
   données commerciales ne changent pas. Les sessions ne sont pas importées.
4. Activer `AUTH_PROVIDER=better-auth` en staging, tester Google, passkey, TOTP,
   l’espace compte, l’admin et la connexion macOS PKCE.
5. Basculer la production. Retirer Clerk seulement après la période de rollback.

## Déploiement

- production : `press-say.app` ;
- redirection permanente : `www.press-say.app` → apex ;
- staging protégé : `staging.press-say.app` ;
- API : `api.press-say.app` et `api-staging.press-say.app`.

Le domaine est actuellement enregistré chez OVH et doit être relié au projet
Vercel après validation du déploiement Preview. Les analytics sont absents par
défaut ; toute mesure future doit être opt-in et sans contenu utilisateur.
