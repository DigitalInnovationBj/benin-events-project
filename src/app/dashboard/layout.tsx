import { ReactNode } from "react";
import { syncUser } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import DashboardNavClient from "@/components/sections/DashboardNavClient";

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Synchronisation de l'utilisateur avec la base de données
    await syncUser();

    // Fetch full Clerk user object
    const user = await currentUser();

    // Récupérer le rôle et les infos depuis la BD
    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    const userRole = (dbUser?.role ?? "USER") as "USER" | "ORGANIZER" | "ADMIN";

    const displayName =
        dbUser?.name ||
        user?.firstName ||
        user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "Utilisateur";

    const email =
        dbUser?.email || user?.emailAddresses?.[0]?.emailAddress || "";

    const imageUrl = dbUser?.image || user?.imageUrl || undefined;

    return (
        <div className="min-h-screen bg-background">
            <DashboardNavClient
                user={{
                    name: displayName,
                    email,
                    imageUrl,
                    role: userRole,
                }}
            />
            <main className="p-4 md:p-8">{children}</main>
        </div>
    );
}
