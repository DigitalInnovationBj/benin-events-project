import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getAdminQueue } from "@/lib/admin-queue";
import { hasScannableEvents } from "@/lib/scan-access";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    if (user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    // Même menu que /dashboard : contrôle d'accès et compteurs « À valider ».
    const [canScan, adminQueue] = await Promise.all([
        hasScannableEvents(user),
        getAdminQueue(),
    ]);

    return (
        <DashboardChrome
            title="Administration"
            canScan={canScan}
            adminQueue={adminQueue}
            user={{
                name: user.name || user.email.split("@")[0],
                email: user.email,
                imageUrl: user.image ?? undefined,
                role: "ADMIN",
            }}
        >
            {children}
        </DashboardChrome>
    );
}
