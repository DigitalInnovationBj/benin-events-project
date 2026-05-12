import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSettings } from "@/actions/settings.actions";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage({
    searchParams,
}: {
    searchParams: Promise<{ payment_error?: string }>;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN")) {
        redirect("/dashboard");
    }

    const [settings, { payment_error }] = await Promise.all([
        getSettings(),
        searchParams,
    ]);

    const showFeeNotice =
        settings.eventCreationFeeEnabled && dbUser.role !== "ADMIN";

    return (
        <NewEventForm
            eventCreationFeeEnabled={showFeeNotice}
            eventCreationFee={settings.eventCreationFee}
            paymentError={!!payment_error}
        />
    );
}
