import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

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

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <header className="bg-card shadow-sm border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold font-afo">
                    Benin Events - Admin
                </h1>
                <nav className="flex gap-4 text-sm font-medium">
                    <a
                        href="/admin/requests"
                        className="text-primary hover:underline"
                    >
                        Demandes Organisateurs
                    </a>
                    <a
                        href="/dashboard"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Retour au Dashboard
                    </a>
                </nav>
            </header>
            <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
    );
}
