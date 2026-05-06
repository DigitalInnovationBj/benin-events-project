import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CheckoutErrorPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="max-w-md w-full bg-card border rounded-3xl p-8 shadow-xl text-center space-y-6">
                <XCircle className="w-16 h-16 text-destructive mx-auto" />

                <h1 className="text-3xl font-afo">Paiement échoué</h1>

                <p className="text-muted-foreground">
                    Votre paiement n&apos;a pas pu être traité. Aucun montant
                    n&apos;a été débité. Vous pouvez réessayer ou contacter le
                    support si le problème persiste.
                </p>

                <div className="flex flex-col gap-3 pt-2">
                    <Button asChild variant="secondary">
                        <Link href="/events">Réessayer</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/contact">Contacter le support</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
