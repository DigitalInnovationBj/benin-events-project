import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getAdminQueue } from "@/lib/admin-queue";
import { hasScannableEvents } from "@/lib/scan-access";
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

    const [canScan, adminQueue] = await Promise.all([
        hasScannableEvents(user),
        user.role === "ADMIN" ? getAdminQueue() : Promise.resolve(undefined),
    ]);

    return (
        <DashboardChrome
            title="Tableau de bord"
            canScan={canScan}
            adminQueue={adminQueue}
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
