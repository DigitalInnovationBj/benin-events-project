"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    IconLoader2,
    IconArrowLeft,
    IconPhotoPlus,
    IconMapPin,
    IconDeviceDesktop,
    IconTag,
    IconAlertCircle,
    IconCoins,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { createEvent, getCategories } from "@/actions/event.actions";
import { createEventOnBehalf } from "@/actions/admin-organizer.actions";
import { getPlatformPaymentStatus } from "@/actions/platform.actions";
import { MobileMoneyForm } from "@/components/payments/MobileMoneyForm";
import { MobileMoneyWaiting } from "@/components/payments/MobileMoneyWaiting";
import { usePaymentPolling } from "@/hooks/use-payment-polling";
import { getNetwork, isValidLocalNumber, type FeexpayNetwork } from "@/lib/feexpay-networks";

type Category = { id: string; name: string; slug: string };
type EventType = "IN_PERSON" | "ONLINE";

interface Props {
    eventCreationFeeEnabled: boolean;
    eventCreationFee: number;
    paymentError: boolean;
    /** Contexte admin : l'évènement est publié pour le compte de cet organisateur, sans frais. */
    targetOrganizerId?: string;
    targetOrganizerName?: string;
}

export function NewEventForm({
    eventCreationFeeEnabled,
    eventCreationFee,
    paymentError,
    targetOrganizerId,
    targetOrganizerName,
}: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [postPurchaseMessage, setPostPurchaseMessage] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);

    const [eventType, setEventType] = useState<EventType>("IN_PERSON");

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Paiement Mobile Money (frais de publication)
    const [network, setNetwork] = useState<FeexpayNetwork | "">("");
    const [mmPhone, setMmPhone] = useState("");
    const [step, setStep] = useState<"form" | "waiting">("form");
    const polling = usePaymentPolling(getPlatformPaymentStatus);

    useEffect(() => {
        getCategories().then((res) => {
            setCategories(res.categories);
            setLoadingCategories(false);
        });
    }, []);

    useEffect(() => {
        if (paymentError) {
            toast.error("Le paiement a échoué. Votre évènement a été sauvegardé mais n'est pas encore publié. Réessayez depuis votre tableau de bord.");
        }
    }, [paymentError]);

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
        if (!file) {
            setPreview(null);
            return;
        }
        if (file.size > 1024 * 1024) {
            toast.error("L'image dépasse la limite de 1 Mo.");
            e.target.value = "";
            setPreview(null);
            return;
        }
        setPreview(URL.createObjectURL(file));
    };

    const pendingEventIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (step !== "waiting") return;
        if (polling.status === "COMPLETED") {
            toast.success("Paiement confirmé — évènement publié !");
            router.push(`/dashboard/events/${pendingEventIdRef.current}?created=1`);
        } else if (polling.status === "FAILED") {
            toast.error("Le paiement a échoué. Réessayez depuis votre tableau de bord.");
            router.push(`/dashboard/events/${pendingEventIdRef.current}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [polling.status, step]);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error("La description est obligatoire.");
            return;
        }
        if (eventCreationFeeEnabled) {
            if (!network) {
                toast.error("Sélectionnez un opérateur mobile money.");
                return;
            }
            const netInfo = getNetwork(network);
            if (!netInfo || !isValidLocalNumber(mmPhone.replace(/\D/g, ""), netInfo.countryCode)) {
                toast.error("Numéro de téléphone invalide.");
                return;
            }
        }
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("eventType", eventType);
        formData.set("description", description);
        formData.set("postPurchaseMessage", postPurchaseMessage);
        selectedCategories.forEach((id) => formData.append("categoryIds", id));
        if (eventCreationFeeEnabled) {
            formData.set("network", network);
            formData.set("phoneNumber", mmPhone);
        }

        try {
            const res = targetOrganizerId
                ? await createEventOnBehalf(targetOrganizerId, formData)
                : await createEvent(formData);

            if ("error" in res) {
                toast.error(res.error);
                setIsLoading(false);
                return;
            }

            if (res.platformPaymentId) {
                pendingEventIdRef.current = res.eventId!;
                setStep("waiting");
                polling.start(res.platformPaymentId);
                return;
            }

            toast.success("Évènement créé avec succès !");
            router.push(`/dashboard/events/${res.eventId}`);
        } catch {
            toast.error("Erreur inattendue");
            setIsLoading(false);
        }
    };

    if (step === "waiting") {
        return (
            <div className="max-w-md mx-auto pb-10">
                <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                    <MobileMoneyWaiting
                        phoneNumber={mmPhone}
                        timedOut={polling.timedOut}
                        onRetryCheck={() => polling.retryNow()}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex items-center mb-6">
                <Link href="/dashboard/events">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Button>
                </Link>
            </div>

            {/* ── Bandeau admin : publication au nom d'un tiers ─── */}
            {targetOrganizerName && (
                <div className="mb-5 flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm">
                    <IconAlertCircle className="w-5 h-5 text-primary shrink-0" />
                    <span>
                        Vous créez cet évènement pour le compte de{" "}
                        <strong>{targetOrganizerName}</strong>. Aucun frais ne
                        sera demandé.
                    </span>
                </div>
            )}

            {/* ── Bandeau frais de publication ─────────────────── */}
            {!targetOrganizerId && eventCreationFeeEnabled && (
                <div className="mb-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <IconCoins className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-amber-800 dark:text-amber-200">
                            Publication payante — {eventCreationFee.toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                            La création de cet évènement nécessite un paiement par Mobile Money. Renseignez votre opérateur et votre numéro en bas de ce formulaire.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="mb-8">
                    <h1 className="text-3xl font-afo text-foreground mb-2">
                        Créer un nouvel évènement
                    </h1>
                    <p className="text-muted-foreground">
                        Remplissez les informations ci-dessous. Vous pourrez
                        ajouter des billets par la suite.
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
                                        ? "border-secondary bg-secondary/5 text-secondary"
                                        : "border-muted text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/30"
                                }`}
                            >
                                <IconMapPin className="w-7 h-7" />
                                <div className="text-center">
                                    <p className="font-semibold text-sm">Présentiel</p>
                                    <p className="text-xs mt-0.5 opacity-70">Évènement physique avec lieu</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setEventType("ONLINE")}
                                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                                    eventType === "ONLINE"
                                        ? "border-secondary bg-secondary/5 text-secondary"
                                        : "border-muted text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/30"
                                }`}
                            >
                                <IconDeviceDesktop className="w-7 h-7" />
                                <div className="text-center">
                                    <p className="font-semibold text-sm">En ligne</p>
                                    <p className="text-xs mt-0.5 opacity-70">Diffusion via lien ou plateforme</p>
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
                            <Label htmlFor="title">Titre de l&apos;évènement *</Label>
                            <Input id="title" name="title" placeholder="Ex: Concert de fin d'année" required />
                        </div>

                        <div className="grid gap-2">
                            <Label>Description *</Label>
                            <RichTextEditor onChange={setDescription} />
                        </div>

                        {eventType === "IN_PERSON" && (
                            <div className="grid gap-2">
                                <Label htmlFor="location">Lieu *</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="Ex: Palais des Congrès, Cotonou"
                                    required
                                />
                            </div>
                        )}

                        {eventType === "ONLINE" && (
                            <div className="grid gap-2">
                                <Label htmlFor="onlineUrl">Lien de l&apos;évènement *</Label>
                                <Input
                                    id="onlineUrl"
                                    name="onlineUrl"
                                    type="url"
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
                                <Label htmlFor="startDate">Date de début *</Label>
                                <Input id="startDate" name="startDate" type="datetime-local" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Date de fin *</Label>
                                <Input id="endDate" name="endDate" type="datetime-local" required />
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
                                content={postPurchaseMessage}
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
                            <IconTag className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-xl font-bold">Catégories</h2>
                            {selectedCategories.length > 0 && (
                                <span className="ml-auto text-xs bg-secondary text-secondary-foreground font-semibold px-2.5 py-0.5 rounded-full">
                                    {selectedCategories.length} sélectionnée{selectedCategories.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        {loadingCategories ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                <IconLoader2 className="w-4 h-4 animate-spin" />
                                Chargement des catégories…
                            </div>
                        ) : categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-2">
                                Aucune catégorie disponible pour le moment.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categories.map((cat) => {
                                    const isSelected = selectedCategories.includes(cat.id);
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
                                                onCheckedChange={() => toggleCategory(cat.id)}
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

                    {/* ── Images & SEO ─────────────────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">
                            Images &amp; Partage Réseaux Sociaux
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="image" className="mb-2">
                                    Image de l&apos;évènement (Max 1 Mo) *
                                </Label>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl text-center hover:bg-muted/50 transition-colors overflow-hidden relative">
                                    <Input
                                        id="image"
                                        name="image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        required
                                        onChange={(e) => handleImageChange(e, setImagePreview)}
                                    />
                                    <Label
                                        htmlFor="image"
                                        className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${imagePreview ? "p-0 h-48" : "py-10"}`}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Aperçu évènement" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <IconPhotoPlus className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
                                            </>
                                        )}
                                    </Label>
                                </div>
                            </div>

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
                                        onChange={(e) => handleImageChange(e, setOgImagePreview)}
                                    />
                                    <Label
                                        htmlFor="ogImage"
                                        className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${ogImagePreview ? "p-0 h-48" : "py-10"}`}
                                    >
                                        {ogImagePreview ? (
                                            <img src={ogImagePreview} alt="Aperçu partage" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <IconPhotoPlus className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-sm font-medium">Image pour Facebook/WhatsApp…</span>
                                            </>
                                        )}
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2 mt-4">
                            <Label htmlFor="ogTitle">Titre pour le partage (Optionnel)</Label>
                            <Input
                                id="ogTitle"
                                name="ogTitle"
                                placeholder="Titre alternatif utilisé lors du partage sur les réseaux"
                            />
                            <p className="text-xs text-muted-foreground">
                                Si vide, le titre principal sera utilisé.
                            </p>
                        </div>
                    </div>

                    {/* ── Soumettre ─────────────────────────────────────── */}
                    {eventCreationFeeEnabled && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
                                <IconAlertCircle className="w-4 h-4 shrink-0" />
                                <span>
                                    Une demande de paiement de{" "}
                                    <strong>{eventCreationFee.toLocaleString("fr-FR")} FCFA</strong>{" "}
                                    sera envoyée sur ce numéro à la soumission du formulaire.
                                </span>
                            </div>
                            <MobileMoneyForm
                                network={network}
                                onNetworkChange={setNetwork}
                                phoneNumber={mmPhone}
                                onPhoneNumberChange={setMmPhone}
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                        {isLoading && <IconLoader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {isLoading
                            ? eventCreationFeeEnabled ? "Envoi de la demande de paiement…" : "Création en cours…"
                            : eventCreationFeeEnabled ? "Créer et payer" : "Créer l'évènement et continuer"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
