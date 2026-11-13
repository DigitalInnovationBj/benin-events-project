import Image from "next/image";
import type { CSSProperties } from "react";
import { IconMapPin } from "@tabler/icons-react";
import { ADJATCHE } from "./config";
import { adjatcheBody, adjatcheTitle } from "./fonts";

/**
 * Éléments de la page publique propres à l'Adjatchè Urban Festival.
 *
 * La page garde le gabarit Benin Events (mêmes sections, même billetterie) :
 * ces composants n'en remplacent que l'habillage.
 */

/** Classes à poser sur la racine de la page : polices + variables du thème. */
export const adjatcheRootClass = `theme-adjatche ${adjatcheTitle.variable} ${adjatcheBody.variable}`;

/** Fond à motifs de l'affiche. */
export const adjatchePattern: CSSProperties = {
    backgroundColor: ADJATCHE.colors.navy,
    backgroundImage: "url(/events/adjatche/bg.jpg)",
    backgroundSize: "540px",
    backgroundPosition: "center",
};

const titleFont = "font-(family-name:--font-adj-title) uppercase";

function Dates({ className = "" }: { className?: string }) {
    const { from, to, month, year } = ADJATCHE.dates;
    const small = "text-[0.6em] text-[#ef7d19]";
    return (
        <p className={`${titleFont} text-white ${className}`}>
            <span className={small}>Du</span> {from} <span className={small}>au</span> {to}{" "}
            <span className="text-[0.6em]">{month}</span> {year}
        </p>
    );
}

/** Bannière composée à partir des éléments de l'affiche. */
export function AdjatcheBanner() {
    return (
        <div className="absolute inset-0 overflow-hidden" style={adjatchePattern}>
            <Image
                src="/events/adjatche/statue.webp"
                alt=""
                width={416}
                height={800}
                priority
                className="absolute bottom-0 -left-[6%] h-[78%] w-auto drop-shadow-2xl md:left-[4%] md:h-[96%]"
            />
            <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-2 pb-6 text-center md:left-[44%] md:gap-3 md:pb-8">
                <Image
                    src="/events/adjatche/logo.webp"
                    alt="Adjatchè Urban Festival"
                    width={705}
                    height={319}
                    priority
                    className="h-auto w-[52vw] md:w-[min(440px,60vw)]"
                />
                <Dates className="text-xl md:text-4xl" />
                <span className="hidden items-center gap-1.5 rounded-md bg-[#ef7d19] px-3 py-1.5 text-sm font-bold text-white md:inline-flex md:text-base">
                    <IconMapPin className="h-4 w-4" aria-hidden="true" />
                    {ADJATCHE.city}
                </span>
            </div>
            <Image
                src="/events/adjatche/case.webp"
                alt=""
                width={487}
                height={700}
                className="absolute -top-8 right-[17%] hidden h-[72%] w-auto rotate-180 md:block"
            />
            <Image
                src="/events/adjatche/tour.webp"
                alt=""
                width={489}
                height={700}
                className="absolute bottom-0 -right-[4%] h-[62%] w-auto md:right-[3%] md:h-[80%]"
            />
        </div>
    );
}

/** Ligne « Thème : … » sous le titre. */
export function AdjatcheTagline() {
    return (
        <p className={`${titleFont} mt-2 text-xl md:text-2xl`}>
            <span className="text-secondary">Thème :</span> {ADJATCHE.tagline}
        </p>
    );
}

/** Bloc « Coorganisé par » (remplace la carte organisateur). */
export function AdjatcheOrganizers({ email }: { email: string }) {
    return (
        <section className="bg-card border rounded-2xl p-6 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Coorganisé par
            </p>
            <div className="flex flex-wrap items-center gap-8">
                {ADJATCHE.coorganizers.map((o) => (
                    <Image
                        key={o.name}
                        src={o.web}
                        alt={o.name}
                        width={300}
                        height={300}
                        style={{ height: o.webHeight, width: "auto" }}
                    />
                ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
                {email} · {ADJATCHE.contact}
            </p>
        </section>
    );
}

/** Bandeau à motifs en tête de la carte Billetterie. */
export function AdjatcheTicketsHeader() {
    return (
        <div className="relative h-28 overflow-hidden" style={adjatchePattern}>
            <Image
                src="/events/adjatche/statue.webp"
                alt=""
                width={416}
                height={800}
                className="absolute -bottom-10 left-3 h-40 w-auto"
            />
            <Image
                src="/events/adjatche/logo.webp"
                alt=""
                width={705}
                height={319}
                className="absolute right-4 top-1/2 h-auto w-44 -translate-y-1/2"
            />
        </div>
    );
}

/** Décor de la section « Découvrir plus ». */
export function AdjatcheCtaDecor() {
    return (
        <>
            <Image
                src="/events/adjatche/case.webp"
                alt=""
                width={487}
                height={700}
                className="absolute -bottom-6 left-2 hidden h-56 w-auto md:block"
            />
            <Image
                src="/events/adjatche/tour.webp"
                alt=""
                width={489}
                height={700}
                className="absolute -bottom-2 right-4 hidden h-52 w-auto md:block"
            />
        </>
    );
}
