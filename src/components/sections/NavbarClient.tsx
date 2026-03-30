"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Menu,
    X,
    CalendarDays,
    LayoutDashboard,
    LogIn,
    UserRoundPlus,
    Search,
    LayoutPanelTop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer";
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
import { cn } from "@/lib/utils";
import { UserProfileMenu } from "@/components/user-profile-menu";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NavUser {
    name: string | null;
    email: string;
    image: string | null;
    role: string;
}

interface NavbarClientProps {
    user: NavUser | null;
}

// ─────────────────────────────────────────────
// Liens de navigation
// ─────────────────────────────────────────────

const NAV_LINKS = [
    { href: "/", label: "Accueil", exact: true },
    { href: "/events", label: "Évènements", exact: false },
    { href: "/faq", label: "FAQ", exact: false },
    { href: "/contact", label: "Contact", exact: false },
];

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

export default function NavbarClient({ user }: NavbarClientProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";

    const handleSearch = () => {
        const q = searchQuery.trim();
        router.push(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
        setSearchQuery("");
        setSearchOpen(false);
    };

    // ─────────────────────────────────────────────
    // Search Dialog (AlertDialog)
    // ─────────────────────────────────────────────

    const SearchDialog = (
        <AlertDialog open={searchOpen} onOpenChange={setSearchOpen}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>Rechercher un évènement</AlertDialogTitle>
                    <AlertDialogDescription>
                        Concerts, festivals, soirées, conférences… Trouvez votre
                        prochain évènement au Bénin.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-1">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            autoFocus
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                            placeholder="Concert, festival, conférence…"
                            className="h-12 w-full rounded-xl border bg-muted pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-shadow"
                        />
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSearchQuery("")}>
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleSearch}>
                        Rechercher
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // ─────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────

    return (
        <>
            {/* Search dialog (portal — unique, partagé desktop + mobile) */}
            {SearchDialog}

            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto h-16 px-6 md:px-12 flex items-center justify-between gap-4">
                    {/* ── Logo ──────────────────────────────────────────── */}
                    <Link
                        href="/"
                        className="font-afo text-3xl text-secondary shrink-0 hover:opacity-80 transition-opacity"
                    >
                        Benin Events
                    </Link>

                    {/* ── Navigation desktop ────────────────────────────── */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(({ href, label, exact }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                                    isActive(href, exact)
                                        ? "bg-secondary/10 text-secondary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                )}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* ── Droite desktop : Recherche + Auth ─────────────── */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Bouton recherche */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Rechercher"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className="w-5 h-5" />
                        </Button>

                        {user ? (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl text-sm"
                                >
                                    <Link
                                        href={
                                            isOrganizer
                                                ? "/dashboard"
                                                : "/dashboard/demande-organisateur"
                                        }
                                    >
                                        {isOrganizer
                                            ? "Tableau de bord"
                                            : "Devenir organisateur"}
                                    </Link>
                                </Button>
                                <UserProfileMenu
                                    name={user.name ?? ""}
                                    email={user.email}
                                    imageUrl={user.image ?? undefined}
                                />
                            </>
                        ) : (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl"
                                >
                                    <Link href="/sign-in">Se connecter</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="rounded-xl"
                                >
                                    <Link href="/sign-up">S&apos;inscrire</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* ── Droite mobile : Recherche + Burger ────────────── */}
                    <div className="flex md:hidden items-center gap-1">
                        {/* Bouton recherche mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Rechercher"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className="w-5 h-5" />
                        </Button>

                        {/* Burger */}
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
                                {/* En-tête du drawer */}
                                <div className="flex items-center justify-between py-4 mb-2">
                                    <DrawerClose asChild>
                                        <Link
                                            href="/"
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

                                {/* Liens principaux */}
                                <nav className="flex flex-col gap-1 mb-4">
                                    {NAV_LINKS.map(({ href, label, exact }) => (
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
                                                <CalendarDays
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
                                    ))}

                                    {user && (
                                        <DrawerClose asChild>
                                            <Link
                                                href={
                                                    isOrganizer
                                                        ? "/dashboard"
                                                        : "/dashboard/demande-organisateur"
                                                }
                                                className={cn(
                                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                                                    pathname.startsWith(
                                                        "/dashboard",
                                                    )
                                                        ? "bg-secondary/10 text-secondary"
                                                        : "text-foreground hover:bg-muted/50",
                                                )}
                                            >
                                                <LayoutDashboard
                                                    className={cn(
                                                        "w-4 h-4 shrink-0",
                                                        pathname.startsWith(
                                                            "/dashboard",
                                                        )
                                                            ? "text-secondary"
                                                            : "text-muted-foreground",
                                                    )}
                                                />
                                                {isOrganizer
                                                    ? "Tableau de bord"
                                                    : "Devenir organisateur"}
                                            </Link>
                                        </DrawerClose>
                                    )}
                                </nav>

                                {/* Section auth */}
                                <div className="border-t border-border pt-5">
                                    {user ? (
                                        <div className="flex items-center gap-3 px-1">
                                            <UserProfileMenu
                                                name={user.name ?? ""}
                                                email={user.email}
                                                imageUrl={
                                                    user.image ?? undefined
                                                }
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold leading-tight truncate">
                                                    {user.name ??
                                                        user.email.split(
                                                            "@",
                                                        )[0]}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <DrawerClose asChild>
                                                <Button
                                                    asChild
                                                    className="w-full rounded-xl gap-2"
                                                >
                                                    <Link href="/sign-in">
                                                        <LogIn className="w-4 h-4" />
                                                        Se connecter
                                                    </Link>
                                                </Button>
                                            </DrawerClose>
                                            <DrawerClose asChild>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="w-full rounded-xl gap-2"
                                                >
                                                    <Link href="/sign-up">
                                                        <UserRoundPlus className="w-4 h-4" />
                                                        S&apos;inscrire
                                                    </Link>
                                                </Button>
                                            </DrawerClose>
                                        </div>
                                    )}
                                </div>
                            </DrawerContent>
                        </Drawer>
                    </div>
                </div>
            </header>
        </>
    );
}
