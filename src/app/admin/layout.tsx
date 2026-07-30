import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import DashboardNavClient from "@/components/sections/DashboardNavClient";

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
        <div className="min-h-screen bg-background">
            <DashboardNavClient
                user={{
                    name: user.name || user.email.split("@")[0],
                    email: user.email,
                    imageUrl: user.image ?? undefined,
                    role: "ADMIN",
                }}
            />
            <main className="p-4 md:p-8">{children}</main>
        </div>
    );
}
