import { permanentRedirect } from "next/navigation";

/**
 * Les billets sont un espace acheteur, pas organisateur : la page vit
 * désormais sous /mes-billets.
 *
 * Cette redirection reste nécessaire — les emails de confirmation déjà
 * envoyés pointent vers cette URL.
 */
export default function OrdersRedirect() {
    permanentRedirect("/mes-billets");
}
