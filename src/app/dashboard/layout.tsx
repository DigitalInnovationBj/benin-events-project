import { ReactNode } from "react";
import { syncUser } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

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

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}
