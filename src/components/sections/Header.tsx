import NavbarClient from "./NavbarClient";

/**
 * En-tête du site public.
 *
 * Ne lit plus la session côté serveur : `getCurrentUser()` passe par
 * `headers()`, ce qui basculait **toute** route contenant l'en-tête en rendu
 * dynamique — y compris l'accueil, rendant tout `revalidate` inopérant.
 *
 * La navbar récupère désormais la session côté client (`useSession`), ce qui
 * laisse la coquille de page entièrement statique et cacheable.
 */
export default function Header() {
    return <NavbarClient />;
}
