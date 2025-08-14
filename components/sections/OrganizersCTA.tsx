"use client";

import Link from "next/link";
import { Eye, CheckSquare, Users } from "lucide-react";

export function OrganizersCTA() {
    const features = [
        {
            icon: Eye,
            title: "Visibilité accrue",
            description:
                "Augmentez la visibilité de vos événements auprès d’un large public ciblé.",
        },
        {
            icon: CheckSquare,
            title: "Gestion simplifiée",
            description:
                "Gérez facilement la billetterie, les inscriptions et les participants.",
        },
        {
            icon: Users,
            title: "Communauté engagée",
            description:
                "Rejoignez une communauté d’organisateurs engagés et passionnés.",
        },
    ];

    return (
        <section className="bg-gradient-to-r from-purple-700 to-primary text-white py-20 px-6 md:px-12 text-center rounded-t-4xl lg:rounded-4xl max-w-6xl mx-auto mb-40 shadow-lg">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 font-unbounded">
                Organisateurs, créez vos événements avec Bénin Events !
            </h2>
            <p className="max-w-3xl mx-auto text-lg md:text-xl mb-12">
                Profitez d&apos;une visibilité incomparable, d&apos;une gestion
                simplifiée de vos inscriptions, et rejoignez une communauté
                engagée qui valorise vos projets culturels, artistiques et
                professionnels.
            </p>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {features.map(({ icon: Icon, title, description }) => (
                    <div
                        key={title}
                        className="bg-background/80 backdrop-blur-sm shadow-sm rounded-lg text-left hover:shadow-xl transition"
                    >
                        <div className="bg-primary/30 w-20 h-20 flex items-center justify-center rounded-br-[40px] mb-8">
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold font-unbounded mb-2 mx-4">
                            {title}
                        </h3>
                        <p className="text-sm mx-4 mb-4">{description}</p>
                    </div>
                ))}
            </div>

            <Link
                href="/account/send-event"
                className="inline-block bg-white text-xs md:text-sm text-purple-700 font-semibold px-8 py-2 rounded-full shadow-lg hover:bg-gray-100 transition"
            >
                Créez votre événement maintenant
            </Link>
        </section>
    );
}
