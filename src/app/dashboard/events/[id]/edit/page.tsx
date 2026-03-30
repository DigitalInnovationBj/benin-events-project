import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventEditForm } from "./event-edit-form";

export default async function EditEventPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser || (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")) {
        redirect("/dashboard");
    }

    const [event, allCategories] = await Promise.all([
        prisma.event.findUnique({
            where: { id },
            include: {
                categories: {
                    include: { category: true },
                },
            },
        }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    if (!event) redirect("/dashboard/events");

    if (dbUser.role !== "ADMIN" && event.organizerId !== dbUser.id) {
        redirect("/dashboard/events");
    }

    return (
        <EventEditForm
            event={event}
            allCategories={allCategories}
            isAdmin={dbUser.role === "ADMIN"}
        />
    );
}
