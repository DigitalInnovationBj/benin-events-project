const { PrismaClient } = require('../lib/generated/prisma');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Configuration Faker pour le français
faker.locale = 'fr';

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.marketingCampaign.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.eventDate.deleteMany();
  await prisma.event.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Créer des utilisateurs
  console.log('👥 Création des utilisateurs...');
  const users = [];
  
  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      id: faker.string.uuid(),
      name: 'Admin Benin Events',
      email: 'admin@beninevents.com',
      role: 'ADMIN',
      emailVerified: true,
      image: faker.image.avatar(),
    },
  });
  users.push(admin);

  // Créer des utilisateurs normaux
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'USER',
        emailVerified: faker.datatype.boolean(0.8), // 80% des utilisateurs vérifiés
        image: faker.image.avatar(),
      },
    });
    users.push(user);
  }

  // Créer des sessions pour certains utilisateurs
  console.log('🔐 Création des sessions...');
  for (let i = 0; i < 30; i++) {
    const user = faker.helpers.arrayElement(users);
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
  }

  // Créer des événements
  console.log('🎉 Création des événements...');
  const events = [];
  const eventTypes = ['FREE', 'FREE_WITH_REGISTRATION', 'PAID'];
  const eventStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  const recurrenceTypes = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

  for (let i = 0; i < 100; i++) {
    const eventType = faker.helpers.arrayElement(eventTypes);
    const event = await prisma.event.create({
      data: {
        id: faker.string.uuid(),
        title: faker.lorem.words(faker.number.int({ min: 2, max: 6 })),
        slug: faker.helpers.slugify(faker.lorem.words(3)),
        description: faker.lorem.paragraphs(faker.number.int({ min: 2, max: 5 })),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        type: eventType,
        status: faker.helpers.arrayElement(eventStatuses),
        price: eventType === 'PAID' ? faker.number.float({ min: 1000, max: 50000, fractionDigits: 0 }) : null,
        maxTickets: faker.number.int({ min: 10, max: 500 }),
        image: faker.image.url({ width: 800, height: 600 }),
      },
    });
    events.push(event);
  }

  // Créer des dates d'événements
  console.log('📅 Création des dates d\'événements...');
  const eventDates = [];
  
  for (const event of events) {
    const numDates = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < numDates; i++) {
      const startDate = faker.date.future();
      const endDate = faker.date.future({ refDate: startDate });
      const recurrenceType = faker.helpers.arrayElement(recurrenceTypes);
      
      const eventDate = await prisma.eventDate.create({
        data: {
          id: faker.string.uuid(),
          eventId: event.id,
          startDateTime: startDate,
          endDateTime: endDate,
          isAllDay: faker.datatype.boolean(0.3), // 30% d'événements toute la journée
          reccurenceType: recurrenceType,
          reccurenceEnd: recurrenceType !== 'NONE' ? faker.date.future({ refDate: endDate }) : null,
        },
      });
      eventDates.push(eventDate);
    }
  }

  // Créer des billets
  console.log('🎫 Création des billets...');
  const ticketCombinations = new Set();
  
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(users);
    const event = faker.helpers.arrayElement(events);
    const eventDate = eventDates.find(ed => ed.eventId === event.id);
    
    // Créer une clé unique pour la combinaison eventId + userId
    const combinationKey = `${event.id}-${user.id}`;
    
    if (eventDate && !ticketCombinations.has(combinationKey)) {
      ticketCombinations.add(combinationKey);
      
      await prisma.ticket.create({
        data: {
          id: faker.string.uuid(),
          eventId: event.id,
          eventDateId: eventDate.id,
          userId: user.id,
          qrcode: faker.string.alphanumeric(32),
          code: faker.string.alphanumeric(8).toUpperCase(),
        },
      });
    }
  }

  // Créer des favoris
  console.log('❤️ Création des favoris...');
  for (let i = 0; i < 150; i++) {
    const user = faker.helpers.arrayElement(users);
    const event = faker.helpers.arrayElement(events);
    
    // Vérifier que la combinaison n'existe pas déjà
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
    }
  }

  // Créer des notifications
  console.log('🔔 Création des notifications...');
  for (let i = 0; i < 100; i++) {
    const user = faker.helpers.arrayElement(users);
    await prisma.notification.create({
      data: {
        id: faker.string.uuid(),
        userId: user.id,
        subject: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        isRead: faker.datatype.boolean(0.6), // 60% des notifications lues
      },
    });
  }

  // Créer des feedbacks
  console.log('💬 Création des feedbacks...');
  for (let i = 0; i < 80; i++) {
    const event = faker.helpers.arrayElement(events);
    const user = faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(users) : null;
    
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
  }

  // Créer des recommandations
  console.log('🎯 Création des recommandations...');
  for (let i = 0; i < 60; i++) {
    const event = faker.helpers.arrayElement(events);
    await prisma.recommendation.create({
      data: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        eventId: event.id,
        score: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
        message: faker.lorem.sentence(),
      },
    });
  }

  // Créer des campagnes marketing
  console.log('📢 Création des campagnes marketing...');
  for (let i = 0; i < 20; i++) {
    const event = faker.helpers.arrayElement(events);
    const startDate = faker.date.past();
    const endDate = faker.date.future({ refDate: startDate });
    
    await prisma.marketingCampaign.create({
      data: {
        id: faker.string.uuid(),
        name: faker.lorem.words(faker.number.int({ min: 2, max: 4 })),
        description: faker.lorem.paragraph(),
        eventId: event.id,
        startDate,
        endDate,
      },
    });
  }

  console.log('✅ Seeding terminé avec succès!');
  console.log(`📊 Statistiques:`);
  console.log(`   - ${users.length} utilisateurs créés`);
  console.log(`   - ${events.length} événements créés`);
  console.log(`   - ${eventDates.length} dates d'événements créées`);
  console.log(`   - 200 billets créés`);
  console.log(`   - 150 favoris créés`);
  console.log(`   - 100 notifications créées`);
  console.log(`   - 80 feedbacks créés`);
  console.log(`   - 60 recommandations créées`);
  console.log(`   - 20 campagnes marketing créées`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
