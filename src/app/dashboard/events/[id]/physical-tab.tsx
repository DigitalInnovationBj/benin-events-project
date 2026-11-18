import Link from "next/link";
import { IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { HelpCallout } from "@/components/dashboard/help-callout";
import { StatTile } from "@/components/dashboard/stat-tile";
import { formatEventDateShort, formatXOF } from "@/lib/format";
import { getRemainingStock } from "@/lib/stock";
import {
    PHYSICAL_COMMISSION_RATE,
    physicalCommission,
    printedTicketCode,
} from "@/lib/printed-tickets";
import { cn } from "@/lib/utils";
import { PrintBatchForm, PrintArtUploader, ReleaseUnsoldButton } from "./physical-client";

function Card({
    title,
    action,
    children,
    className,
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("rounded-2xl border bg-card p-5", className)}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-semibold">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

/**
 * Onglet « Billets physiques » : impression des lots, visuels du graphiste,
 * suivi des ventes par point de vente.
 */
export async function PhysicalTab({ eventId }: { eventId: string }) {
    const [tickets, batches, sellerStats, sellerEntries, organizer] = await Promise.all([
        prisma.ticket.findMany({
            where: { eventId, isArchived: false },
            select: {
                id: true,
                title: true,
                price: true,
                totalStock: true,
                printFrontUrl: true,
                printBackUrl: true,
            },
            orderBy: [{ position: "asc" }, { price: "asc" }],
        }),
        prisma.order.findMany({
            where: { eventId, status: "PRINTED" },
            select: {
                id: true,
                createdAt: true,
                items: {
                    select: {
                        serial: true,
                        price: true,
                        activatedAt: true,
                        firstScannedAt: true,
                        ticket: { select: { title: true } },
                    },
                    orderBy: { serial: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.orderItem.groupBy({
            by: ["activatedById"],
            where: {
                order: { eventId, status: "PRINTED" },
                activatedAt: { not: null },
            },
            _count: { _all: true },
            _sum: { price: true },
        }),
        prisma.orderItem.groupBy({
            by: ["activatedById"],
            where: {
                order: { eventId, status: "PRINTED" },
                activatedAt: { not: null },
                firstScannedAt: { not: null },
            },
            _count: { _all: true },
        }),
        prisma.event.findUnique({
            where: { id: eventId },
            select: { organizerId: true },
        }),
    ]);

    const remaining = await getRemainingStock(tickets.map((t) => t.id));

    const sellerIds = sellerStats.map((s) => s.activatedById).filter((id): id is string => !!id);
    const sellers = await prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, name: true, email: true },
    });
    const sellerById = new Map(sellers.map((u) => [u.id, u]));
    const entriesBySeller = new Map(sellerEntries.map((e) => [e.activatedById, e._count._all]));

    const printed = batches.reduce((n, b) => n + b.items.length, 0);
    const sold = sellerStats.reduce((n, s) => n + s._count._all, 0);
    const amount = sellerStats.reduce((n, s) => n + (s._sum.price ?? 0), 0);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Billets imprimés" value={printed} hint={`${batches.length} lot${batches.length > 1 ? "s" : ""}`} />
                <StatTile label="Billets vendus" value={sold} hint="activés par un point de vente" />
                <StatTile label="Ventes physiques" value={formatXOF(amount)} highlight />
                <StatTile
                    label={`Commission Benin Events (${Math.round(PHYSICAL_COMMISSION_RATE * 100)} %)`}
                    value={formatXOF(physicalCommission(amount))}
                    hint="sur les billets vendus"
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
                <div className="space-y-5">
                    <Card title={`Lots imprimés (${batches.length})`}>
                        {batches.length === 0 ? (
                            <p className="rounded-xl border border-dashed bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                                Aucun lot pour l&apos;instant. Choisissez un billet et une
                                quantité pour générer le PDF d&apos;impression.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {batches.map((b) => {
                                    if (b.items.length === 0) return null;
                                    const title = b.items[0].ticket.title;
                                    const first = printedTicketCode(title, b.items[0].serial);
                                    const last = printedTicketCode(title, b.items[b.items.length - 1].serial);
                                    const activated = b.items.filter((i) => i.activatedAt).length;
                                    const entered = b.items.filter((i) => i.firstScannedAt).length;
                                    const unsold = b.items.filter((i) => !i.activatedAt && !i.firstScannedAt).length;
                                    return (
                                        <li key={b.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="font-semibold">{title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {first} → {last} · {b.items.length} billets · {formatEventDateShort(b.createdAt)}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                    <span className="rounded-md bg-secondary/15 px-2 py-0.5 font-medium text-secondary">
                                                        {activated} vendu{activated > 1 ? "s" : ""}
                                                    </span>
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                                                        {entered} entré{entered > 1 ? "s" : ""}
                                                    </span>
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                                                        {unsold} non vendu{unsold > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <Button asChild size="sm" variant="outline">
                                                    <a href={`/api/events/${eventId}/print-batches/${b.id}`}>
                                                        <IconDownload className="size-4" aria-hidden="true" />
                                                        PDF
                                                    </a>
                                                </Button>
                                                {unsold > 0 && <ReleaseUnsoldButton orderId={b.id} unsold={unsold} />}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>

                    <Card title="Ventes par point de vente">
                        {sellerStats.length === 0 ? (
                            <p className="rounded-xl border border-dashed bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                                Aucune vente enregistrée. Les ventes apparaissent ici dès
                                qu&apos;un point de vente active un billet avec le scanner.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground">
                                            <th className="py-2 font-medium">Point de vente</th>
                                            <th className="py-2 text-right font-medium">Vendus</th>
                                            <th className="py-2 text-right font-medium">Montant</th>
                                            <th className="hidden py-2 text-right font-medium sm:table-cell">Entrés</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sellerStats
                                            .sort((a, b) => b._count._all - a._count._all)
                                            .map((s) => {
                                                const u = s.activatedById ? sellerById.get(s.activatedById) : null;
                                                const isOrganizer = s.activatedById === organizer?.organizerId;
                                                return (
                                                    <tr key={s.activatedById ?? "unknown"} className="border-b last:border-0">
                                                        <td className="py-2.5">
                                                            <span className="font-medium">{u?.name || u?.email || "Compte supprimé"}</span>
                                                            {isOrganizer && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}
                                                        </td>
                                                        <td className="py-2.5 text-right tabular-nums">{s._count._all}</td>
                                                        <td className="py-2.5 text-right tabular-nums">{formatXOF(s._sum.price ?? 0)}</td>
                                                        <td className="hidden py-2.5 text-right tabular-nums sm:table-cell">
                                                            {Number(entriesBySeller.get(s.activatedById) ?? 0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <Card
                        title="Visuels du graphiste"
                        action={
                            <Button asChild size="sm" variant="ghost">
                                <a href="/docs/billet-physique-guide-graphiste.pdf" target="_blank" rel="noopener">
                                    <IconFileTypePdf className="size-4" aria-hidden="true" />
                                    Guide graphiste
                                </a>
                            </Button>
                        }
                    >
                        <p className="mb-4 text-xs text-muted-foreground">
                            PNG ou JPG de 151 × 56 mm à 300 dpi (1783 × 661 px), fond perdu
                            compris. Sans visuel, le billet utilise le design par défaut.
                            Le QR et le numéro sont ajoutés automatiquement.
                        </p>
                        {tickets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Créez d&apos;abord un billet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {tickets.map((t) => (
                                    <li key={t.id} className="rounded-xl border p-4">
                                        <p className="mb-3 font-medium">{t.title}</p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <PrintArtUploader ticketId={t.id} side="front" url={t.printFrontUrl} />
                                            <PrintArtUploader ticketId={t.id} side="back" url={t.printBackUrl} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card title="Imprimer des billets" className="h-fit">
                        <PrintBatchForm
                            eventId={eventId}
                            tickets={tickets.map((t) => ({
                                id: t.id,
                                title: t.title,
                                price: t.price,
                                remaining: remaining.get(t.id) ?? null,
                            }))}
                        />
                    </Card>
                    <HelpCallout>
                        Les billets imprimés ne sont pas valables tant qu&apos;un point de
                        vente ne les a pas scannés au moment de la vente (mode Vente du
                        scanner). Ajoutez vos points de vente dans l&apos;onglet{" "}
                        <Link href={`/dashboard/events/${eventId}?tab=equipe`} className="font-medium underline underline-offset-2">
                            Équipe
                        </Link>
                        . Au bilan, annulez les invendus pour libérer le stock.
                    </HelpCallout>
                </div>
            </div>
        </div>
    );
}
