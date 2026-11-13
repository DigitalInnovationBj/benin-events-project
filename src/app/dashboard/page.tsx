import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { OrganizerHome } from "./organizer-home";
import { AdminHome } from "./admin-home";
import { UserHome } from "./user-home";

/**
 * Accueil du tableau de bord : un accueil dédié par rôle.
 * Organisateur → ses évènements ; administrateur → la plateforme et ce qui
 * attend une validation ; utilisateur → ses billets et ses missions d'agent.
 */
export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    const name = user.name || user.email.split("@")[0];

    if (user.role === "ORGANIZER") {
        return <OrganizerHome user={{ id: user.id, name }} />;
    }
    if (user.role === "ADMIN") {
        return <AdminHome name={name} />;
    }
    return <UserHome user={{ id: user.id, name, email: user.email }} />;
}
