# Seeder pour Benin Events

Ce dossier contient le script de seeding pour remplir la base de données avec des données de test.

## Utilisation

### Exécuter le seeder

```bash
pnpm prisma db seed
```

### Nettoyer la base de données

```bash
pnpm prisma db push --force-reset
```

## Données générées

Le seeder génère les données suivantes :

- **51 utilisateurs** (1 admin + 50 utilisateurs normaux)
- **100 événements** avec différents types et statuts
- **~200 dates d'événements** avec récurrence
- **200 billets** (en respectant les contraintes d'unicité)
- **150 favoris** d'événements
- **100 notifications** utilisateur
- **80 feedbacks** et avis
- **60 recommandations** d'événements
- **20 campagnes marketing**

## Configuration

Le seeder utilise la librairie **Faker.js** pour générer des données réalistes en français.

### Compte administrateur par défaut

- **Email** : `admin@beninevents.com`
- **Nom** : `Admin Benin Events`
- **Rôle** : `ADMIN`

## Structure des données

### Types d'événements
- `FREE` : Événements gratuits
- `FREE_WITH_REGISTRATION` : Gratuits avec inscription
- `PAID` : Événements payants

### Statuts d'événements
- `PENDING` : En attente d'approbation
- `APPROVED` : Approuvé
- `REJECTED` : Rejeté
- `CANCELLED` : Annulé

### Types de récurrence
- `NONE` : Pas de récurrence
- `DAILY` : Quotidien
- `WEEKLY` : Hebdomadaire
- `MONTHLY` : Mensuel
- `YEARLY` : Annuel

## Notes importantes

- Le seeder nettoie automatiquement la base de données avant d'insérer les nouvelles données
- Les contraintes d'unicité sont respectées (ex: un utilisateur ne peut avoir qu'un seul billet par événement)
- Les données sont générées de manière cohérente (ex: les billets sont liés à des dates d'événements existantes)
