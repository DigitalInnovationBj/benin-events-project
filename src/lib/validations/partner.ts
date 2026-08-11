import { z } from "zod";

export const partnerValidation = z.object({
    organizationName: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères."),
    sector: z.string().min(2, "Le secteur d'activité est requis."),
    estimatedEventsPerYear: z
        .number()
        .int("Nombre entier requis.")
        .min(1, "Doit être au moins 1."),
    message: z.string().optional(),
    acceptCgu: z.boolean().refine((val) => val === true, {
        message:
            "Vous devez accepter les CGU et la politique de confidentialité pour continuer.",
    }),
});

export type PartnerFormData = z.infer<typeof partnerValidation>;
