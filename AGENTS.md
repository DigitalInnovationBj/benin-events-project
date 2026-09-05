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

# Design & UI

Tailwind CSS 4 for styling (mobile first)
Avoid creating custom classes with Tailwind CSS as much as possible.
For the UI, use shadcn/ui components.
Use tabler/icons packages for all icons in this project

# Year context

The project is being developed in 2026.
