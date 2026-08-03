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

Sans variables Clerk, le site public, le pricing et le téléchargement restent
fonctionnels ; les pages de connexion et paiement affichent un état de bêta
fermée. Aucun secret ne doit utiliser le préfixe `NEXT_PUBLIC_` en dehors de la
clé publiable Clerk.

## Déploiement

- production : `press-say.app` ;
- redirection permanente : `www.press-say.app` → apex ;
- staging protégé : `staging.press-say.app` ;
- API : `api.press-say.app` et `api-staging.press-say.app`.

Le domaine est actuellement enregistré chez OVH et doit être relié au projet
Vercel après validation du déploiement Preview. Les analytics sont absents par
défaut ; toute mesure future doit être opt-in et sans contenu utilisateur.
