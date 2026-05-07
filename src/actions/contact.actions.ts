"use server";

import prisma from "@/lib/prisma";
import { sendContactEmails } from "@/lib/email";

const SUBJECTS: Record<string, string> = {
    information: "Demande d'information",
    billet: "Problème avec un billet",
    organisateur: "Devenir organisateur",
    partenariat: "Partenariat",
    signalement: "Signaler un problème",
    autre: "Autre",
};

export async function sendContactMessage(formData: FormData) {
    const name = (formData.get("user_name") as string)?.trim();
    const email = (formData.get("user_email") as string)?.trim();
    const subjectKey = (formData.get("user_subject") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!name || !email || !subjectKey || !message) {
        return { error: "Tous les champs sont obligatoires." };
    }

    const subject = SUBJECTS[subjectKey] ?? subjectKey;

    await prisma.contactMessage.create({
        data: { name, email, subject, message },
    });

    void sendContactEmails({ name, email, subject, message }).catch(
        console.error,
    );

    return { success: true };
}
