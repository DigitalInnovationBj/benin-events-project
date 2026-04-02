import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardNavClient from "@/components/sections/DashboardNavClient";

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
    });

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const displayName =
        dbUser?.name ||
        user.firstName ||
        user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "Administrateur";

    const email = dbUser?.email || user.emailAddresses?.[0]?.emailAddress || "";

    const imageUrl = dbUser?.image || user.imageUrl || undefined;

    return (
        <div className="min-h-screen bg-background">
            <DashboardNavClient
                user={{
                    name: displayName,
                    email,
                    imageUrl,
                    role: "ADMIN",
                }}
            />
            <main className="p-4 md:p-8">{children}</main>
        </div>
    );
}
