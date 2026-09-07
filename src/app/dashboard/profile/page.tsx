import { permanentRedirect } from "next/navigation";

/** Le profil est un espace acheteur : la page vit désormais sous /mon-compte. */
export default function ProfileRedirect() {
    permanentRedirect("/mon-compte");
}
