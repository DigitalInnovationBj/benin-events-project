const { PrismaClient } = require("../lib/generated/prisma");
const { faker } = require("@faker-js/faker/locale/fr");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyer la base de données
  console.log("🧹 Nettoyage de la base de données...");
  await prisma.marketingCampaign.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.eventDate.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Créer des utilisateurs
  console.log("👥 Création des utilisateurs...");
  const users = [];

  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      id: faker.string.uuid(),
      name: "Admin Benin Events",
      email: "admin@beninevents.com",
      role: "ADMIN",
      emailVerified: true,
      image: faker.image.avatar(),
    },
  });
  users.push(admin);

  // Créer l'utilisateur spécifique Igor Adande
  const igorUser = await prisma.user.create({
    data: {
      id: faker.string.uuid(),
      name: "Igor Adande",
      email: "igoradande44@gmail.com",
      role: "USER",
      emailVerified: true,
      image: faker.image.avatar(),
    },
  });
  users.push(igorUser);

  // Créer des utilisateurs normaux
  for (let i = 0; i < 49; i++) { // Réduit à 49 pour maintenir un total de 51 utilisateurs
    const user = await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: "USER",
        emailVerified: faker.datatype.boolean({ probability: 0.8 }),
        image: faker.image.avatar(),
      },
    });
    users.push(user);
  }

  // Créer des sessions pour certains utilisateurs, incluant Igor
  console.log("🔐 Création des sessions...");
  let sessionCount = 0;

  // Session pour Igor
  await prisma.session.create({
    data: {
      id: faker.string.uuid(),
      expiresAt: faker.date.future(),
      token: faker.string.alphanumeric(64),
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      userId: igorUser.id,
    },
  });
  sessionCount++;

  // Sessions pour autres utilisateurs
  for (let i = 0; i < 29; i++) {
    const user = faker.helpers.arrayElement(users.filter(u => u.id !== igorUser.id));
    await prisma.session.create({
      data: {
        id: faker.string.uuid(),
        expiresAt: faker.date.future(),
        token: faker.string.alphanumeric(64),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        userId: user.id,
      },
    });
    sessionCount++;
  }

  // Créer des catégories
  console.log("📑 Création des catégories...");
  const categories = [];
  const categoryNames = [
    "Conférences",
    "Concerts",
    "Festivals",
    "Expositions",
    "Ateliers",
    "Sports",
    "Théâtre",
    "Cinéma",
    "Événements pour enfants",
    "Networking",
  ];

  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        id: faker.string.uuid(),
        name,
        description: faker.lorem.sentence(),
      },
    });
    categories.push(category);
  }

  // Créer des événements
  console.log("🎉 Création des événements...");
  const events = [];
  const eventTypes = ["FREE", "FREE_WITH_REGISTRATION", "PAID"];
  const eventStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

  for (let i = 0; i < 100; i++) {
    const eventType = faker.helpers.arrayElement(eventTypes);
    const category = faker.helpers.arrayElement(categories);
    const organizer = faker.helpers.arrayElement(users);
    const event = await prisma.event.create({
      data: {
        id: faker.string.uuid(),
        title: faker.lorem.words({ min: 2, max: 6 }),
        slug: faker.helpers.slugify(faker.lorem.words(3)),
        description: faker.lorem.paragraphs({ min: 2, max: 5 }),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        type: eventType,
        status: faker.helpers.arrayElement(eventStatuses),
        price: eventType === "PAID" ? faker.number.float({ min: 1000, max: 50000, precision: 0 }) : null,
        image: faker.image.urlLoremFlickr({ width: 800, height: 600, category: "event" }),
        organizer: { connect: { id: organizer.id } },
        categories: { connect: { id: category.id } },
      },
    });
    events.push(event);
  }

  // Créer des dates d'événements
  console.log("📅 Création des dates d'événements...");
  const eventDates = [];
  const recurrenceTypes = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

  for (const event of events) {
    const numDates = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < numDates; i++) {
      const startDate = faker.date.future();
      const endDate = new Date(startDate.getTime() + faker.number.int({ min: 3600000, max: 86400000 }));
      const recurrenceType = faker.helpers.arrayElement(recurrenceTypes);

      const eventDate = await prisma.eventDate.create({
        data: {
          id: faker.string.uuid(),
          eventId: event.id,
          startDateTime: startDate,
          endDateTime: endDate,
          isAllDay: faker.datatype.boolean({ probability: 0.3 }),
          reccurenceType: recurrenceType,
          reccurenceEnd: recurrenceType !== "NONE" ? faker.date.future({ refDate: endDate }) : null,
        },
      });
      eventDates.push(eventDate);
    }
  }

  // Créer des billets
  console.log("🎫 Création des billets...");
  let ticketCount = 0;
  for (const event of events) {
    const numTickets = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numTickets; i++) {
      await prisma.ticket.create({
        data: {
          id: faker.string.uuid(),
          eventId: event.id,
          name: `${faker.lorem.word()} Ticket`,
          price: event.type === "PAID" ? faker.number.float({ min: 1000, max: 50000, precision: 0 }) : 0,
          quantity: faker.number.int({ min: 10, max: 500 }),
        },
      });
      ticketCount++;
    }
  }

  // Créer des achats
  console.log("🛒 Création des achats...");
  let purchaseCount = 0;
  const purchaseCombinations = new Set();
  const purchaseStatuses = ["PENDING", "CANCELLED", "CONFIRMED"];

  // Achats pour Igor
  const igorEvents = events.filter(e => e.status === "APPROVED").slice(0, 3); // 3 événements approuvés pour Igor
  for (const event of igorEvents) {
    const eventDate = eventDates.find((ed) => ed.eventId === event.id);
    if (eventDate) {
      const combinationKey = `${event.id}-${igorUser.id}`;
      purchaseCombinations.add(combinationKey);

      await prisma.purchase.create({
        data: {
          id: faker.string.uuid(),
          eventId: event.id,
          eventDateId: eventDate.id,
          userId: igorUser.id,
          qrcode: faker.string.alphanumeric(32),
          code: faker.string.alphanumeric(8).toUpperCase(),
          statut: faker.helpers.arrayElement(["PENDING", "CONFIRMED"]),
        },
      });
      purchaseCount++;
    }
  }

  // Achats pour autres utilisateurs
  for (let i = 0; i < 197; i++) { // Réduit pour maintenir ~200 achats
    const user = faker.helpers.arrayElement(users.filter(u => u.id !== igorUser.id));
    const event = faker.helpers.arrayElement(events);
    const eventDate = eventDates.find((ed) => ed.eventId === event.id);

    const combinationKey = `${event.id}-${user.id}`;

    if (eventDate && !purchaseCombinations.has(combinationKey)) {
      purchaseCombinations.add(combinationKey);

      await prisma.purchase.create({
        data: {
          id: faker.string.uuid(),
          eventId: event.id,
          eventDateId: eventDate.id,
          userId: user.id,
          qrcode: faker.string.alphanumeric(32),
          code: faker.string.alphanumeric(8).toUpperCase(),
          statut: faker.helpers.arrayElement(purchaseStatuses),
        },
      });
      purchaseCount++;
    }
  }

  // Créer des favoris
  console.log("❤️ Création des favoris...");
  let favoriteCount = 0;

  // Favoris pour Igor
  const igorFavoriteEvents = events.filter(e => ["Concerts", "Festivals", "Conférences"].includes(categories.find(c => c.id === e.categoryId)?.name || "")).slice(0, 5); // 5 favoris dans Concerts, Festivals, Conférences
  for (const event of igorFavoriteEvents) {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId: igorUser.id,
          eventId: event.id,
        },
      },
    });

    if (!existingFavorite) {
      await prisma.favorite.create({
        data: {
          id: faker.string.uuid(),
          userId: igorUser.id,
          eventId: event.id,
        },
      });
      favoriteCount++;
    }
  }

  // Favoris pour autres utilisateurs
  for (let i = 0; i < 145; i++) { // Réduit pour maintenir ~150 favoris
    const user = faker.helpers.arrayElement(users.filter(u => u.id !== igorUser.id));
    const event = faker.helpers.arrayElement(events);

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        },
      },
    });

    if (!existingFavorite) {
      await prisma.favorite.create({
        data: {
          id: faker.string.uuid(),
          userId: user.id,
          eventId: event.id,
        },
      });
      favoriteCount++;
    }
  }

  // Créer des notifications
  console.log("🔔 Création des notifications...");
  let notificationCount = 0;

  // Notifications pour Igor
  await prisma.notification.create({
    data: {
      id: faker.string.uuid(),
      userId: igorUser.id,
      subject: "Bienvenue sur Benin Events !",
      content: "Merci de vous être inscrit. Découvrez nos événements recommandés !",
      isRead: false,
    },
  });
  notificationCount++;

  await prisma.notification.create({
    data: {
      id: faker.string.uuid(),
      userId: igorUser.id,
      subject: "Nouveau concert à ne pas manquer !",
      content: "Un concert que vous pourriez aimer a été ajouté à vos favoris.",
      isRead: false,
    },
  });
  notificationCount++;

  // Notifications pour autres utilisateurs
  for (let i = 0; i < 98; i++) {
    const user = faker.helpers.arrayElement(users.filter(u => u.id !== igorUser.id));
    await prisma.notification.create({
      data: {
        id: faker.string.uuid(),
        userId: user.id,
        subject: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        isRead: faker.datatype.boolean({ probability: 0.6 }),
      },
    });
    notificationCount++;
  }

  // Créer des feedbacks
  console.log("💬 Création des feedbacks...");
  let feedbackCount = 0;

  // Feedbacks pour Igor
  for (const event of igorEvents) {
    await prisma.feedback.create({
      data: {
        id: faker.string.uuid(),
        name: igorUser.name,
        eventId: event.id,
        userId: igorUser.id,
        email: igorUser.email,
        rating: faker.number.int({ min: 3, max: 5 }), // Feedback positif
        comment: faker.lorem.paragraph(),
      },
    });
    feedbackCount++;
  }

  // Feedbacks pour autres utilisateurs
  for (let i = 0; i < 77; i++) { // Réduit pour maintenir ~80 feedbacks
    const event = faker.helpers.arrayElement(events);
    const user = faker.datatype.boolean({ probability: 0.7 }) ? faker.helpers.arrayElement(users.filter(u => u.id !== igorUser.id)) : null;

    await prisma.feedback.create({
      data: {
        id: faker.string.uuid(),
        name: user ? user.name : faker.person.fullName(),
        eventId: event.id,
        userId: user?.id,
        email: user ? user.email : faker.internet.email(),
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.paragraph(),
      },
    });
    feedbackCount++;
  }

  // Créer des recommandations
  console.log("🎯 Création des recommandations...");
  let recommendationCount = 0;
  for (let i = 0; i < 60; i++) {
    const event = faker.helpers.arrayElement(events);
    await prisma.recommendation.create({
      data: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        eventId: event.id,
        score: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
        message: faker.lorem.sentence(),
      },
    });
    recommendationCount++;
  }

  // Créer des campagnes marketing
  console.log("📢 Création des campagnes marketing...");
  let marketingCampaignCount = 0;
  for (let i = 0; i < 20; i++) {
    const event = faker.helpers.arrayElement(events);
    const startDate = faker.date.past();
    const endDate = faker.date.future({ refDate: startDate });

    await prisma.marketingCampaign.create({
      data: {
        id: faker.string.uuid(),
        name: faker.lorem.words({ min: 2, max: 4 }),
        description: faker.lorem.paragraph(),
        eventId: event.id,
        startDate,
        endDate,
      },
    });
    marketingCampaignCount++;
  }

  console.log("✅ Seeding terminé avec succès!");
  console.log(`📊 Statistiques:`);
  console.log(`   - ${users.length} utilisateurs créés`);
  console.log(`   - ${sessionCount} sessions créées`);
  console.log(`   - ${categories.length} catégories créées`);
  console.log(`   - ${events.length} événements créés`);
  console.log(`   - ${eventDates.length} dates d'événements créées`);
  console.log(`   - ${ticketCount} billets créés`);
  console.log(`   - ${purchaseCount} achats créés`);
  console.log(`   - ${favoriteCount} favoris créés`);
  console.log(`   - ${notificationCount} notifications créées`);
  console.log(`   - ${feedbackCount} feedbacks créés`);
  console.log(`   - ${recommendationCount} recommandations créées`);
  console.log(`   - ${marketingCampaignCount} campagnes marketing créées`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });