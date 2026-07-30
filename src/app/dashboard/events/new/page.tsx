import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSettings } from "@/actions/settings.actions";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage({
    searchParams,
}: {
    searchParams: Promise<{ payment_error?: string }>;
}) {
    const dbUser = await getCurrentUser();
    if (!dbUser) redirect("/sign-in");

    if (dbUser.role !== "ORGANIZER" && dbUser.role !== "ADMIN") {
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
