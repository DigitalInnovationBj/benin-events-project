/**
 * Ordre d'affichage des billets d'un évènement (Event.ticketSort).
 *
 * Tri en mémoire, partagé par la page publique, le checkout et le dashboard :
 * les billets sont déjà chargés avec leur évènement, et le critère dépend
 * d'un champ de cet évènement.
 */
export type TicketSortMode = "PRICE_ASC" | "PRICE_DESC" | "CUSTOM";

export const TICKET_SORT_LABELS: Record<TicketSortMode, string> = {
    PRICE_ASC: "Prix croissant",
    PRICE_DESC: "Prix décroissant",
    CUSTOM: "Personnalisé",
};

type Sortable = { price: number; position: number; createdAt: Date };

export function sortTickets<T extends Sortable>(tickets: T[], mode: TicketSortMode): T[] {
    const byCreation = (a: T, b: T) => a.createdAt.getTime() - b.createdAt.getTime();
    return [...tickets].sort((a, b) => {
        if (mode === "CUSTOM") return a.position - b.position || byCreation(a, b);
        const diff = mode === "PRICE_DESC" ? b.price - a.price : a.price - b.price;
        return diff || byCreation(a, b);
    });
}
