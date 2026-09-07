<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project

Benin Events — plateforme de billetterie événementielle pour le Bénin.
Stack : Next.js (App Router, `src/proxy.ts` comme middleware), React 19, Prisma 7 + PostgreSQL (Neon), Clerk (auth — migration vers better-auth prévue), FeexPay (paiements mobile money), Resend (emails), Vercel (hosting + Blob + crons).

# Package manager & installation

Package manager in this project: pnpm
Dont execute package installation automatically
Do not install packages automatically; I will do it myself.
Do not stop when a package is missing; continue and tell me which package needs to be installed.
Note: npm registry access is very slow on this machine — installs can take 15+ minutes.

# Workflow

Before generating any files, tell me what you plan to do and ask for approval before proceeding.
Les migrations Prisma sont versionnées (`prisma/migrations/`) : toute évolution du schéma passe par `prisma migrate dev`, jamais `db push`.

Les migrations **ne tournent pas pendant le build**. `pnpm build` ne fait que
`next build` ; le schéma se déploie à part, délibérément :

- `pnpm db:deploy` — applique les migrations en attente (avant de déployer).
- `pnpm db:status` — vérifie ce qui reste à appliquer.

Après un `prisma migrate dev`, lancer `pnpm prisma generate` : dans ce projet,
la migration applique le SQL mais ne régénère pas le client, et tout code
utilisant le nouveau champ échoue en `Unknown argument`.

Pourquoi : `prisma migrate deploy` prend un verrou consultatif PostgreSQL
global à chaque exécution, même quand il n'a rien à appliquer. Deux builds
Vercel simultanés, ou un build interrompu qui laisse le verrou en place,
font échouer tous les suivants en `P1002`.

La CLI Prisma passe par `DATABASE_URL_UNPOOLED` (endpoint direct Neon), pas par
le pooler : les migrations ont besoin d'une connexion de session. Le runtime,
lui, garde le pooler. Voir `prisma.config.ts`.

# Design & UI

Tailwind CSS 4 for styling (mobile first)
Avoid creating custom classes with Tailwind CSS as much as possible.
For the UI, use shadcn/ui components.
Use tabler/icons packages for all icons in this project

# Year context

The project is being developed in 2026.
