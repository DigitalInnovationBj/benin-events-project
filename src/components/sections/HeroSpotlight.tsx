"use client";

/**
 * La bande d'images du hero : un accordéon horizontal de lamelles, une seule
 * ouverte à la fois. Décoratif — les photos illustrent l'ambiance, elles ne
 * pointent vers aucun évènement.
 *
 * Ce fichier ne fait que câbler `SpotlightFrames` sur le projet : les photos,
 * le cadrage de chacune, les couleurs du thème et deux jeux de proportions
 * (mobile / desktop). La mécanique de l'accordéon reste dans le composant
 * d'origine, non modifié.
 */

import SpotlightFrames from "@/components/originkit/ui/spotlight-frames";
import type { SpotlightImage } from "@/components/originkit/ui/spotlight-frames";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * `offsetY` glisse la photo dans sa propre lamelle, en pixels : positif fait
 * descendre le cadrage. Il ne sert que là où le sujet n'est pas au centre de
 * l'image et se ferait couper par le recadrage automatique.
 */
const IMAGES: SpotlightImage[] = [
    { image: "/hero/event-01.webp", offsetY: 0 }, // artiste de dos face à la foule
    { image: "/hero/event-02.webp", offsetY: 40 }, // danseuse en raphia orange
    { image: "/hero/event-03.webp", offsetY: 0 }, // jet de flamme sur scène
    { image: "/hero/event-04.webp", offsetY: -20 }, // Porte du Non-Retour, nuit
    { image: "/hero/event-05.webp", offsetY: 0 }, // Egungun, plumes orange
    { image: "/hero/event-06.webp", offsetY: 0 }, // artiste entre deux flammes
    { image: "/hero/event-07.webp", offsetY: 0 }, // chanteuse, fond orange
    { image: "/hero/event-08.webp", offsetY: 0 }, // danseurs aux coiffes à cornes
    { image: "/hero/event-09.webp", offsetY: 60 }, // danseuses dans la fumée
    { image: "/hero/event-10.webp", offsetY: 0 }, // artiste masqué
    { image: "/hero/event-11.webp", offsetY: 0 }, // dignitaire en pagne turquoise
    { image: "/hero/event-12.webp", offsetY: 0 }, // cracheur de feu
];

/**
 * Sur mobile, douze lamelles laissent moins de 30 px à chacune : la bande n'est
 * plus lisible. On garde donc six photos, choisies pour rester contrastées
 * entre voisines.
 */
const MOBILE_IMAGES: SpotlightImage[] = [0, 2, 4, 6, 8, 11].map(
    (index) => IMAGES[index],
);

/* Deux jeux de proportions. Le composant met la bande à l'échelle pour tenir
 * dans son cadre, mais pas la hauteur des lamelles : c'est donc ici que se
 * règle le rapport largeur/hauteur d'une lamelle ouverte, à chaque taille. */

const MOBILE_TRACK = { collapsedWidth: 44, expandedWidth: 300, gap: 3 };
const DESKTOP_TRACK = { collapsedWidth: 76, expandedWidth: 340, gap: 3 };

const MOBILE_HEIGHT = 260;
const DESKTOP_HEIGHT = 460;

export default function HeroSpotlight({ className }: { className?: string }) {
    const isMobile = useIsMobile();
    const reducedMotion = useReducedMotion();

    return (
        <div
            className={cn(
                "relative w-full",
                /* Un peu plus haut que les lamelles : la marge accueille les
                 * deux traits du sélecteur, au-dessus et en dessous. */
                "h-75 md:h-130",
                className,
            )}
        >
            <SpotlightFrames
                images={isMobile ? MOBILE_IMAGES : IMAGES}
                background="transparent"
                startIndex={isMobile ? 2 : 5}
                track={isMobile ? MOBILE_TRACK : DESKTOP_TRACK}
                panel={{
                    height: isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT,
                    radius: 14,
                    dim: 4,
                }}
                selector={{
                    box: true,
                    lines: true,
                    lineLength: isMobile ? 18 : 26,
                    thickness: 2,
                    color: "var(--secondary)",
                }}
                entrance={{
                    animate: !reducedMotion,
                    duration: 0.9,
                    stagger: 0.05,
                }}
                transition={
                    reducedMotion
                        ? { duration: 0 }
                        : {
                              type: "tween",
                              duration: 1,
                              ease: [0.075, 0.82, 0.165, 1],
                          }
                }
            />
        </div>
    );
}
