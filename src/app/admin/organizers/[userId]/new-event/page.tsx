import { requireAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { NewEventForm } from "@/app/dashboard/events/new/NewEventForm";

export default async function AdminNewEventForOrganizerPage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    await requireAdmin();
    const { userId } = await params;

    const organizer = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true },
    });

    if (!organizer || (organizer.role !== "ORGANIZER" && organizer.role !== "ADMIN")) {
        redirect("/admin/organizers");
    }

    return (
        <NewEventForm
            eventCreationFeeEnabled={false}
            eventCreationFee={0}
            paymentError={false}
            targetOrganizerId={organizer.id}
            targetOrganizerName={organizer.name}
        />
    );
}
