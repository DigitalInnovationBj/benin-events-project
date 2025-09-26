import EmailTemplate from "@/components/emails/favorisTemplate";
import { CheckUserRole } from "@/functions/checkUserRole";
import { prisma } from "@/functions/prisma";
import { Role } from "@/lib/generated/prisma";
import { ApiResponse } from "@/utils/format-api-response";
import { sendMail } from "@/utils/send-mail-api";
import z from "zod";

export async function POST(request: Request) {
  try {
    // Valider les données d'entrée
    const EmailContentSchema = z.object({
      subject: z.string().min(1, "Le sujet est requis").max(100, "Le sujet est trop long"),
      content: z.string().min(1, "Le contenu est requis"),
    });

    const dataBody = await request.json();
    const validateData = EmailContentSchema.safeParse(dataBody);
    if (!validateData.success) {
      return ApiResponse({
        success: false,
        error: validateData.error.issues.map((issue) => issue.message).join(", "),
        statusCode: 400,
      });
    }

    // Vérifier que l'utilisateur est un admin
    const user = await CheckUserRole(request, Role.ADMIN);
    if (user.state === false) {
      return ApiResponse({
        success: false,
        error: user.error || "Non autorisé",
        statusCode: 401,
      });
    }

    // Récupérer les utilisateurs avec des favoris et leurs préférences
    const usersWithFavorites = await prisma.user.findMany({
      where: {
        favorites: {
          some: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        favorites: {
          select: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });

    // Préparer les emails personnalisés
    const emailContents = [];
    for (const user of usersWithFavorites) {
      // Récupérer les catégories des événements favoris
      const favoriteCategoryIds = [
        ...new Set(user.favorites.map((f) => f.event.categoryId).filter((id): id is string => id !== null)),
      ];

      // Trouver des événements similaires (même catégorie, approuvés, dates futures)
      const recommendedEvents = await prisma.event.findMany({
        where: {
          categoryId: {
            in: favoriteCategoryIds,
          },
          status: "APPROVED",
          dates: {
            some: {
              startDateTime: {
                gte: new Date(), // Événements futurs uniquement
              },
            },
          },
          NOT: {
            id: {
              in: user.favorites.map((f) => f.event.id), // Exclure les événements déjà en favoris
            },
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          image: true,
          dates: {
            select: {
              startDateTime: true,
            },
            orderBy: {
              startDateTime: "asc",
            },
            take: 1,
          },
        },
        take: 3, // Limiter à 3 recommandations par utilisateur
      });

      // Formater les données pour le template
      const formattedEvents = recommendedEvents.map((event) => ({
        id: event.id,
        title: event.title,
        slug: `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.slug}`,
        location: event.location,
        image: event.image,
        startDate: event.dates[0]?.startDateTime.toISOString(),
      }));

      // Rendre le template d'email
      const emailHtml = EmailTemplate({
        userName: user.name,
        recommendedEvents: formattedEvents,
        message: validateData.data.content,
      });

      emailContents.push({
        userEmail: user.email,
        html: emailHtml,
      });   
    }

    // Envoyer les emails avec un délai de 2 secondes entre chaque envoi
    for (const email of emailContents) {
      await sendMail({
        mail: [email.userEmail],
        content: email.html,
        subject: validateData.data.subject,
      });
      
      // Attendre 2 secondes avant l'envoi suivant
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return ApiResponse({
      success: true,
      data: { message: `Emails envoyés avec succès à ${emailContents.length} utilisateurs` },
      statusCode: 200,
    });

  } catch (error) {
    return ApiResponse({
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    });
  }
}