import { ReactNode } from "react";
import { syncUser } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import prisma from "@/lib/prisma";

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

    // Récupérer le rôle de l'utilisateur depuis la BD
    const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
    });

    const userRole = dbUser?.role || "USER";

    return (
        <SidebarProvider>
            <DashboardSidebar role={userRole} />
            <div className="flex min-h-screen flex-col flex-1 bg-background w-full">
                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 md:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1" />
                    {/* Elements additionnels du header peuvent aller ici */}
                </header>
                <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
