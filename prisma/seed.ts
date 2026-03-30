import prisma from "@/lib/prisma";

// Helper pour générer un slug à partir d'un nom
function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

const CATEGORIES = [
    // 🎉 Divertissement & Sorties
    { name: "Musique & Concert", emoji: "🎵" },
    { name: "Festival", emoji: "🎪" },
    { name: "Nuit & Soirée", emoji: "🌙" },
    { name: "Soirée de Gala", emoji: "🥂" },
    { name: "Chill & Détente", emoji: "😌" },
    { name: "After-work", emoji: "🍹" },
    { name: "Karaoké", emoji: "🎤" },
    { name: "Jeux & Divertissement", emoji: "🎮" },

    // 🎨 Culture & Spectacle
    { name: "Culture & Arts", emoji: "🎨" },
    { name: "Cinéma & Spectacle", emoji: "🎬" },
    { name: "Exposition & Galerie", emoji: "🖼️" },
    { name: "Théâtre & Danse", emoji: "🎭" },
    { name: "Comédie & Stand-up", emoji: "🤣" },
    { name: "Littérature & Poésie", emoji: "📖" },

    // 🏃 Sport & Santé
    { name: "Sport & Fitness", emoji: "⚽" },
    { name: "Santé & Bien-être", emoji: "❤️" },
    { name: "Yoga & Méditation", emoji: "🧘" },

    // 👨‍👩‍👧 Famille & Lifestyle
    { name: "Famille & Enfants", emoji: "👨‍👩‍👧‍👦" },
    { name: "Mode & Beauté", emoji: "👗" },
    { name: "Gastronomie & Food", emoji: "🍽️" },
    { name: "Tourisme & Voyage", emoji: "✈️" },
    { name: "Mariage & Célébration", emoji: "💍" },

    // 💼 Professionnel & Savoir
    { name: "Business & Networking", emoji: "🤝" },
    { name: "Conférence & Séminaire", emoji: "🎙️" },
    { name: "Formation & Éducation", emoji: "📚" },
    { name: "Tech & Innovation", emoji: "💻" },
    { name: "Entrepreneuriat", emoji: "🚀" },

    // 🌍 Société & Causes
    { name: "Environnement & Écologie", emoji: "🌿" },
    { name: "Religion & Spiritualité", emoji: "🙏" },
    { name: "Politique & Social", emoji: "🏛️" },
    { name: "Humanitaire & Solidarité", emoji: "🫶" },
];

async function main() {
    console.log("🌱 Démarrage du seed des catégories…\n");

    let created = 0;
    let skipped = 0;

    for (const cat of CATEGORIES) {
        const slug = toSlug(cat.name);

        const result = await prisma.category.upsert({
            where: { slug },
            update: {}, // Rien à mettre à jour si elle existe déjà
            create: {
                name: cat.name,
                slug,
            },
        });

        const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
        if (isNew) {
            console.log(`  ✅ Créée   — ${cat.emoji}  ${cat.name}`);
            created++;
        } else {
            console.log(`  ⏭️  Existante — ${cat.emoji}  ${cat.name}`);
            skipped++;
        }
    }

    console.log(`\n📊 Résultat : ${created} créée(s), ${skipped} ignorée(s).`);
    console.log("✨ Seed terminé !");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seed :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
