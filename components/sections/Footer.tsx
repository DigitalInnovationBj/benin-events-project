"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            // Exemple : envoyer email à une API d’inscription newsletter
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Erreur lors de l'inscription");
            }

            setStatus("success");
            setEmail("");
        } catch (err) {
            setStatus("error");
            if (err instanceof Error) setErrorMessage(err.message);
        }
    };

    return (
        <footer className="bg-primary/10 text-white pt-20 pb-8 px-6 md:px-12 rounded-t-4xl">
            {/* Section Newsletter */}
            <section className="max-w-6xl w-fit bg-gradient-to-r from-purple-600 to-primary mx-auto mb-14 px-4 py-10 md:p-10 text-center rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4 font-unbounded text-white">
                    Inscrivez-vous à notre newsletter
                </h3>
                <p className="mb-6 max-w-xl">
                    Recevez chaque semaine les meilleurs événements du Bénin
                    directement dans votre boîte mail.
                </p>
                <form
                    onSubmit={handleSubscribe}
                    className="flex max-w-md gap-2 flex-col sm:flex-row items-center justify-center mx-auto"
                >
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                        <input
                            type="email"
                            placeholder="Votre adresse email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-md text-white border border-white focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Votre adresse email"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="bg-transparent hover:bg-purple-700 text-white border border-white rounded-md hover:cursor-pointer w-full md:w-fit px-6 py-3 font-semibold transition disabled:opacity-50"
                    >
                        {status === "loading" ? "Envoi..." : "S'inscrire"}
                    </button>
                </form>
                {status === "success" && (
                    <p className="mt-3 text-green-400">
                        Inscription réussie. Merci !
                    </p>
                )}
                {status === "error" && (
                    <p className="mt-3 text-red-500">
                        {errorMessage || "Une erreur est survenue."}
                    </p>
                )}
            </section>

            {/* Section infos & navigation */}
            <section className="border-t border-gray-700 pt-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-400">
                {/* Colonne 1 - Logo + description */}
                <div>
                    <Link
                        href="/"
                        className="text-white text-2xl font-unbounded font-bold mb-4 inline-block"
                    >
                        Bénin Events
                    </Link>
                    <p className="max-w-xs">
                        Votre plateforme de référence pour tous les événements
                        culturels, sportifs, artistiques et professionnel au
                        Bénin.
                    </p>
                </div>

                {/* Colonne 2 - Navigation */}
                <div>
                    <h4 className="text-white font-semibold mb-4">
                        Navigation
                    </h4>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href="/"
                                className="hover:text-white transition"
                            >
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/events"
                                className="hover:text-white transition"
                            >
                                Événements
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/contact"
                                className="hover:text-white transition"
                            >
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/account"
                                className="hover:text-white transition"
                            >
                                Compte
                            </Link>
                        </li>
                        <br />
                        <li>
                            <Link
                                href="/legal-notices"
                                className="hover:text-white transition"
                            >
                                Mentions légales
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/terms-cgv"
                                className="hover:text-white transition"
                            >
                                CGV
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/terms-cgu"
                                className="hover:text-white transition"
                            >
                                CGU
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Colonne 3 - Contact */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Contact</h4>
                    <address className="not-italic space-y-4">
                        <p>
                            Godomey PK14 immeuble Supermarché Ô Bénin,
                            <br /> Abomey-calavi, Bénin
                        </p>
                        <p>Téléphone : +229 01 63 360 300</p>
                        <p>Email : support@beninevents.bj</p>
                    </address>
                </div>

                {/* Colonne 4 - Réseaux sociaux */}
                <div>
                    <h4 className="text-white font-semibold mb-4">
                        Suivez-nous
                    </h4>
                    <div className="flex space-x-4">
                        <Link
                            href="https://facebook.com/beninevents"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="hover:text-white transition"
                        >
                            <Facebook className="w-6 h-6" />
                        </Link>
                        <Link
                            href="https://twitter.com/beninevents"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Twitter"
                            className="hover:text-white transition"
                        >
                            <Twitter className="w-6 h-6" />
                        </Link>
                        <Link
                            href="https://instagram.com/beninevents"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="hover:text-white transition"
                        >
                            <Instagram className="w-6 h-6" />
                        </Link>
                        <Link
                            href="https://linkedin.com/company/beninevents"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="hover:text-white transition"
                        >
                            <Linkedin className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Bas de footer */}
            <div className="border-t border-gray-700 mt-10 pt-6 max-w-6xl mx-auto text-center text-gray-500 text-sm select-none">
                © {new Date().getFullYear()} Bénin Events. Tous droits réservés.
            </div>
        </footer>
    );
}
