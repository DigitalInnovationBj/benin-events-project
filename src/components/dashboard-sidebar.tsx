"use client";

import {
    CalendarRange,
    LayoutDashboard,
    Ticket,
    ShieldCheck,
    PenTool,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

type Role = "USER" | "ORGANIZER" | "ADMIN";

export function DashboardSidebar({ role }: { role: Role }) {
    const pathname = usePathname();

    const mainNav = [
        {
            title: "Vue d'ensemble",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Mes Billets",
            url: "/dashboard/tickets",
            icon: Ticket,
        },
    ];

    const organizerNav = [
        {
            title: "Mes Évènements",
            url: "/dashboard/events",
            icon: CalendarRange,
        },
    ];

    const adminNav = [
        {
            title: "Administration",
            url: "/admin/requests",
            icon: ShieldCheck,
        },
    ];

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50">
                <Link href="/dashboard" className="flex items-center gap-2 mt-2 group">
                    <span className="font-afo text-3xl text-secondary transition-transform group-hover:scale-110">
                        BE
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            {role === "USER" && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/dashboard/demande-organisateur"} tooltip="Devenir Organisateur">
                                        <Link href="/dashboard/demande-organisateur">
                                            <PenTool />
                                            <span>Devenir Organisateur</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {(role === "ORGANIZER" || role === "ADMIN") && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Espace Organisateur</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {organizerNav.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {role === "ADMIN" && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Espace Admin</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {adminNav.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin")} tooltip={item.title}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="border-t border-border/50 p-4">
                <LogoutButton className="w-full justify-start" />
            </SidebarFooter>
        </Sidebar>
    );
}
