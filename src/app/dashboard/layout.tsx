import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <DashboardChrome
            title="Tableau de bord"
            user={{
                name: user.name || user.email.split("@")[0],
                email: user.email,
                imageUrl: user.image ?? undefined,
                role: user.role,
            }}
        >
            {children}
        </DashboardChrome>
    );
}
