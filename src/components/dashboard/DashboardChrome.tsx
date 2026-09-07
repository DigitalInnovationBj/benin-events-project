import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface DashboardChromeProps {
    user: {
        name: string;
        email: string;
        imageUrl?: string;
        role: "USER" | "ORGANIZER" | "ADMIN";
    };
    title: string;
    /** L'utilisateur a au moins un évènement à contrôler à l'entrée. */
    canScan?: boolean;
    children: ReactNode;
}

/** Coquille partagée entre /dashboard et /admin — évite la duplication des
 * deux layouts (sidebar/header identiques, seul le titre et le guard diffèrent). */
export function DashboardChrome({ user, title, canScan = false, children }: DashboardChromeProps) {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <DashboardSidebar user={user} canScan={canScan} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <span className="text-sm font-medium">{title}</span>
                    </header>
                    <main className="p-4 md:p-8">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
