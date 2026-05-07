"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CalendarRange,
    PlusCircle,
    PenTool,
    ShieldCheck,
    ArrowLeft,
    X,
    LayoutPanelTop,
    Settings,
    Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { UserProfileMenu } from "@/components/user-profile-menu";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Role = "USER" | "ORGANIZER" | "ADMIN";

interface DashboardNavUser {
    name: string;
    email: string;
    imageUrl?: string;
    role: Role;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    exact: boolean;
}

// ─────────────────────────────────────────────
// Nav items par rôle
// ─────────────────────────────────────────────

function getNavItems(role: Role): NavItem[] {
    const items: NavItem[] = [
        {
            href: "/dashboard",
            label: "Vue d'ensemble",
            icon: LayoutDashboard,
            exact: true,
        },
    ];

    if (role === "USER") {
        items.push({
            href: "/dashboard/demande-organisateur",
            label: "Devenir organisateur",
            icon: PenTool,
            exact: false,
        });
    }

    if (role === "ORGANIZER" || role === "ADMIN") {
        items.push({
            href: "/dashboard/events",
            label: "Mes évènements",
            icon: CalendarRange,
            exact: false,
        });
        items.push({
            href: "/dashboard/payout",
            label: "Reversements",
            icon: Banknote,
            exact: false,
        });
    }

    if (role === "ADMIN") {
        items.push({
            href: "/admin/requests",
            label: "Administration",
            icon: ShieldCheck,
            exact: false,
        });
        items.push({
            href: "/admin/payouts",
            label: "Reversements",
            icon: Banknote,
            exact: false,
        });
        items.push({
            href: "/admin/settings",
            label: "Paramètres",
            icon: Settings,
            exact: false,
        });
    }

    return items;
}

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

export default function DashboardNavClient({
    user,
}: {
    user: DashboardNavUser;
}) {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navItems = getNavItems(user.role);
    const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto h-16 px-6 md:px-12 flex items-center justify-between gap-4">

                {/* ── Logo ──────────────────────────────────────────────── */}
                <Link
                    href="/dashboard"
                    className="font-afo text-3xl text-secondary shrink-0 hover:opacity-80 transition-opacity"
                >
                    Benin Events
                </Link>

                {/* ── Navigation desktop ────────────────────────────────── */}
                <nav className="hidden md:flex items-center gap-1 flex-1 ml-2">
                    {navItems.map(({ href, label, icon: Icon, exact }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                                isActive(href, exact)
                                    ? "bg-secondary/10 text-secondary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* ── Droite desktop ────────────────────────────────────── */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    {/* Créer un évènement (organisateurs) */}
                    {isOrganizer && (
                        <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="rounded-xl gap-1.5 text-xs"
                        >
                            <Link href="/dashboard/events/new">
                                <PlusCircle className="w-3.5 h-3.5" />
                                Créer un évènement
                            </Link>
                        </Button>
                    )}

                    {/* Retour site public */}
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <Link href="/events">
                            <ArrowLeft className="w-4 h-4" />
                            Site public
                        </Link>
                    </Button>

                    {/* Avatar */}
                    <UserProfileMenu
                        name={user.name}
                        email={user.email}
                        imageUrl={user.imageUrl}
                    />
                </div>

                {/* ── Droite mobile ─────────────────────────────────────── */}
                <div className="flex md:hidden items-center gap-1">
                    <Drawer
                        open={drawerOpen}
                        onOpenChange={setDrawerOpen}
                        shouldScaleBackground={false}
                    >
                        <DrawerTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl"
                                aria-label="Ouvrir le menu"
                            >
                                <LayoutPanelTop className="w-5 h-5" />
                            </Button>
                        </DrawerTrigger>

                        <DrawerContent className="px-6 pb-10 max-h-[90dvh]">
                            {/* En-tête drawer */}
                            <div className="flex items-center justify-between py-4 mb-2">
                                <DrawerClose asChild>
                                    <Link
                                        href="/dashboard"
                                        className="font-afo text-2xl text-secondary"
                                    >
                                        Benin Events
                                    </Link>
                                </DrawerClose>
                                <DrawerClose asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-xl"
                                        aria-label="Fermer le menu"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </DrawerClose>
                            </div>

                            {/* Liens dashboard */}
                            <nav className="flex flex-col gap-1 mb-4">
                                {navItems.map(
                                    ({ href, label, icon: Icon, exact }) => (
                                        <DrawerClose key={href} asChild>
                                            <Link
                                                href={href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                                                    isActive(href, exact)
                                                        ? "bg-secondary/10 text-secondary"
                                                        : "text-foreground hover:bg-muted/50",
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "w-4 h-4 shrink-0",
                                                        isActive(href, exact)
                                                            ? "text-secondary"
                                                            : "text-muted-foreground",
                                                    )}
                                                />
                                                {label}
                                            </Link>
                                        </DrawerClose>
                                    ),
                                )}

                                {/* Créer un évènement (organisateurs) */}
                                {isOrganizer && (
                                    <DrawerClose asChild>
                                        <Link
                                            href="/dashboard/events/new"
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                                                isActive(
                                                    "/dashboard/events/new",
                                                    true,
                                                )
                                                    ? "bg-secondary/10 text-secondary"
                                                    : "text-foreground hover:bg-muted/50",
                                            )}
                                        >
                                            <PlusCircle
                                                className={cn(
                                                    "w-4 h-4 shrink-0",
                                                    isActive(
                                                        "/dashboard/events/new",
                                                        true,
                                                    )
                                                        ? "text-secondary"
                                                        : "text-muted-foreground",
                                                )}
                                            />
                                            Créer un évènement
                                        </Link>
                                    </DrawerClose>
                                )}

                                {/* Retour site public */}
                                <DrawerClose asChild>
                                    <Link
                                        href="/events"
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 shrink-0" />
                                        Retour au site public
                                    </Link>
                                </DrawerClose>
                            </nav>

                            {/* Section utilisateur */}
                            <div className="border-t border-border pt-5">
                                <div className="flex items-center gap-3 px-1">
                                    <UserProfileMenu
                                        name={user.name}
                                        email={user.email}
                                        imageUrl={user.imageUrl}
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold leading-tight truncate">
                                            {user.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>
        </header>
    );
}
