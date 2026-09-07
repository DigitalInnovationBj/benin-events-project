# TODO — Benin Events

Ce qui reste après la refonte UX/UI du site client. Classé par impact réel,
pas par effort.

---

## 1. Un abandon de paiement peut rester bloqué jusqu'à 3 h du matin

**Risque argent.** Si l'acheteur ferme l'onglet pendant l'attente Mobile Money,
plus personne ne poll. Seuls restent le webhook FeexPay (qui peut ne pas être
délivré) et le cron de réconciliation — or le plan Vercel Hobby n'autorise
qu'**un cron par jour** (`0 3 * * *`). La commande reste `PENDING` entre-temps
et son stock est gelé 20 minutes.

Pistes :

- Rejouer la réconciliation à la première visite de `/checkout/success` et de
  `/mes-billets` pour les commandes `PENDING` récentes de l'utilisateur.
- Ou déclencher une vérification différée côté serveur à l'initiation.
- Vérifier que le webhook FeexPay est bien configuré en production : c'est lui
  qui devrait résoudre l'immense majorité des cas.

Fichiers : `src/lib/payment-reconciliation.ts`,
`src/app/api/cron/reconcile-payments/route.ts`, `vercel.json`.

---

## 2. Le mode clair n'a jamais été audité

La palette light n'a jamais servi (le site était forcé en dark). Le bouton
« Devenir organisateur » y était **invisible** — corrigé, mais c'était le
symptôme, pas la maladie. Le sélecteur de thème expose pourtant ce mode à tous
les visiteurs.

Deux options :

- Passer chaque écran public en revue en clair, ou
- retirer la bascule et assumer le dark-only.

Point de départ : `src/app/globals.css` (bloc `:root`).

---

## 3. L'échec de paiement n'a pas de vraie page

`/checkout/error` existe mais **n'est jamais atteinte** : un paiement refusé
affiche un toast et laisse l'utilisateur sur le formulaire, sans explication
ni piste (solde insuffisant, mauvais opérateur, numéro invalide).

Fichiers : `src/components/checkout/checkout-flow.tsx`,
`src/app/(site)/checkout/error/page.tsx`.

---

## 4. L'accueil n'est pas cacheable

Le `Header` lit la session au rendu serveur (`getCurrentUser`), ce qui bascule
toute la route en dynamique — un `export const revalidate` y est donc sans
effet. Sortir la session du rendu serveur de la navbar (session côté client,
ou `Suspense` autour du seul bloc authentifié) rendrait l'accueil cacheable.
C'est le gain de TTFB le plus rentable qui reste.

Fichiers : `src/components/sections/Header.tsx`, `src/app/(site)/page.tsx`.

---

## 5. La recherche `/events` est un simple `contains`

Pas de tolérance aux fautes ni aux accents : « conference » ne trouve pas
« Conférence ». Sur un catalogue qui grandit, ça se verra.

Piste : recherche plein texte PostgreSQL (`tsvector` + index GIN), ou au
minimum une normalisation des accents à l'indexation.

Fichier : `src/app/(site)/events/page.tsx`.

---

## 6. La recherche IA est codée mais débranchée

La route Gemini fonctionne (`/api/ai/search`, rate-limitée), mais
`<AskAIButton />` est **commenté** dans le layout racine. Décision produit :
soit on la rebranche, soit on supprime le code et la dépendance
`@google/generative-ai`.

Fichiers : `src/app/layout.tsx` (l. ~142),
`src/components/ai/ask-ai-button.tsx`, `src/app/api/ai/search/route.ts`.

---

## 7. Reliquats techniques

- **`generateStaticParams` absent** sur `/events/[slug]` : toutes les pages
  évènement sont rendues à la demande.
- **`src/components/ui/button.tsx`** est resté sur une génération shadcn
  antérieure au reste du dossier (`forwardRef`, `focus-visible:ring-1`, pas de
  `data-slot` ni d'`aria-invalid`).
- **Dashboard et agent encore en `lucide-react`** — le site client est passé à
  Tabler, conformément à `AGENTS.md` ; il reste ~13 fichiers.
- **Dépendances jamais importées** : `gsap`, `@gsap/react`,
  `embla-carousel-react`. À retirer, ou à assumer pour de futures animations.
- **2 erreurs ESLint préexistantes** :
  `src/app/dashboard/events/[id]/FeaturedButton.tsx` (setState dans un effet)
  et `src/emails/event-campaign.tsx` (`<a>` au lieu de `<Link>`).
- **`sitemap.ts`** liste aussi les évènements passés.

---

## À vérifier

- [ ] Le backfill des villes a-t-il été lancé ?
      `pnpm exec tsx scripts/backfill-event-city.ts`
      Sans lui, la colonne `Event.city` est vide : le filtre « ville » et les
      compteurs de `CitiesSection` renvoient zéro pour tous les évènements
      existants.
- [ ] Achat de deux catégories de billets en une commande : une seule `Order`,
      un seul push Mobile Money, emails et PDF corrects pour chaque billet.
- [ ] Deux achats concurrents sur la dernière place d'une catégorie : un seul
      aboutit, l'autre reçoit une erreur nommant la catégorie.
- [ ] Drawer de filtres autour de 900 px de large (juste sous le seuil `lg`).
- [ ] Raccourci billetterie sur un évènement à description courte : si la
      section est visible d'emblée, le bouton ne doit jamais apparaître.
