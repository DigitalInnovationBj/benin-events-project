# TODO — Benin Events

Ce qui reste après la refonte UX/UI du site client. Classé par impact réel,
pas par effort.

---

## ~~1. Abandon de paiement bloqué jusqu'au cron~~ — fait

La réconciliation est désormais rejouée à l'affichage de `/checkout/success`
et de `/mes-billets` : le simple retour de l'acheteur sur le site résout sa
commande, sans attendre le cron quotidien. La page de confirmation suit aussi
la résolution en direct quand le paiement est encore en cours.

Reste à vérifier en production : **le webhook FeexPay est-il bien configuré ?**
C'est lui qui devrait résoudre l'immense majorité des cas sans que l'acheteur
ait à revenir.

---

## ~~2. Audit du mode clair~~ — fait

---

## ~~3. Page d'échec de paiement~~ — fait

`/checkout/error` est atteinte sur refus de l'opérateur (polling) et sur refus
du prestataire à l'initiation. Elle affiche la raison, les causes fréquentes,
et permet de reprendre le paiement avec le panier conservé. Les erreurs de
saisie corrigeables sur place (opérateur, numéro, stock) restent en toast.

---

## ~~4. Accueil non cacheable~~ — fait

`Header` lisait la session via `getCurrentUser()`, donc `headers()`, ce qui
basculait en rendu dynamique **toute** route portant l'en-tête. La navbar lit
désormais la session côté client (`useSession`), et l'accueil est prérendu avec
`revalidate = 300`.

Vérifié au build : `/` est passé de `ƒ` (dynamique) à `○ 5m`.

Compromis assumé : le HTML mis en cache contient l'état déconnecté, la navbar
se met à jour après hydratation (un placeholder de largeur fixe évite le
décalage).

---

## ~~5. Recherche insensible aux accents~~ — fait

`Event.searchText` stocke titre + description (HTML retiré) + lieu, en
minuscules sans accents. La saisie est normalisée de la même façon, découpée en
mots, et chacun doit être présent dans n'importe quel ordre : « concert
cotonou » trouve « Concert live à Cotonou ».

Deux effets de bord corrigés au passage : la description étant du HTML, une
requête pouvait matcher un nom de balise ; et le lieu n'était pas cherché.

**Reste ouvert — tolérance aux fautes de frappe.** « conert » ne trouve
toujours pas « concert ». Demande l'extension `pg_trgm`, un index GIN sur
`searchText` et un classement par similarité. À faire quand le catalogue
grossira : l'index accélérerait aussi le `contains`, aujourd'hui en parcours
séquentiel.

---

## 6. La recherche IA est codée mais débranchée

La route Gemini fonctionne (`/api/ai/search`, rate-limitée), mais
`<AskAIButton />` est **commenté** dans le layout racine. Décision produit :
soit on la rebranche, soit on supprime le code et la dépendance
`@google/generative-ai`.

Fichiers : `src/app/layout.tsx` (l. ~142),
`src/components/ai/ask-ai-button.tsx`, `src/app/api/ai/search/route.ts`.

---

## ~~7. Reliquats techniques~~ — en grande partie fait

- **`generateStaticParams`** ajouté sur `/events/[slug]`, avec
  `revalidate = 300`. L'ajouter seul n'aurait rien changé : la page appelait
  `getCurrentUser()`, donc `headers()`. L'état like/favori est passé côté
  client (`getEventInteractionState`), et deux requêtes mortes ont été
  supprimées — `hasExistingTicket` n'était plus lu depuis le retrait de
  l'ancien dialog d'achat. Vérifié au build : `● /events/[slug] 5m`.
- **`ui/button.tsx`** modernisé : `forwardRef` retiré (React 19 passe `ref`
  comme prop), `data-slot` et styles `aria-invalid` ajoutés. Les classes de
  variantes sont inchangées — aucun déplacement visuel.
- **Icônes** : `lucide-react` ne subsiste plus que dans `components/ui/`
  (généré par shadcn) et dans `ask-ai-button.tsx`, laissé en attente du
  point 6.
- **5 composants shadcn jamais importés supprimés** : `nav-documents`,
  `nav-main`, `nav-secondary`, `nav-user`, `section-cards` — des restes du
  bloc dashboard livré par défaut.
- **`sitemap.ts`** ne liste plus les évènements terminés.

**Reste à faire, côté installation :**

```
pnpm remove gsap @gsap/react embla-carousel-react
```

Vérifié : zéro import dans `src/`, et aucun `ui/carousel.tsx` qui dépendrait
d'Embla.

**Erreurs ESLint préexistantes (3), hors périmètre :**
`FeaturedButton.tsx` et `originkit/ui/spotlight-frames.tsx` (setState dans un
effet), `emails/event-campaign.tsx` (`<a>` au lieu de `<Link>`).

---

## À vérifier

- [ ] Le backfill des villes a-t-il été lancé ?
      `pnpm exec tsx scripts/backfill-event-city.ts`
      Sans lui, la colonne `Event.city` est vide : le filtre « ville » et les
      compteurs de `CitiesSection` renvoient zéro pour tous les évènements
      existants.
- [ ] Recherche : vérifier que « conference » trouve bien « Conférence », et
      que la navbar n'affiche plus « Se connecter » à un utilisateur connecté
      après le passage de l'accueil en cache.
- [ ] Achat de deux catégories de billets en une commande : une seule `Order`,
      un seul push Mobile Money, emails et PDF corrects pour chaque billet.
- [ ] Deux achats concurrents sur la dernière place d'une catégorie : un seul
      aboutit, l'autre reçoit une erreur nommant la catégorie.
- [ ] Drawer de filtres autour de 900 px de large (juste sous le seuil `lg`).
- [ ] Raccourci billetterie sur un évènement à description courte : si la
      section est visible d'emblée, le bouton ne doit jamais apparaître.
