import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
        <SidebarProvider>
            <DashboardSidebar
                user={{
                    name: user.name || user.email.split("@")[0],
                    email: user.email,
                    imageUrl: user.image ?? undefined,
                    role: "ADMIN",
                }}
            />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <span className="text-sm font-medium">Administration</span>
                </header>
                <main className="p-4 md:p-8">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
