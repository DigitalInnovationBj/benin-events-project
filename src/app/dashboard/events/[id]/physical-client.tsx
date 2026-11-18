"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconCheck, IconDownload, IconLock, IconPrinter, IconTrash, IconUpload, IconPhoto } from "@tabler/icons-react";
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
    setPrintCode,
    setPrintNumberColor,
    uploadPrintArt,
} from "@/actions/printed-ticket.actions";
import { MAX_PRINT_BATCH, PRINT_CODE_MAX, TICKETS_PER_SHEET, printedTicketCode } from "@/lib/printed-tickets";
import { formatXOF } from "@/lib/format";

/**
 * Télécharge le PDF d'un lot. Passe par fetch plutôt qu'un simple lien pour
 * afficher l'erreur du serveur (visuel inaccessible…) au lieu d'une page JSON.
 */
async function downloadBatchPdf(eventId: string, orderId: string): Promise<boolean> {
    const res = await fetch(`/api/events/${eventId}/print-batches/${orderId}`);
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Le PDF n'a pas pu être généré. Réessayez.");
        return false;
    }
    const blob = await res.blob();
    const name =
        res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "billets.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
}

/** Bouton de téléchargement du PDF d'un lot existant. */
export function DownloadPdfButton({ eventId, orderId }: { eventId: string; orderId: string }) {
    const [pending, startTransition] = useTransition();
    return (
        <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(async () => { await downloadBatchPdf(eventId, orderId); })}
        >
            <IconDownload className="size-4" aria-hidden="true" />
            {pending ? "Génération…" : "PDF"}
        </Button>
    );
}

type TicketOption = {
    id: string;
    title: string;
    price: number;
    remaining: number | null;
    printCode: string | null;
};

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
            router.refresh();
            const ok = await downloadBatchPdf(eventId, res.orderId);
            if (ok) toast.success(`${qty} billets créés. Le PDF est téléchargé.`);
            else toast.message("Le lot est créé : retéléchargez son PDF depuis la liste des lots.");
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
                            {t.printCode ? `${t.printCode} · ` : ""}
                            {t.title} · {formatXOF(t.price)}
                            {t.remaining !== null ? ` · ${t.remaining} restants` : ""}
                            {t.printCode ? "" : " · code à définir"}
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
                        ? `${sheets} feuille${sheets > 1 ? "s" : ""} A4 (8 billets par feuille)${qty % TICKETS_PER_SHEET ? ", dernière feuille incomplète" : ""}.`
                        : "8 billets par feuille A4."}{" "}
                    Recto seul. Le stock est réservé dès la création.
                </p>
            </div>
            {ticket && !ticket.printCode && (
                <p className="rounded-lg border border-secondary/40 bg-secondary/10 p-3 text-xs">
                    Définissez d&apos;abord le code imprimé de ce billet dans « Codes et
                    visuels » (ex. STD-1J) : il apparaît devant chaque numéro.
                </p>
            )}
            <Button type="submit" disabled={pending || qty < 1 || qty > max || !ticket?.printCode} className="w-full gap-2">
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

/** Envoi ou retrait du visuel d'un billet (recto seul). */
export function PrintArtUploader({ ticketId, url }: { ticketId: string; url: string | null }) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, startTransition] = useTransition();

    function onFile(file: File | undefined) {
        if (!file) return;
        const fd = new FormData();
        fd.set("ticketId", ticketId);
        fd.set("file", file);
        startTransition(async () => {
            const res = await uploadPrintArt(fd);
            if (inputRef.current) inputRef.current.value = "";
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Visuel enregistré.");
            router.refresh();
        });
    }

    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">Visuel</span>
                <span className="text-[11px] text-muted-foreground">{url ? "Visuel du graphiste" : "Design par défaut"}</span>
            </div>
            {url ? (
                // Aperçu : le visuel inclut 3 mm de fond perdu de chaque côté.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Visuel du billet imprimé" className="mb-2 aspect-151/56 w-full rounded object-cover" />
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
                aria-label="Envoyer le visuel du billet"
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
                        aria-label="Retirer le visuel"
                        onClick={() =>
                            startTransition(async () => {
                                const res = await removePrintArt(ticketId);
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

/**
 * Code imprimé devant le numéro. Proposé à partir du titre, à valider ;
 * figé dès qu'un lot a été imprimé.
 */
export function PrintCodeField({
    ticketId,
    value,
    suggestion,
    locked,
}: {
    ticketId: string;
    value: string | null;
    suggestion: string;
    locked: boolean;
}) {
    const router = useRouter();
    const [code, setCode] = useState(value ?? suggestion);
    const [pending, startTransition] = useTransition();
    const saved = value !== null && code === value;

    if (locked && value) {
        return (
            <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Code :</span>
                <span className="rounded-md bg-muted px-2 py-1 font-mono font-semibold">{value}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                    <IconLock className="size-3.5" aria-hidden="true" />
                    figé (billets imprimés)
                </span>
            </div>
        );
    }

    function save(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            const res = await setPrintCode(ticketId, code);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            if (res.code) setCode(res.code);
            toast.success(`Code ${res.code} enregistré.`);
            router.refresh();
        });
    }

    return (
        <form onSubmit={save} className="flex flex-wrap items-center gap-2 text-xs">
            <Label htmlFor={`code-${ticketId}`} className="text-xs font-normal text-muted-foreground">
                Code imprimé :
            </Label>
            <Input
                id={`code-${ticketId}`}
                value={code}
                maxLength={PRINT_CODE_MAX}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-8 w-28 font-mono uppercase"
                aria-describedby={`code-${ticketId}-hint`}
            />
            <Button type="submit" size="sm" variant={saved ? "ghost" : "secondary"} disabled={pending || saved || !code.trim()} className="h-8 gap-1">
                {saved ? <IconCheck className="size-4" aria-hidden="true" /> : null}
                {saved ? "Enregistré" : pending ? "…" : "Enregistrer"}
            </Button>
            <span id={`code-${ticketId}-hint`} className="w-full text-[11px] text-muted-foreground">
                Numéros : {printedTicketCode(code.trim() || "CODE", 1)}, {printedTicketCode(code.trim() || "CODE", 2)}…
                {value === null && " (suggestion, à enregistrer)"}
            </span>
        </form>
    );
}

/** Couleur du numéro imprimé, selon le fond du talon du visuel. */
export function NumberColorPicker({ ticketId, value }: { ticketId: string; value: string }) {
    const router = useRouter();
    const [color, setColor] = useState(value === "light" ? "light" : "dark");
    const [pending, startTransition] = useTransition();

    function choose(next: "dark" | "light") {
        if (next === color) return;
        const previous = color;
        setColor(next);
        startTransition(async () => {
            const res = await setPrintNumberColor(ticketId, next);
            if (res.error) {
                setColor(previous);
                toast.error(res.error);
                return;
            }
            router.refresh();
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Couleur du numéro :</span>
            <div role="radiogroup" aria-label="Couleur du numéro" className="inline-flex rounded-md border p-0.5">
                {([
                    { key: "dark", label: "Noir" },
                    { key: "light", label: "Blanc" },
                ] as const).map((o) => (
                    <button
                        key={o.key}
                        type="button"
                        role="radio"
                        aria-checked={color === o.key}
                        disabled={pending}
                        onClick={() => choose(o.key)}
                        className={
                            color === o.key
                                ? "rounded bg-secondary px-3 py-1 font-medium text-secondary-foreground"
                                : "rounded px-3 py-1 text-muted-foreground hover:text-foreground"
                        }
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
