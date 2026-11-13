import { redirect } from "next/navigation";

/** La gestion des agents vit désormais dans l'onglet « Équipe » de l'évènement. */
export default async function EventAgentsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    redirect(`/dashboard/events/${id}?tab=equipe`);
}
