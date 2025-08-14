import { PrismaClient } from "../lib/generated/prisma/client.js";
const prisma = new PrismaClient();

// Données extraites simplifiées du JSON fourni
const categoriesData = [
    { name: "Musique" },
    { name: "Mode" },
    { name: "Culture" },
    { name: "Gastronomie" },
    { name: "Spiritualité" },
    { name: "Festival" },
    { name: "Divers" },
];

const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: {
        id: "some-unique-id", // correspond à ton format d'ID Firebase / string
        name: "Organisateur Principal",
        email: "organizer@example.com",
        role: "ADMIN",
        emailVerified: true,
    },
});

// Fonctions utilitaires
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD") // décompose les accents
        .replace(/[\u0300-\u036f]/g, "") // supprime les accents
        .replace(/\s+/g, "-") // remplace les espaces par des -
        .replace(/[^\w-]+/g, "") // supprime les caractères non alphanumériques
        .replace(/--+/g, "-") // remplace les doubles tirets
        .replace(/^-+|-+$/g, ""); // supprime tirets en début/fin
}

async function main() {
    // 1. Création des catégories (vérifie si elles n'existent pas)
    const categories: Record<string, any> = {};
    for (const cat of categoriesData) {
        let category = await prisma.category.findUnique({
            where: { name: cat.name },
        });
        if (!category) {
            category = await prisma.category.create({
                data: { name: cat.name },
            });
        }
        categories[cat.name] = category;
    }

    // 2. Insertion des événements extraits

    // Exemple : mapping simple catégorie par mots-clés (à adapter)
    function guessCategory(title: string, description?: string): string {
        const text = (title + " " + (description ?? "")).toLowerCase();

        if (/mode|fashion|awards/.test(text)) return "Mode";
        if (/musique|groove|festival|concert/.test(text)) return "Musique";
        if (/gastronomie|eat & drink|barbecue/.test(text)) return "Gastronomie";
        if (/spiritualité|vodoun/.test(text)) return "Spiritualité";
        if (/culture|arts/.test(text)) return "Culture";
        return "Divers";
    }

    // Exemple simplifié d’adresse en fonction du lieu
    function normalizeLocation(location: string) {
        // Ici on décompose peu, on met tout dans city, pays par défaut Bénin
        return {
            address: location, // pas d'info fine dans les données reçues
            city: location,
            country: "Bénin",
        };
    }

    // Données à seed extraites
    const eventsRaw = [
        {
            title: "Africa Fashion Awards",
            description:
                "Une cérémonie de remise de prix qui met à l’honneur les créatifs de la mode africaine.",
            date: "2025-10-25",
            location: "Cotonou",
            frequency: "annuelle",
        },
        {
            title: "Afro Groove Chill (Chill & Groove)",
            description:
                "Un concept/événement musical autour des rythmes chill et groove, pas d’informations précises localisées.",
            date: null,
            location: "",
            frequency: null,
        },
        {
            title: "We Love Eya (WeLovEya Festival)",
            description:
                "Festival urbain et Afrobeat organisé chaque fin d’année à Cotonou.",
            date: "2025-12-31", // date approximative fin décembre 2025
            location: "Place de l’Amazone, Cotonou",
            frequency: "annuelle",
        },
        {
            title: "Vodoun Days",
            description:
                "Festival national célébrant la religion Vodoun à Ouidah, mêlant spiritualité, culture, musique et performances.",
            date: "2025-01-09",
            location: "Ouidah",
            frequency: "annuelle",
        },
        {
            title: "Festival International des Arts du Bénin (FInAB)",
            description:
                "Festival pluridisciplinaire d’arts (musique, arts visuels, mode, concerts…) à Cotonou, Ouidah et Porto‑Novo.",
            date: "2025-02-21",
            location: "Cotonou",
            frequency: "biannuel ou annuel",
        },
        {
            title: "Eat and Drink Festival (Eat & Drink Cotonou)",
            description:
                "Festival gastronomique annuel célébrant la diversité culinaire locale dans plusieurs villes (Cotonou, Lomé, Accra…).",
            date: "2025-03-01",
            location: "Cotonou",
            frequency: "annuelle",
        },
        {
            title: "Cotonou Barbecue",
            description:
                "Festival de grillades (barbecue) organisé à Cotonou, très populaire localement.",
            date: "2025-07-25",
            location: "Cotonou",
            frequency: "annuelle",
        },
    ];

    for (const evt of eventsRaw) {
        const catName = guessCategory(evt.title, evt.description);
        const category = categories[catName];

        const locationNorm = normalizeLocation(evt.location || "");

        // La date, si non fournie, on met une date par défaut (ici aujourd’hui pour éviter erreur date)
        const dateEvent = evt.date ? new Date(evt.date) : new Date();

        await prisma.event.upsert({
            where: { slug: generateSlug(evt.title) },
            update: {},
            create: {
                title: evt.title,
                description: evt.description,
                address: locationNorm.address,
                city: locationNorm.city,
                country: locationNorm.country,
                date: dateEvent,
                price: 0, // prix à définir selon besoin, 0 par défaut ici
                slug: generateSlug(evt.title),
                categoryId: category?.id,
                // organizerId à gérer dans ton contexte utilisateur
                organizerId: organizer.id, // Remplace par un user validé ou null si nullable
            },
        });
    }

    console.log("Seed terminé avec succès !");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
