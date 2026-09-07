"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    organizerValidation,
    type OrganizerFormData,
} from "@/lib/validations/organizer";
import { createOrganizerRequest } from "@/actions/organizer.actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    IconLoader2,
    IconSend,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function RequestOrganizerForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<OrganizerFormData>({
        resolver: zodResolver(organizerValidation),
        defaultValues: {
            organizerName: "",
            organizerEmail: "",
            phoneNumber: "",
            address: "",
            description: "",
            acceptCgu: false,
        },
    });

    const onSubmit = async (data: OrganizerFormData) => {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("organizerName", data.organizerName);
        if (data.organizerEmail)
            formData.append("organizerEmail", data.organizerEmail);
        formData.append("phoneNumber", data.phoneNumber);
        formData.append("address", data.address);
        if (data.description) formData.append("description", data.description);
        // acceptCgu est une validation côté client uniquement

        const result = await createOrganizerRequest(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success(result?.message || "Demande envoyée avec succès !");
            router.push("/dashboard");
        }

        setIsSubmitting(false);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 bg-card p-6 md:p-8 rounded-3xl border shadow-sm"
        >
            {/* Nom de l'organisation */}
            <div className="space-y-2">
                <Label htmlFor="organizerName">
                    Nom de l&apos;organisation{" "}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="organizerName"
                    {...register("organizerName")}
                    placeholder="Ex : Benin Events Corp"
                />
                {errors.organizerName && (
                    <p className="text-destructive text-xs">
                        {errors.organizerName.message}
                    </p>
                )}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                    Numéro de téléphone{" "}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="phoneNumber"
                    {...register("phoneNumber")}
                    placeholder="Ex : +229 90 00 00 00"
                />
                {errors.phoneNumber && (
                    <p className="text-destructive text-xs">
                        {errors.phoneNumber.message}
                    </p>
                )}
            </div>

            {/* Email organisateur */}
            <div className="space-y-2">
                <Label htmlFor="organizerEmail">
                    E-mail organisateur{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                        (optionnel)
                    </span>
                </Label>
                <Input
                    id="organizerEmail"
                    type="email"
                    {...register("organizerEmail")}
                    placeholder="Ex : contact@monorganisation.com"
                />
                {errors.organizerEmail && (
                    <p className="text-destructive text-xs">
                        {errors.organizerEmail.message}
                    </p>
                )}
            </div>

            {/* Adresse */}
            <div className="space-y-2">
                <Label htmlFor="address">
                    Adresse <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="address"
                    {...register("address")}
                    placeholder="Ex : Cotonou, Haie Vive"
                />
                {errors.address && (
                    <p className="text-destructive text-xs">
                        {errors.address.message}
                    </p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                        (optionnel)
                    </span>
                </Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    className="resize-none"
                    placeholder="Décrivez brièvement vos activités et le type d'évènements que vous organisez…"
                />
            </div>

            {/* Séparateur */}
            <div className="border-t" />

            {/* Acceptation CGU */}
            <Controller
                control={control}
                name="acceptCgu"
                render={({ field }) => (
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="acceptCgu"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className={
                                    errors.acceptCgu
                                        ? "border-destructive mt-0.5"
                                        : "mt-0.5"
                                }
                            />
                            <Label
                                htmlFor="acceptCgu"
                                className="text-sm text-muted-foreground leading-relaxed cursor-pointer font-normal"
                            >
                                J&apos;ai lu et j&apos;accepte les{" "}
                                <Link
                                    href="/cgu"
                                    target="_blank"
                                    className="text-secondary font-medium hover:underline"
                                >
                                    Conditions Générales d&apos;Utilisation
                                </Link>{" "}
                                ainsi que la{" "}
                                <Link
                                    href="/confidentialite"
                                    target="_blank"
                                    className="text-secondary font-medium hover:underline"
                                >
                                    Politique de confidentialité
                                </Link>{" "}
                                de Benin Events.{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                        </div>
                        {errors.acceptCgu && (
                            <p className="text-destructive text-xs pl-7">
                                {errors.acceptCgu.message}
                            </p>
                        )}
                    </div>
                )}
            />

            {/* Bouton de soumission */}
            <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full rounded-2xl gap-2"
            >
                {isSubmitting ? (
                    <>
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours…
                    </>
                ) : (
                    <>
                        <IconSend className="w-4 h-4" />
                        Envoyer ma demande
                    </>
                )}
            </Button>
        </form>
    );
}
