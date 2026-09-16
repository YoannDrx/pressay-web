# Compte et administration — livraison du 16 septembre 2026

Base web : `c5fdaa6`. Le backend compagnon est la branche
`codex/account-admin-referrals` de `pressay-cloud`, avec la migration 0017.
Les modifications n'ouvrent ni les ventes ni le programme de parrainage.

## Parcours livrés

- La navigation relit la session Better Auth au retour arrière, au focus et après
  un changement dans un autre onglet. Les pages privées ne sont pas mises en
  cache public. La durée existante des sessions reste inchangée.
- Connexion et inscription redirigent les sessions valides vers une destination
  interne contrôlée. Les paramètres OAuth, l'invitation et la langue sont conservés.
- `/account` partage sa navigation avec abonnement, appareils, parrainage et
  sécurité. `/user-profile` redirige vers la sécurité. Une erreur de facturation
  ne masque pas les appareils ni les moyens de connexion.
- Droits effectifs, origine, échéances et quotas Cloud sont affichés ; Stripe et
  Apple ont leurs propres destinations de gestion. Aucune dictée locale n'est suivie.
- L'admin propose vue d'ensemble, utilisateurs recherchables et paginés, fiche
  utilisateur, invitations, promotions, parrainages, facturation, conditions de
  lancement par canal et journal d'audit. Les recettes commerciales ne sont pas
  présentées comme un chiffre d'affaires encaissé : le MRR affiché est une estimation
  catalogue Stripe, distincte des cadeaux et crédits.
- Toutes les mutations sensibles exigent une preuve de second facteur récente,
  transmise dans le JWT signé et vérifiée côté Cloud. Les erreurs de service ne
  sont plus interprétées comme une absence de rôle administrateur.
- Les invitations sont partageables sans envoi d'email. Un secret n'est affiché
  qu'à la création ; la révocation du code et le retrait d'un accès accordé sont
  deux actions distinctes. L'utilisation des promotions est consultable dans Stripe
  depuis la liste des campagnes, avec date de contrôle et sans révéler le code.
- Cartes Free/Pro centrées, logo dans le footer et le compte, accroche FR/EN :
  « Là où tu peux écrire, tu peux parler. » / “Wherever you can type, you can speak.”

## Déploiement et configuration

1. Faire relire les deux diffs et appliquer la migration Cloud sur une base isolée.
2. Déployer le backend avant le web ; suivre `docs/OPERATIONS_ROLLOUT.md` du backend.
   Fournir `PRESSAY_CAMPAIGN_SECRET`, conserver les clés de signature et de session,
   puis vérifier le bootstrap du compte propriétaire avec une adresse vérifiée.
3. Côté web, conserver la configuration Better Auth actuelle et fournir un
   `PRESSAY_REFERRAL_COOKIE_SECRET` indépendant. `PRESSAY_API_URL` doit désigner
   l'environnement Cloud correspondant. Les identités et données de production
   ne doivent pas être utilisées dans les fixtures locales.
4. Vérifier Google/PKCE, passkeys, TOTP, invitation, déconnexion multi-onglets,
   suppression de compte et les droits dans un Mac de recette.
5. Exécuter la recette Stripe Sandbox décrite dans le backend, puis activer
   séparément parrainage, vente directe et canal Apple après leurs validations.

Le contrat partagé est copié depuis `src/contracts/operations-wire.ts` du backend.
Vérification : `bunx tsx scripts/sync-web-contract.ts ../pressay-web-account-admin --check`
depuis le dépôt Cloud. Ne pas modifier la copie web seule.

## Vérifications locales

Node 22, PostgreSQL 17 local isolé, Chromium desktop et viewport mobile :

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
WEB_TEST_DATABASE_URL=postgresql://USER@127.0.0.1:PORT/pressay_web_e2e \
  pnpm exec playwright test --config playwright.account.config.ts
pnpm build
```

La suite connectée refuse une base distante et exige le nom `pressay_web_e2e`.
Elle utilise de vraies sessions Better Auth dans PostgreSQL et un double Cloud
local sur le port 31973. Elle ne constitue pas une recette Google ou Stripe.
Les captures dans `docs/evidence` contiennent uniquement des données synthétiques.
L'indicateur Next.js visible sur certaines captures appartient au serveur local.

## Limites à valider avant activation

- Stripe Codex était déconnecté pendant l'implémentation. Aucun paiement Sandbox
  distant n'est déclaré testé ; les tests backend utilisent un double du SDK Stripe.
- Les récompenses sont persistantes et traitées par lot quotidien ou bouton admin.
  Les crédits Stripe appliqués ou d'issue incertaine passent en revue manuelle lors
  d'un remboursement, pour éviter de créer une dette client automatiquement.
- Aucun contrat de médiation, réglage fiscal ou statut App Store n'est validé par
  un changement d'interface. Les preuves restent à renseigner par canal.
- L'administration conserve le français comme langue opérateur ; l'espace client
  et le site public proposent FR/EN. Les tableaux récents hors utilisateurs sont
  limités aux 100 dernières entrées.

## Retour arrière

Désactiver d'abord parrainage et ventes. Revenir au site précédent si nécessaire,
en conservant les tables, consommations et récompenses Cloud pour réconciliation.
Ne pas restaurer une base ancienne après l'attribution de droits ou crédits.
Les clés Better Auth restent inchangées pour conserver les sessions existantes.
