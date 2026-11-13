"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    IconArrowLeft,
    IconCash,
    IconCalendarEvent,
    IconSelector,
    IconHeartHandshake,
    IconHome,
    IconHelpCircle,
    IconPlus,
    IconShoppingBag,
    IconLoader2,
    IconLogout,
    IconPencil,
    IconSettings,
    IconShieldCheck,
    IconTicket,
    IconUserCircle,
    IconScan,
} from "@tabler/icons-react";

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

// Navigation segmentée par usage : ce qui me concerne (Personnel), ce que
// j'organise (Organiser), le jour de l'évènement (Jour J), l'aide.
const PERSONAL_NAV: NavItem[] = [
    { title: "Accueil", url: "/dashboard", icon: IconHome, exact: true },
    { title: "Mes billets", url: "/mes-billets", icon: IconTicket },
    { title: "Mon compte", url: "/mon-compte", icon: IconUserCircle },
];

const ORGANIZER_NAV: NavItem[] = [
    { title: "Mes évènements", url: "/dashboard/events", icon: IconCalendarEvent },
    { title: "Commandes", url: "/dashboard/commandes", icon: IconShoppingBag },
    { title: "Finances", url: "/dashboard/payout", icon: IconCash },
];

const SCAN_NAV: NavItem[] = [
    { title: "Contrôle d'accès", url: "/dashboard/scan", icon: IconScan },
];

const HELP_NAV: NavItem[] = [
    { title: "Guide", url: "/dashboard/guide", icon: IconHelpCircle },
    { title: "Devenir partenaire", url: "/devenir-partenaire", icon: IconHeartHandshake },
];

const ADMIN_NAV: NavItem[] = [
    { title: "Demandes", url: "/admin/requests", icon: IconShieldCheck },
    { title: "Candidatures partenaires", url: "/admin/partner-requests", icon: IconHeartHandshake },
    { title: "Organisateurs", url: "/admin/organizers", icon: IconUserCircle },
    { title: "Reversements", url: "/admin/payouts", icon: IconCash },
    { title: "Paramètres", url: "/admin/settings", icon: IconSettings },
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
                            <IconSelector className="ml-auto size-4" />
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
                            <Link href="/mon-compte">
                                <IconUserCircle className="mr-2 h-4 w-4" />
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
                            <IconLogout className="mr-2 h-4 w-4" />
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
                                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
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

export function DashboardSidebar({
    user,
    canScan = false,
}: {
    user: DashboardSidebarUser;
    /** Affiche le groupe « Contrôle d'accès » — agents comme organisateurs. */
    canScan?: boolean;
}) {
    const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";

    const mainItems = [...PERSONAL_NAV];
    if (user.role === "USER") {
        mainItems.push({
            title: "Devenir organisateur",
            url: "/dashboard/demande-organisateur",
            icon: IconPencil,
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
                {isOrganizer && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip="Créer un évènement"
                                        className="bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 hover:text-secondary-foreground active:bg-secondary/90 active:text-secondary-foreground"
                                    >
                                        <Link href="/dashboard/events/new">
                                            <IconPlus />
                                            <span>Créer un évènement</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
                <NavGroup label="Personnel" items={mainItems} />
                {isOrganizer && (
                    <NavGroup label="Organiser" items={ORGANIZER_NAV} />
                )}
                {/* Visible dès qu'il y a un évènement à contrôler : un agent
                    a le rôle USER et n'avait donc aucun point d'entrée. */}
                {canScan && <NavGroup label="Jour J" items={SCAN_NAV} />}
                {isOrganizer && <NavGroup label="Aide" items={HELP_NAV} />}
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
                                        <IconArrowLeft />
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
