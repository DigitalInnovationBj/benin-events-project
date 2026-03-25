import { ReactNode } from "react";
import { syncUser } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import prisma from "@/lib/prisma";
import { UserProfileMenu } from "@/components/user-profile-menu";

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

    // Fetch full Clerk user object efficiently
    const user = await currentUser();

    // Récupérer le rôle de l'utilisateur depuis la BD
    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    const userRole = dbUser?.role || "USER";
    const displayName =
        dbUser?.name ||
        user?.firstName ||
        user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "Utilisateur";
    const email =
        dbUser?.email ||
        user?.emailAddresses?.[0]?.emailAddress ||
        "Utilisateur inconnu";
    const imageUrl = dbUser?.image || user?.imageUrl;

    return (
        <SidebarProvider>
            <DashboardSidebar role={userRole} />
            <div className="flex flex-col flex-1 min-h-screen bg-background min-w-0 overflow-hidden">
                <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="-ml-1" />
                        <h2 className="font-bold text-sm hidden sm:block">
                            Tableau de bord
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserProfileMenu
                            name={displayName}
                            email={email}
                            imageUrl={imageUrl}
                        />
                    </div>
                </header>
                <main className="p-4 md:p-8">{children}</main>
            </div>
        </SidebarProvider>
    );
}
