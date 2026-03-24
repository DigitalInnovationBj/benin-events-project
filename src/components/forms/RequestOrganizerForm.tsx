"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizerValidation, OrganizerFormData } from "@/lib/validations/organizer";
import { createOrganizerRequest } from "@/actions/organizer.actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RequestOrganizerForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OrganizerFormData>({
        resolver: zodResolver(organizerValidation),
        defaultValues: {
            organizerName: "",
            phoneNumber: "",
            address: "",
            description: "",
        },
    });

    const onSubmit = async (data: OrganizerFormData) => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("organizerName", data.organizerName);
        formData.append("phoneNumber", data.phoneNumber);
        formData.append("address", data.address);
        if (data.description) formData.append("description", data.description);

        const result = await createOrganizerRequest(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success(result?.message || "Demande envoyée");
            router.push("/dashboard");
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow-sm border">
            <div>
                <label className="block text-sm font-medium mb-1">Nom de l'organisation *</label>
                <input
                    {...register("organizerName")}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: Benin Events Corp"
                />
                {errors.organizerName && <p className="text-destructive text-sm mt-1">{errors.organizerName.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Numéro de téléphone *</label>
                <input
                    {...register("phoneNumber")}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: +229 90000000"
                />
                {errors.phoneNumber && <p className="text-destructive text-sm mt-1">{errors.phoneNumber.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Adresse *</label>
                <input
                    {...register("address")}
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: Cotonou, Haie Vive"
                />
                {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Description (Optionnel)</label>
                <textarea
                    {...register("description")}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Parlez-nous un peu de vos évènements..."
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
                {isSubmitting ? "Soumission..." : "Envoyer ma demande"}
            </button>
        </form>
    );
}
