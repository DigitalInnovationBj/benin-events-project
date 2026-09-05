import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
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

    return (
        <DashboardChrome
            title="Administration"
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
