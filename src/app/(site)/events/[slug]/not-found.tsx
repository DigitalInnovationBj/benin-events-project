import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconCalendarOff } from "@tabler/icons-react";

export default function EventNotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
            <div className="max-w-md w-full text-center space-y-6">
                <IconCalendarOff
                    className="w-16 h-16 mx-auto text-muted-foreground/40"
                    aria-hidden="true"
                />

                <div className="space-y-2">
                    <h1 className="text-3xl font-afo">Évènement introuvable</h1>
                    <p className="text-sm text-muted-foreground">
                        Cet évènement n&apos;existe pas, n&apos;est plus publié,
                        ou a été retiré par son organisateur.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button asChild>
                        <Link href="/events">
                            Voir tous les évènements
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/">Retour à l&apos;accueil</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
