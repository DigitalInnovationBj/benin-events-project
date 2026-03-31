import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    ArrowRight,
    Music2,
    Sparkles,
    Mic,
    Trophy,
    Palette,
    Clapperboard,
    Gem,
    ShoppingBag,
    UtensilsCrossed,
    Laptop,
    Church,
    Users,
    Calendar,
    type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────
// Icon mapping
// ─────────────────────────────────────────────

function getCategoryIcon(slug: string): LucideIcon {
    const s = slug.toLowerCase();
    if (s.includes("concert") || s.includes("musique") || s.includes("music"))
        return Music2;
    if (s.includes("festival") || s.includes("fete") || s.includes("fête"))
        return Sparkles;
    if (
        s.includes("conf") ||
        s.includes("seminaire") ||
        s.includes("séminaire") ||
        s.includes("forum")
    )
        return Mic;
    if (
        s.includes("sport") ||
        s.includes("foot") ||
        s.includes("basket") ||
        s.includes("athleti")
    )
        return Trophy;
    if (
        s.includes("art") ||
        s.includes("expo") ||
        s.includes("culture") ||
        s.includes("peinture")
    )
        return Palette;
    if (
        s.includes("theatre") ||
        s.includes("théâtre") ||
        s.includes("spectacle") ||
        s.includes("comedie") ||
        s.includes("comédie")
    )
        return Clapperboard;
    if (
        s.includes("gala") ||
        s.includes("soiree") ||
        s.includes("soirée") ||
        s.includes("nuit")
    )
        return Gem;
    if (s.includes("mode") || s.includes("fashion")) return ShoppingBag;
    if (
        s.includes("food") ||
        s.includes("gastro") ||
        s.includes("culinaire") ||
        s.includes("cuisine")
    )
        return UtensilsCrossed;
    if (
        s.includes("tech") ||
        s.includes("digital") ||
        s.includes("numérique") ||
        s.includes("startup")
    )
        return Laptop;
    if (s.includes("religion") || s.includes("culte") || s.includes("priere"))
        return Church;
    if (s.includes("enfant") || s.includes("famille") || s.includes("kids"))
        return Users;
    return Calendar;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default async function CategoriesSection() {
    const rawCategories = await prisma.category.findMany({
        orderBy: { events: { _count: "desc" } },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { events: true } },
        },
    });

    // N'afficher que les catégories ayant au moins 1 évènement
    const categories = rawCategories.filter((cat) => cat._count.events > 0);

    if (!categories.length) return null;

    return (
        <section className="py-14 border-t bg-background">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="font-afo text-4xl md:text-5xl">
                            Parcourir par catégorie
                        </h2>
                        <p className="text-muted-foreground mt-1.5 text-sm">
                            Trouvez les évènements qui vous correspondent
                        </p>
                    </div>
                    <Link
                        href="/events"
                        className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-secondary hover:gap-3 transition-all duration-200 shrink-0"
                    >
                        Tout voir <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* ── Scrollable row ──────────────────────────────────────── */}
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none -mx-6 px-6 md:-mx-12 md:px-12">
                    {categories.map((cat) => {
                        const Icon = getCategoryIcon(cat.slug);
                        return (
                            <Link
                                key={cat.slug}
                                href={`/events?category=${cat.slug}`}
                                className="snap-start shrink-0 group"
                            >
                                <div className="rounded-2xl border-2 border-transparent bg-card hover:border-secondary/60 hover:shadow-lg transition-all duration-300 px-5 py-4 w-38 flex flex-col gap-3">
                                    {/* Icon pill */}
                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors duration-300">
                                        <Icon className="w-5 h-5 text-secondary" />
                                    </div>

                                    {/* Name */}
                                    <span className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-secondary transition-colors">
                                        {cat.name}
                                    </span>

                                    {/* Count */}
                                    <span className="text-xs text-muted-foreground">
                                        {cat._count.events}{" "}
                                        {cat._count.events === 1
                                            ? "évènement"
                                            : "évènements"}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* ── Mobile "Tout voir" ──────────────────────────────────── */}
                <div className="mt-5 flex md:hidden">
                    <Link
                        href="/events"
                        className="flex items-center gap-1.5 text-sm font-semibold text-secondary"
                    >
                        Voir tous les évènements{" "}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
