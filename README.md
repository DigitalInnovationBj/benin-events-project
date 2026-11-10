# Benin Events

Plateforme de billetterie événementielle pour le Bénin : découverte d'événements, achat de billets par Mobile Money (MTN, Moov, Celtiis), billets par email avec QR code, espace organisateur et contrôle d'accès par scan.

## 🛠 Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript
- **Gestionnaire de paquets** : [pnpm](https://pnpm.io/)
- **Authentification** : [better-auth](https://www.better-auth.com/) (email/mot de passe + Google OAuth)
- **Base de données** : [Prisma 7](https://www.prisma.io/) avec PostgreSQL ([Neon](https://neon.tech/))
- **Paiements** : FeexPay (Mobile Money), avec webhook et réconciliation
- **Emails** : [Resend](https://resend.com/) + React Email
- **Billets** : QR codes et PDF (`@react-pdf/renderer`)
- **Recherche IA** : Google Generative AI
- **Hébergement** : [Vercel](https://vercel.com/) (hosting, Blob, crons)
- **Styling** : [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Icônes** : [Tabler Icons](https://tabler-icons.io/) (`@tabler/icons-react`)
- **Thème** : Dark mode par défaut avec `next-themes`

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
pnpm install
```

`postinstall` génère automatiquement le client Prisma.

### 2. Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Base de données (Neon)
DATABASE_URL="url_poolée"             # runtime
DATABASE_URL_UNPOOLED="url_directe"   # CLI Prisma (migrations)

# Auth (better-auth)
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Paiements (FeexPay)
FEEXPAY_API_KEY=...
FEEXPAY_SHOP_ID=...
FEEXPAY_WEBHOOK_SECRET=...

# Emails
RESEND_API_KEY=re_...

# Recherche IA
GOOGLE_AI_API_KEY=...

# Crons Vercel
CRON_SECRET=...

# Site
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_SITE_VERIFICATION=...
```

Vercel Blob (stockage des images) utilise aussi son propre jeton, fourni automatiquement sur Vercel.

### 3. Base de données

Les migrations sont versionnées dans `prisma/migrations/`. Toute évolution du schéma passe par `prisma migrate dev` (jamais `db push`) :

```bash
pnpm prisma migrate dev
pnpm prisma generate   # la migration ne régénère pas le client
```

Les migrations **ne tournent pas pendant le build** (`pnpm build` ne fait que `next build`). Elles se déploient à part :

```bash
pnpm db:status   # voir ce qui reste à appliquer
pnpm db:deploy   # appliquer les migrations en attente (avant de déployer)
```

### 4. Lancement

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## 📂 Structure du Projet

- `src/app/(site)/` : site public (événements, checkout, mes billets, compte, pages légales, FAQ).
- `src/app/(auth)/` : connexion, inscription, mot de passe oublié, vérification email.
- `src/app/dashboard/` : espace organisateur (événements, commandes, agents, scan, paiements).
- `src/app/admin/` : administration (organisateurs, demandes, versements, paramètres).
- `src/app/agent/` : contrôle d'accès des billets par les agents.
- `src/app/api/` : auth, webhook FeexPay, validation des billets, recherche IA, newsletter/campagnes, crons.
- `src/actions/` : server actions.
- `src/components/ui/` : composants shadcn/ui ; `src/components/` : composants métier.
- `src/emails/` : templates d'emails.
- `src/lib/` : auth, Prisma, FeexPay, réconciliation des paiements, PDF des billets, recherche, etc.
- `src/proxy.ts` : middleware Next.js 16.
- `prisma/` : schéma, migrations et seed.
- `scripts/` : scripts ponctuels (backfills ville/recherche, migration des avatars).

## ⏱ Crons (Vercel)

Définis dans `vercel.json` :

- `/api/cron/monday`, `/api/cron/wednesday`, `/api/cron/friday` : campagnes (7h UTC).
- `/api/cron/reconcile-payments` : réconciliation quotidienne des paiements (3h UTC).

## 📝 Scripts Disponibles

- `pnpm dev` : serveur de développement.
- `pnpm build` : build de production (`next build`).
- `pnpm start` : serveur de production.
- `pnpm lint` : vérification du code.
- `pnpm db:deploy` : applique les migrations en attente.
- `pnpm db:status` : état des migrations.
- `pnpm db:seed` : alimente la base (`prisma/seed.ts`).

## 🎨 Composants UI

Ajouter un composant shadcn :

```bash
pnpm dlx shadcn@latest add <nom-du-composant>
```
