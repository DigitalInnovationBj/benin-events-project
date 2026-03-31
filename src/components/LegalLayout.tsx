import type { LucideIcon } from "lucide-react";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";

interface LegalLayoutProps {
    icon: LucideIcon;
    badge: string;
    title: string;
    subtitle: string;
    updatedAt: string;
    children: React.ReactNode;
}

export function LegalSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <h2 className="font-afo text-3xl text-foreground">{title}</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {children}
            </div>
        </section>
    );
}

export function LegalSubSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                {children}
            </div>
        </div>
    );
}

export function LegalList({ items }: { items: string[] }) {
    return (
        <ul className="list-none space-y-1.5 pl-0">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-secondary mt-0.5 shrink-0">—</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export function LegalHighlight({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-secondary/5 border border-secondary/20 px-5 py-4 text-sm text-foreground leading-relaxed">
            {children}
        </div>
    );
}

export default function LegalLayout({
    icon: Icon,
    badge,
    title,
    subtitle,
    updatedAt,
    children,
}: LegalLayoutProps) {
    return (
        <main className="min-h-screen bg-background">
            <Header />

            {/* En-tête */}
            <div className="border-b bg-card">
                <div className="max-w-6xl mx-auto px-6 py-8 md:px-12">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-secondary" />
                        <span className="text-secondary text-xs font-bold uppercase tracking-widest">
                            {badge}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-afo mb-1">
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-sm">{subtitle}</p>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-3xl mx-auto px-6 md:px-12 py-16 pb-20">
                <p className="text-xs text-muted-foreground/50 border-b pb-6 mb-12">
                    Dernière mise à jour : {updatedAt}
                </p>
                <div className="space-y-12">{children}</div>
            </div>

            <Footer />
        </main>
    );
}
