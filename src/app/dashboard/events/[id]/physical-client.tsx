"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPrinter, IconTrash, IconUpload, IconPhoto } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    createPrintBatch,
    releaseUnsoldTickets,
    removePrintArt,
    uploadPrintArt,
} from "@/actions/printed-ticket.actions";
import { MAX_PRINT_BATCH, TICKETS_PER_SHEET } from "@/lib/printed-tickets";
import { formatXOF } from "@/lib/format";

type TicketOption = { id: string; title: string; price: number; remaining: number | null };

/** Choix du billet et de la quantité, puis génération du PDF d'impression. */
export function PrintBatchForm({ eventId, tickets }: { eventId: string; tickets: TicketOption[] }) {
    const router = useRouter();
    const [ticketId, setTicketId] = useState(tickets[0]?.id ?? "");
    const [quantity, setQuantity] = useState("40");
    const [pending, startTransition] = useTransition();

    const ticket = tickets.find((t) => t.id === ticketId);
    const qty = parseInt(quantity, 10) || 0;
    const sheets = Math.ceil(qty / TICKETS_PER_SHEET);
    const max = Math.min(MAX_PRINT_BATCH, ticket?.remaining ?? MAX_PRINT_BATCH);

    if (tickets.length === 0) {
        return <p className="text-sm text-muted-foreground">Créez d&apos;abord un billet dans l&apos;onglet Billets.</p>;
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!ticket || qty < 1) return;
        startTransition(async () => {
            const res = await createPrintBatch(eventId, ticket.id, qty);
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success(`${qty} billets créés. Le PDF se télécharge.`);
            router.refresh();
            window.location.href = `/api/events/${eventId}/print-batches/${res.orderId}`;
        });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="print-ticket">Billet</Label>
                <select
                    id="print-ticket"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                    {tickets.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.title} · {formatXOF(t.price)}
                            {t.remaining !== null ? ` · ${t.remaining} restants` : ""}
                        </option>
                    ))}
                </select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="print-qty">Nombre de billets</Label>
                <Input
                    id="print-qty"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={max}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    {qty > 0
                        ? `${sheets} feuille${sheets > 1 ? "s" : ""} A4 recto-verso (8 billets par feuille)${qty % TICKETS_PER_SHEET ? ", dernière feuille incomplète" : ""}.`
                        : "8 billets par feuille A4."}{" "}
                    Le stock est réservé dès la création.
                </p>
            </div>
            <Button type="submit" disabled={pending || qty < 1 || qty > max} className="w-full gap-2">
                <IconPrinter className="size-4" aria-hidden="true" />
                {pending ? "Génération…" : "Créer le lot et télécharger le PDF"}
            </Button>
            {ticket?.remaining === 0 && <p className="text-xs text-destructive">Ce billet est épuisé.</p>}
        </form>
    );
}

/** Annulation des billets invendus d'un lot (QR invalidés, stock libéré). */
export function ReleaseUnsoldButton({ orderId, unsold }: { orderId: string; unsold: number }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" disabled={pending}>
                    Annuler les invendus
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Annuler {unsold} billet{unsold > 1 ? "s" : ""} invendu{unsold > 1 ? "s" : ""} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Leurs QR codes deviennent invalides et le stock est libéré pour la
                        vente en ligne. À faire après avoir récupéré les billets non vendus
                        auprès des points de vente. Les billets déjà vendus ne sont pas
                        touchés.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Retour</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() =>
                            startTransition(async () => {
                                const res = await releaseUnsoldTickets(orderId);
                                if ("error" in res) {
                                    toast.error(res.error);
                                    return;
                                }
                                toast.success(`${res.released} billet${res.released > 1 ? "s" : ""} annulé${res.released > 1 ? "s" : ""}.`);
                                router.refresh();
                            })
                        }
                    >
                        Annuler les invendus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/** Envoi ou retrait du visuel recto/verso d'un billet. */
export function PrintArtUploader({
    ticketId,
    side,
    url,
}: {
    ticketId: string;
    side: "front" | "back";
    url: string | null;
}) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, startTransition] = useTransition();
    const label = side === "front" ? "Recto" : "Verso";

    function onFile(file: File | undefined) {
        if (!file) return;
        const fd = new FormData();
        fd.set("ticketId", ticketId);
        fd.set("side", side);
        fd.set("file", file);
        startTransition(async () => {
            const res = await uploadPrintArt(fd);
            if (inputRef.current) inputRef.current.value = "";
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success(`${label} enregistré.`);
            router.refresh();
        });
    }

    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-[11px] text-muted-foreground">{url ? "Visuel du graphiste" : "Design par défaut"}</span>
            </div>
            {url ? (
                // Aperçu : le visuel inclut 3 mm de fond perdu de chaque côté.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`${label} du billet`} className="mb-2 aspect-151/56 w-full rounded object-cover" />
            ) : (
                <div className="mb-2 flex aspect-151/56 w-full items-center justify-center rounded border border-dashed text-muted-foreground">
                    <IconPhoto className="size-5" aria-hidden="true" />
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
                aria-label={`Envoyer le visuel ${label.toLowerCase()}`}
            />
            <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" disabled={pending} className="flex-1 gap-1.5" onClick={() => inputRef.current?.click()}>
                    <IconUpload className="size-4" aria-hidden="true" />
                    {pending ? "Envoi…" : url ? "Remplacer" : "Envoyer"}
                </Button>
                {url && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        aria-label={`Retirer le visuel ${label.toLowerCase()}`}
                        onClick={() =>
                            startTransition(async () => {
                                const res = await removePrintArt(ticketId, side);
                                if (res.error) toast.error(res.error);
                                else router.refresh();
                            })
                        }
                    >
                        <IconTrash className="size-4" aria-hidden="true" />
                    </Button>
                )}
            </div>
        </div>
    );
}
