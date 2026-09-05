import Link from "next/link";
import { listOrganizers } from "@/actions/admin-organizer.actions";
import { CreateOrganizerDialog } from "./CreateOrganizerDialog";
import { Button } from "@/components/ui/button";
import { IconCalendarPlus } from "@tabler/icons-react";

export default async function AdminOrganizersPage() {
    const { organizers } = await listOrganizers();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-afo">Organisateurs</h1>
                <CreateOrganizerDialog />
            </div>

            {organizers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    Aucun organisateur pour le moment.
                </p>
            ) : (
                <div className="grid gap-3">
                    {organizers.map((org) => (
                        <div
                            key={org.id}
                            className="bg-card border p-4 rounded-lg shadow-sm flex items-center justify-between gap-4 flex-wrap"
                        >
                            <div>
                                <h3 className="font-bold">{org.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {org.email} · {org._count.events} évènement
                                    {org._count.events !== 1 ? "s" : ""} ·{" "}
                                    {org.role === "ADMIN" ? "Admin" : "Organisateur"}
                                </p>
                            </div>
                            <Link href={`/admin/organizers/${org.id}/new-event`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <IconCalendarPlus className="w-4 h-4" />
                                    Créer un évènement pour ce compte
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
