"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"; // avec composant Dialog de ton UI ou un modal simple
import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation"; // si navigation nécessaire
// import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Recommendation = {
    id: string;
    title: string;
    slug: string;
};

export function AskIA() {
    const [open, setOpen] = React.useState(false);
    const [answers, setAnswers] = React.useState({
        interest: "",
        location: "",
        budget: "",
        dateRange: "",
        type: "",
    });
    const [loading, setLoading] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<
        Recommendation[]
    >([]);
    const [error, setError] = React.useState<string | null>(null);

    // Handler input change
    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        setAnswers((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    // Submit form et appeler API
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            const res = await fetch("/api/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(answers),
            });

            if (!res.ok)
                throw new Error(
                    "Erreur lors de la récupération des recommandations"
                );
            const data: Recommendation[] = await res.json();
            setRecommendations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="text-xs md:text-sm px-8 py-2 rounded-full"
                >
                    Recommandation IA <Sparkles className="w-4 h-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
                <DialogTitle>Recommandation d'événements</DialogTitle>
                <DialogDescription>
                    Répondez à quelques questions pour que l’IA vous recommande
                    des événements adaptés.
                </DialogDescription>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Exemple de questions */}
                    <div>
                        <label
                            htmlFor="interest"
                            className="block font-semibold mb-1"
                        >
                            Centres d’intérêt
                        </label>
                        <input
                            type="text"
                            id="interest"
                            name="interest"
                            value={answers.interest}
                            onChange={handleChange}
                            placeholder="Ex: musique, sport, art"
                            className="w-full input"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="location"
                            className="block font-semibold mb-1"
                        >
                            Localisation préférée
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={answers.location}
                            onChange={handleChange}
                            placeholder="Ex: Cotonou, Porto-Novo"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="budget"
                            className="block font-semibold mb-1"
                        >
                            Budget maximum (€)
                        </label>
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={answers.budget}
                            onChange={handleChange}
                            min={0}
                            className="w-full input"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="dateRange"
                            className="block font-semibold mb-1"
                        >
                            Dates préférées
                        </label>
                        <input
                            type="text"
                            id="dateRange"
                            name="dateRange"
                            value={answers.dateRange}
                            onChange={handleChange}
                            placeholder="Ex: 2025-08-01 to 2025-08-31"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="type"
                            className="block font-semibold mb-1"
                        >
                            Type d'événement
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={answers.type}
                            onChange={handleChange}
                            className="w-full input"
                        >
                            <option value="">-- Choisir --</option>
                            <option value="concert">Concert</option>
                            <option value="festival">Festival</option>
                            <option value="exposition">Exposition</option>
                            <option value="sport">Sport</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                        >
                            Fermer
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading
                                ? "Recherche..."
                                : "Obtenir recommandations"}
                        </Button>
                    </div>
                </form>

                {/* Affiche les résultats */}
                {error && <p className="mt-4 text-red-600">{error}</p>}
                {recommendations.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold text-lg mb-2">
                            Événements recommandés :
                        </h3>
                        <ul className="space-y-2 max-h-64 overflow-auto">
                            {recommendations.map((rec) => (
                                <li key={rec.id}>
                                    <Link
                                        href={`/events/${rec.slug}`}
                                        className="text-primary hover:underline"
                                    >
                                        {rec.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
