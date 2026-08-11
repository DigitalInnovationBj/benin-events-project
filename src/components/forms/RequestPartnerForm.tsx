"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    partnerValidation,
    type PartnerFormData,
} from "@/lib/validations/partner";
import { createPartnerRequest } from "@/actions/partner.actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function RequestPartnerForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<PartnerFormData>({
        resolver: zodResolver(partnerValidation),
        defaultValues: {
            organizationName: "",
            sector: "",
            estimatedEventsPerYear: 1,
            message: "",
            acceptCgu: false,
        },
    });

    const onSubmit = async (data: PartnerFormData) => {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("organizationName", data.organizationName);
        formData.append("sector", data.sector);
        formData.append(
            "estimatedEventsPerYear",
            String(data.estimatedEventsPerYear),
        );
        if (data.message) formData.append("message", data.message);

        const result = await createPartnerRequest(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success(result?.message || "Candidature envoyée avec succès !");
            router.push("/dashboard");
        }

        setIsSubmitting(false);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 bg-card p-6 md:p-8 rounded-3xl border shadow-sm"
        >
            {/* Nom de la structure */}
            <div className="space-y-2">
                <Label htmlFor="organizationName">
                    Nom de la structure{" "}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="organizationName"
                    {...register("organizationName")}
                    placeholder="Ex : Ambiance Events Group"
                />
                {errors.organizationName && (
                    <p className="text-destructive text-xs">
                        {errors.organizationName.message}
                    </p>
                )}
            </div>

            {/* Secteur */}
            <div className="space-y-2">
                <Label htmlFor="sector">
                    Secteur d&apos;activité{" "}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="sector"
                    {...register("sector")}
                    placeholder="Ex : Événementiel, médias, hôtellerie…"
                />
                {errors.sector && (
                    <p className="text-destructive text-xs">
                        {errors.sector.message}
                    </p>
                )}
            </div>

            {/* Volume d'évènements prévu */}
            <div className="space-y-2">
                <Label htmlFor="estimatedEventsPerYear">
                    Évènements prévus par an{" "}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="estimatedEventsPerYear"
                    type="number"
                    min={1}
                    {...register("estimatedEventsPerYear", { valueAsNumber: true })}
                />
                {errors.estimatedEventsPerYear && (
                    <p className="text-destructive text-xs">
                        {errors.estimatedEventsPerYear.message}
                    </p>
                )}
            </div>

            {/* Message */}
            <div className="space-y-2">
                <Label htmlFor="message">
                    Message{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                        (optionnel)
                    </span>
                </Label>
                <Textarea
                    id="message"
                    {...register("message")}
                    rows={4}
                    className="resize-none"
                    placeholder="Présentez votre structure et pourquoi vous souhaitez devenir partenaire…"
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours…
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Envoyer ma candidature
                    </>
                )}
            </Button>
        </form>
    );
}
