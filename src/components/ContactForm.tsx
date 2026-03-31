"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";

const SUBJECTS = [
    { value: "information", label: "Demande d'information" },
    { value: "billet", label: "Problème avec un billet" },
    { value: "organisateur", label: "Devenir organisateur" },
    { value: "partenariat", label: "Partenariat" },
    { value: "signalement", label: "Signaler un problème" },
    { value: "autre", label: "Autre" },
];

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subject, setSubject] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;

        try {
            await emailjs.sendForm(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
                form,
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
            );
            toast.success("Message envoyé ! Nous vous répondons sous 24 h.");
            form.reset();
            setSubject("");
        } catch (error) {
            console.error("EmailJS Error:", error);
            toast.error(
                "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom */}
            <div className="space-y-2">
                <Label htmlFor="user_name">Nom complet</Label>
                <Input
                    type="text"
                    name="user_name"
                    id="user_name"
                    placeholder="Jean Dupont"
                    required
                />
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="user_email">Adresse e-mail</Label>
                <Input
                    type="email"
                    name="user_email"
                    id="user_email"
                    placeholder="jean@exemple.com"
                    required
                />
            </div>

            {/* Sujet */}
            <div className="space-y-2">
                <Label htmlFor="user_subject">Sujet</Label>
                <Select
                    value={subject}
                    onValueChange={setSubject}
                    name="user_subject"
                >
                    <SelectTrigger id="user_subject">
                        <SelectValue placeholder="Choisissez un sujet…" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUBJECTS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* Champ caché pour EmailJS */}
                <input
                    type="hidden"
                    name="user_subject"
                    value={
                        SUBJECTS.find((s) => s.value === subject)?.label ?? ""
                    }
                />
            </div>

            {/* Message */}
            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                    name="message"
                    id="message"
                    placeholder="Décrivez votre demande en détail…"
                    rows={5}
                    required
                    className="resize-none"
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting || !subject}
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
                        Envoyer le message
                    </>
                )}
            </Button>
        </form>
    );
}
