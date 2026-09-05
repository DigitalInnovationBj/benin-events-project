"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    ArrowLeft,
    ImagePlus,
    MapPin,
    MonitorPlay,
    Tag,
    Star,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateEvent } from "@/actions/event.actions";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Category = { id: string; name: string; slug: string };

type EventWithCategories = {
    id: string;
    title: string;
    description: string;
    eventType: "IN_PERSON" | "ONLINE";
    location: string | null;
    onlineUrl: string | null;
    postPurchaseMessage: string | null;
    startDate: Date;
    endDate: Date;
    isFeatured: boolean;
    imageUrl: string | null;
    ogImage: string | null;
    ogTitle: string | null;
    categories: {
        category: Category;
    }[];
};

type Props = {
    event: EventWithCategories;
    allCategories: Category[];
    isAdmin: boolean;
};

// ─────────────────────────────────────────────
// Helper : Date → valeur datetime-local (UTC+1 Bénin)
// ─────────────────────────────────────────────

function toBeninLocalInput(date: Date): string {
    const beninOffset = 60 * 60 * 1000; // UTC+1 en ms
    const beninTime = new Date(date.getTime() + beninOffset);
    return beninTime.toISOString().slice(0, 16);
}

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

export function EventEditForm({ event, allCategories, isAdmin }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState(event.description);
    const [postPurchaseMessage, setPostPurchaseMessage] = useState(
        event.postPurchaseMessage ?? "",
    );

    // Type d'évènement
    const [eventType, setEventType] = useState<"IN_PERSON" | "ONLINE">(
        event.eventType,
    );

    // Catégories sélectionnées (pré-rempli)
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        event.categories.map((ec) => ec.category.id),
    );

    // Vedette (admin seulement)
    const [isFeatured, setIsFeatured] = useState(event.isFeatured);

    // Aperçus images
    const [imagePreview, setImagePreview] = useState<string | null>(
        event.imageUrl,
    );
    const [ogImagePreview, setOgImagePreview] = useState<string | null>(
        event.ogImage,
    );

    const toggleCategory = (id: string) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
        );
    };

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setPreview: (val: string | null) => void,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            toast.error("L'image dépasse la limite de 1 Mo.");
            e.target.value = "";
            return;
        }
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error("La description est obligatoire.");
            return;
        }
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("eventId", event.id);
        formData.set("eventType", eventType);
        formData.set("description", description);
        formData.set("postPurchaseMessage", postPurchaseMessage);
        formData.set("isFeatured", isFeatured ? "true" : "false");
        selectedCategories.forEach((id) => formData.append("categoryIds", id));

        try {
            const res = await updateEvent(formData);

            if (res.error) {
                toast.error(res.error);
                return;
            }

            toast.success("Évènement mis à jour !");
            router.push(`/dashboard/events/${event.id}`);
        } catch {
            toast.error("Erreur inattendue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            {/* ── En-tête ──────────────────────────────────────────── */}
            <div className="flex items-center mb-6">
                <Link href={`/dashboard/events/${event.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Retour
                    </Button>
                </Link>
            </div>

            <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="mb-8">
                    <h1 className="text-3xl font-afo text-foreground mb-2">
                        Modifier l&apos;évènement
                    </h1>
                    <p className="text-muted-foreground">
                        Les modifications seront appliquées immédiatement après
                        la sauvegarde.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* ── Type d'évènement ─────────────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">
                            Type d&apos;évènement
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setEventType("IN_PERSON")}
                                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                                    eventType === "IN_PERSON"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/30"
                                }`}
                            >
                                <MapPin className="w-7 h-7" />
                                <div className="text-center">
                                    <p className="font-semibold text-sm">
                                        Présentiel
                                    </p>
                                    <p className="text-xs mt-0.5 opacity-70">
                                        Évènement physique avec lieu
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setEventType("ONLINE")}
                                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                                    eventType === "ONLINE"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-muted text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/30"
                                }`}
                            >
                                <MonitorPlay className="w-7 h-7" />
                                <div className="text-center">
                                    <p className="font-semibold text-sm">
                                        En ligne
                                    </p>
                                    <p className="text-xs mt-0.5 opacity-70">
                                        Diffusion via lien ou plateforme
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ── Informations de base ─────────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">
                            Informations de l&apos;évènement
                        </h2>

                        <div className="grid gap-2">
                            <Label htmlFor="title">
                                Titre de l&apos;évènement *
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={event.title}
                                placeholder="Ex: Concert de fin d'année"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Description *</Label>
                            <RichTextEditor
                                content={event.description}
                                onChange={setDescription}
                            />
                        </div>

                        {/* Lieu — présentiel uniquement */}
                        {eventType === "IN_PERSON" && (
                            <div className="grid gap-2">
                                <Label htmlFor="location">Lieu *</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    defaultValue={event.location ?? ""}
                                    placeholder="Ex: Palais des Congrès, Cotonou"
                                    required
                                />
                            </div>
                        )}

                        {/* URL — en ligne uniquement */}
                        {eventType === "ONLINE" && (
                            <div className="grid gap-2">
                                <Label htmlFor="onlineUrl">
                                    Lien de l&apos;évènement *
                                </Label>
                                <Input
                                    id="onlineUrl"
                                    name="onlineUrl"
                                    type="url"
                                    defaultValue={event.onlineUrl ?? ""}
                                    placeholder="https://meet.google.com/xxx  ou  https://zoom.us/j/..."
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Zoom, Google Meet, YouTube Live, Twitch… Ce
                                    lien n&apos;est plus affiché publiquement,
                                    seulement transmis aux acheteurs de
                                    billet après paiement.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">
                                    Date de début *
                                </Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="datetime-local"
                                    defaultValue={toBeninLocalInput(
                                        event.startDate,
                                    )}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Date de fin *</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="datetime-local"
                                    defaultValue={toBeninLocalInput(
                                        event.endDate,
                                    )}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                Message après achat{" "}
                                <span className="text-muted-foreground text-xs font-normal">
                                    (optionnel)
                                </span>
                            </Label>
                            <RichTextEditor
                                content={event.postPurchaseMessage ?? ""}
                                onChange={setPostPurchaseMessage}
                                placeholder="Ex : lien du groupe WhatsApp, instructions d'accès, informations de stationnement…"
                            />
                            <p className="text-xs text-muted-foreground">
                                Envoyé uniquement aux acheteurs, après paiement
                                (email + page de confirmation).
                            </p>
                        </div>
                    </div>

                    {/* ── Catégories ───────────────────────────────────── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Tag className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-xl font-bold">Catégories</h2>
                            {selectedCategories.length > 0 && (
                                <span className="ml-auto text-xs bg-secondary text-secondary-foreground font-semibold px-2.5 py-0.5 rounded-full">
                                    {selectedCategories.length} sélectionnée
                                    {selectedCategories.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        {allCategories.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-2">
                                Aucune catégorie disponible.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {allCategories.map((cat) => {
                                    const isSelected =
                                        selectedCategories.includes(cat.id);
                                    return (
                                        <label
                                            key={cat.id}
                                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all select-none ${
                                                isSelected
                                                    ? "border-secondary bg-secondary text-secondary-foreground"
                                                    : "border-border hover:bg-muted/50 text-foreground"
                                            }`}
                                        >
                                            <Checkbox
                                                id={`cat-${cat.id}`}
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    toggleCategory(cat.id)
                                                }
                                                className="pointer-events-none"
                                            />
                                            <span className="text-sm font-medium leading-none">
                                                {cat.name}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Vedette (admin uniquement) ───────────────────── */}
                    {isAdmin && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                Mise en vedette
                            </h2>
                            <div className="flex items-center justify-between rounded-xl border px-5 py-4">
                                <div>
                                    <p className="font-medium text-sm">
                                        Afficher en évènement vedette
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        L&apos;évènement sera mis en avant sur
                                        la page d&apos;accueil.
                                    </p>
                                </div>
                                <Switch
                                    id="isFeaturedSwitch"
                                    checked={isFeatured}
                                    onCheckedChange={setIsFeatured}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Images & SEO ─────────────────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">
                            Images &amp; Partage Réseaux Sociaux
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Image principale */}
                            <div className="grid gap-2">
                                <Label htmlFor="image" className="mb-2">
                                    Image de l&apos;évènement (Max 1 Mo)
                                </Label>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl text-center hover:bg-muted/50 transition-colors overflow-hidden relative">
                                    <Input
                                        id="image"
                                        name="image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleImageChange(
                                                e,
                                                setImagePreview,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="image"
                                        className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                            imagePreview ? "p-0 h-48" : "py-10"
                                        }`}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Aperçu évènement"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    Cliquez pour changer
                                                    l&apos;image
                                                </span>
                                            </>
                                        )}
                                    </Label>
                                </div>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:text-destructive text-left transition-colors"
                                        onClick={() => setImagePreview(null)}
                                    >
                                        Retirer l&apos;image
                                    </button>
                                )}
                            </div>

                            {/* Image OG */}
                            <div className="grid gap-2">
                                <Label htmlFor="ogImage" className="mb-2">
                                    Image de Partage (Max 1 Mo)
                                </Label>
                                <div className="border border-muted-foreground/25 rounded-xl text-center bg-muted/20 overflow-hidden relative">
                                    <Input
                                        id="ogImage"
                                        name="ogImage"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleImageChange(
                                                e,
                                                setOgImagePreview,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="ogImage"
                                        className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                            ogImagePreview
                                                ? "p-0 h-48"
                                                : "py-10"
                                        }`}
                                    >
                                        {ogImagePreview ? (
                                            <img
                                                src={ogImagePreview}
                                                alt="Aperçu partage"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    Image pour
                                                    Facebook/WhatsApp…
                                                </span>
                                            </>
                                        )}
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2 mt-4">
                            <Label htmlFor="ogTitle">
                                Titre pour le partage{" "}
                                <span className="text-muted-foreground font-normal">
                                    (Optionnel)
                                </span>
                            </Label>
                            <Input
                                id="ogTitle"
                                name="ogTitle"
                                defaultValue={event.ogTitle ?? ""}
                                placeholder="Titre alternatif utilisé lors du partage sur les réseaux"
                            />
                            <p className="text-xs text-muted-foreground">
                                Si vide, le titre principal sera utilisé.
                            </p>
                        </div>
                    </div>

                    {/* ── Soumettre ─────────────────────────────────────── */}
                    <div className="flex gap-4">
                        <Link
                            href={`/dashboard/events/${event.id}`}
                            className="flex-1"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            size="lg"
                            className="flex-1"
                        >
                            {isLoading && (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            )}
                            {isLoading
                                ? "Enregistrement…"
                                : "Enregistrer les modifications"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
