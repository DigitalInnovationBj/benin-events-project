"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            toast.success("Message sent successfully!");
            form.reset();
        } catch (error) {
            console.error("EmailJS Error:", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-md w-full mx-auto shadow-lg border-2">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    Contact Us
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="user_name">Name</Label>
                        <Input
                            type="text"
                            name="user_name"
                            id="user_name"
                            placeholder="Your Name"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="user_email">Email</Label>
                        <Input
                            type="email"
                            name="user_email"
                            id="user_email"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            name="message"
                            id="message"
                            placeholder="How can we help?"
                            rows={4}
                            required
                            className="resize-none"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
