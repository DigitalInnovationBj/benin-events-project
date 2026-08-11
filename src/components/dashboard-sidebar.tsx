"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    ArrowLeft,
    Banknote,
    CalendarRange,
    ChevronsUpDown,
    Handshake,
    LayoutDashboard,
    Loader2,
    LogOut,
    PenTool,
    PlusCircle,
    Settings,
    ShieldCheck,
    Ticket,
    UserRound,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Role = "USER" | "ORGANIZER" | "ADMIN";

export interface DashboardSidebarUser {
    name: string;
    email: string;
    imageUrl?: string;
    role: Role;
}

interface NavItem {
    title: string;
    url: string;
    icon: React.ElementType;
    exact?: boolean;
}

// ─────────────────────────────────────────────
// Nav items par rôle
// ─────────────────────────────────────────────

const MAIN_NAV: NavItem[] = [
    { title: "Vue d'ensemble", url: "/dashboard", icon: LayoutDashboard, exact: true },
    { title: "Mes commandes", url: "/dashboard/orders", icon: Ticket },
    { title: "Mon profil", url: "/dashboard/profile", icon: UserRound },
];

const ORGANIZER_NAV: NavItem[] = [
    { title: "Mes évènements", url: "/dashboard/events", icon: CalendarRange, exact: true },
    { title: "Créer un évènement", url: "/dashboard/events/new", icon: PlusCircle, exact: true },
    { title: "Reversements", url: "/dashboard/payout", icon: Banknote },
    { title: "Devenir partenaire", url: "/devenir-partenaire", icon: Handshake },
];

const ADMIN_NAV: NavItem[] = [
    { title: "Demandes", url: "/admin/requests", icon: ShieldCheck },
    { title: "Candidatures partenaires", url: "/admin/partner-requests", icon: Handshake },
    { title: "Reversements", url: "/admin/payouts", icon: Banknote },
    { title: "Paramètres", url: "/admin/settings", icon: Settings },
];

// ─────────────────────────────────────────────
// Groupe de navigation
// ─────────────────────────────────────────────

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
    const pathname = usePathname();

    const isActive = (item: NavItem) =>
        item.exact ? pathname === item.url : pathname.startsWith(item.url);

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive(item)}
                                tooltip={item.title}
                            >
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
    );
}

// ─────────────────────────────────────────────
// Bloc utilisateur (pattern NavUser shadcn)
// ─────────────────────────────────────────────

function NavUser({ user }: { user: DashboardSidebarUser }) {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const emailPrefix = user.email.split("@")[0];
    const displayName = user.name?.trim() ? user.name : emailPrefix;
    const initials = displayName.substring(0, 2).toUpperCase();

    const handleSignOut = async () => {
        setIsLoading(true);
        await authClient.signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                {user.imageUrl && (
                                    <AvatarImage
                                        src={user.imageUrl}
                                        alt={displayName}
                                    />
                                )}
                                <AvatarFallback className="rounded-lg bg-secondary text-primary font-bold text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {displayName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    {user.imageUrl && (
                                        <AvatarImage
                                            src={user.imageUrl}
                                            alt={displayName}
                                        />
                                    )}
                                    <AvatarFallback className="rounded-lg bg-secondary text-primary font-bold text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {displayName}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile">
                                <UserRound className="mr-2 h-4 w-4" />
                                Mon profil
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onSelect={(e) => {
                                e.preventDefault();
                                setConfirmOpen(true);
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Déconnexion
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Se déconnecter de Benin Events
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir vous déconnecter ? Vous
                                devrez vous reconnecter pour accéder à votre
                                espace.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>
                                Annuler
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSignOut();
                                }}
                                disabled={isLoading}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                {isLoading
                                    ? "Déconnexion..."
                                    : "Oui, me déconnecter"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────

export function DashboardSidebar({ user }: { user: DashboardSidebarUser }) {
    const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";

    const mainItems = [...MAIN_NAV];
    if (user.role === "USER") {
        mainItems.push({
            title: "Devenir organisateur",
            url: "/dashboard/demande-organisateur",
            icon: PenTool,
        });
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            tooltip="Benin Events"
                        >
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-secondary">
                                    <span className="font-afo text-lg text-primary">
                                        BE
                                    </span>
                                </div>
                                <span className="font-afo text-xl text-secondary truncate">
                                    Benin Events
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavGroup label="Menu principal" items={mainItems} />
                {isOrganizer && (
                    <NavGroup label="Organisateur" items={ORGANIZER_NAV} />
                )}
                {user.role === "ADMIN" && (
                    <NavGroup label="Administration" items={ADMIN_NAV} />
                )}

                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    tooltip="Site public"
                                    className="text-muted-foreground"
                                >
                                    <Link href="/events">
                                        <ArrowLeft />
                                        <span>Site public</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
