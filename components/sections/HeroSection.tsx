import Link from "next/link";
import { AskIA } from "./AskIA";
import Image from "next/image";

export function HeroSection() {
    return (
        <section className="relative bg-gradient-to-r from-purple-600 to-primary text-white min-h-[100vh] flex flex-col justify-center items-center rounded-b-4xl px-6 md:px-12 text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mt-20 md:mt-40 lg:mt-32 mb-4 font-unbounded">
                Découvrez les événements incontournables au Bénin
            </h1>
            <p className="md:text-lg max-w-3xl mb-8">
                Explorez notre sélection exclusive d&apos;événements culturels,
                festivals, et concerts pour vivre des expériences uniques près
                de chez vous.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                <Link
                    href="/events"
                    className="bg-white text-primary text-xs md:text-sm font-semibold px-8 py-2 rounded-full shadow-lg hover:bg-gray-100 transition"
                >
                    Voir les événements
                </Link>
                <AskIA />
            </div>
            {/* Optionnel : image ou illustration */}
            <div className="mt-12 mb-10 lg:mb-20 max-w-5xl w-full">
                <Image
                    src="/hero-event.jpg"
                    alt="Festivals et événements au Bénin"
                    width={1000}
                    height={500}
                    className="w-full rounded-2xl shadow-xl object-cover"
                    loading="lazy"
                />
            </div>
        </section>
    );
}
