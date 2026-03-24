import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
            <h3 className="text-6xl md:text-8xl font-afo mb-4 text-secondary">
                <span className="">4</span>
                <span className="text-primary rotate-12">0</span>
                <span className="">4</span>
            </h3>
            <h1 className="text-4xl md:text-5xl font-afo mb-4 text-secondary">
                Page introuvable
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Oups ! Il semblerait que la page que vous recherchez n'existe
                pas ou a été déplacée.
            </p>
            <Link href="/">
                <Button
                    size="lg"
                    className="h-12 px-8 font-semibold rounded-xl"
                >
                    Retour à l'accueil
                </Button>
            </Link>
        </div>
    );
}
