"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { SearchEvents } from "@/components/ui/search-events";

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    // Liens de navigation
    const navLinks = [
        { href: "/", label: "Accueil" },
        { href: "/events", label: "Évènements" },
        { href: "/contact", label: "Contact" },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto p-4 flex items-center justify-between">
                {/* Logo / Branding */}
                <Link
                    href="/"
                    className="flex items-center justify-center bg-primary rounded-full p-2 md:p-3 w-10 h-10 flex-shrink-0"
                >
                    <span className="text-sm md:text-base font-unbounded font-semibold text-white select-none">
                        be
                    </span>
                </Link>

                {/* Navigation desktop */}
                <nav className="hidden md:flex space-x-6 items-center">
                    {navLinks.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="hover:text-primary transition-colors duration-200 text-sm"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Recherche (SearchEvents) et compte utilisateur */}
                <div className="hidden md:flex items-center">
                    <SearchEvents />
                    <Link
                        className="p-2 rounded-full bg-primary hover:bg-purple-600 hover:cursor-pointer transition"
                        href="/auth"
                    >
                        <User className="w-4 h-4 text-white" />
                    </Link>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden flex items-center">
                    <SearchEvents />

                    <Link
                        className="p-2 rounded-full bg-primary hover:bg-purple-600 hover:cursor-pointer transition"
                        href="/account"
                    >
                        <User className="w-5 h-5 text-white" />
                    </Link>
                    <button
                        className="p-2 rounded-md hover:bg-gray-200 transition"
                        aria-label={
                            mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
                        }
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5 text-primary" />
                        ) : (
                            <Menu className="w-5 h-5 text-primary" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <nav className="md:hidden bg-background shadow-md border-t border-gray-200">
                    <ul className="flex flex-col space-y-3 py-4 px-6 font-semibold">
                        {navLinks.map(({ href, label }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="block hover:text-primary transition-colors duration-150"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </header>
    );
}
