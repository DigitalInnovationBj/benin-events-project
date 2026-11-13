import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { dayKey, formatDayKey } from "@/lib/ticket-days";
import {
    IconCircleCheck,
    IconCircleX,
    IconAlertTriangle,
    IconCalendarEvent,
    IconMapPin,
    IconTicket,
    IconUser,
    IconScan,
} from "@tabler/icons-react";

export const metadata: Metadata = {
    title: "Vérification de billet",
    description: "Vérifiez l'authenticité et la validité d'un billet Benin Events.",
    robots: { index: false, follow: false },
};

interface Props {
    searchParams: Promise<{ item?: string; order?: string }>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDateTime(date: Date) {
    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Porto-Novo",
    });
}

type Verdict = {
    tone: StatusTone;
    /** Icône du bandeau principal */
    icon: typeof IconCircleCheck;
    accent: string;
    title: string;
    detail: string;
    badge: string;
};

const ORDER_STATUS_DETAIL: Record<string, string> = {
    PENDING: "Le paiement de cette commande n'a pas encore été confirmé.",
    FAILED: "Le paiement de cette commande a échoué.",
    CANCELLED: "Cette commande a été annulée.",
    EXPIRED: "Cette commande a expiré sans paiement.",
    REFUNDED: "Cette commande a été remboursée.",
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

/**
 * Page publique de vérification d'un billet — cible des QR codes imprimés sur
 * les PDF et les emails (`/verify?item=<orderItemId>&order=<reference>`).
 *
 * Lecture seule : elle n'incrémente jamais `scannedCount`. Le contrôle d'accès
 * à l'entrée reste `POST /api/agent/validate-ticket`, réservé aux agents.
 */
export default async function VerifyTicketPage({ searchParams }: Props) {
    const { item: itemId, order: orderReference } = await searchParams;

    const rawItem =
        itemId && orderReference
            ? await prisma.orderItem.findUnique({
                  where: { id: itemId },
                  select: {
                      id: true,
                      quantity: true,
                      scannedCount: true,
                      firstScannedAt: true,
                      attendeeName: true,
                      ticket: { select: { title: true, validDays: true, eventId: true } },
                      scans: { select: { day: true, eventId: true } },
                      order: {
                          select: {
                              reference: true,
                              status: true,
                              guestName: true,
                              user: { select: { name: true } },
                              event: {
                                  select: {
                                      title: true,
                                      slug: true,
                                      startDate: true,
                                      location: true,
                                      eventType: true,
                                      isCancelled: true,
                                  },
                              },
                          },
                      },
                  },
              })
            : null;

    // La référence de commande doit correspondre : l'id seul ne suffit pas.
    const found =
        rawItem && rawItem.order.reference === orderReference ? rawItem : null;

    // ── Détermination du verdict ──────────────────────────────────────────
    let verdict: Verdict;

    if (!found) {
        verdict = {
            tone: "danger",
            icon: IconCircleX,
            accent: "text-red-500",
            title: "Billet introuvable",
            detail: "Ce QR code ne correspond à aucun billet enregistré. Il est peut-être falsifié, expiré ou mal lu.",
            badge: "Non valide",
        };
    } else if (found.order.event.isCancelled) {
        verdict = {
            tone: "danger",
            icon: IconAlertTriangle,
            accent: "text-red-500",
            title: "Évènement annulé",
            detail: "Cet évènement a été annulé. Ce billet ne donne plus accès à l'entrée.",
            badge: "Annulé",
        };
    } else if (found.order.status !== "COMPLETED") {
        verdict = {
            tone: "warning",
            icon: IconAlertTriangle,
            accent: "text-yellow-500",
            title: "Billet non confirmé",
            detail:
                ORDER_STATUS_DETAIL[found.order.status] ??
                "Le statut de cette commande ne permet pas l'accès.",
            badge: "Non confirmé",
        };
    } else if (found.ticket.validDays.length > 0) {
        // Pass multi-jours : validité jour par jour (un scan par jour).
        const today = dayKey();
        const days = found.ticket.validDays;
        const validityLabel = `Valable les : ${days.map(formatDayKey).join(", ")}.`;
        if (!days.includes(today)) {
            verdict = {
                tone: "warning",
                icon: IconAlertTriangle,
                accent: "text-yellow-500",
                title: "Non valable aujourd'hui",
                detail: `Ce pass multi-jours n'est pas valable aujourd'hui. ${validityLabel}`,
                badge: "Hors date",
            };
        } else if (found.scans.some(
                (sc) => sc.day === today && sc.eventId === found.ticket.eventId,
            )) {
            verdict = {
                tone: "warning",
                icon: IconAlertTriangle,
                accent: "text-yellow-500",
                title: "Déjà scanné aujourd'hui",
                detail: `Ce pass a déjà été validé aujourd'hui. ${validityLabel}`,
                badge: "Déjà scanné",
            };
        } else {
            verdict = {
                tone: "success",
                icon: IconCircleCheck,
                accent: "text-emerald-500",
                title: "Billet valide",
                detail: `Pass multi-jours authentique, pas encore utilisé aujourd'hui. ${validityLabel}`,
                badge: "Valide",
            };
        }
    } else if (found.scannedCount >= found.quantity) {
        verdict = {
            tone: "warning",
            icon: IconAlertTriangle,
            accent: "text-yellow-500",
            title: "Billet déjà utilisé",
            detail: found.firstScannedAt
                ? `Ce billet a été scanné à l'entrée le ${formatDateTime(found.firstScannedAt)}.`
                : "Ce billet a déjà été scanné à l'entrée.",
            badge: "Déjà scanné",
        };
    } else {
        verdict = {
            tone: "success",
            icon: IconCircleCheck,
            accent: "text-emerald-500",
            title: "Billet valide",
            detail: "Ce billet est authentique et n'a pas encore été utilisé. Il sera validé par un agent à l'entrée.",
            badge: "Valide",
        };
    }

    const VerdictIcon = verdict.icon;
    const holderName =
        found?.attendeeName ??
        found?.order.user?.name ??
        found?.order.guestName ??
        null;

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-background">
            <div className="w-full max-w-md space-y-6">
                {/* ── Verdict ───────────────────────────────────────────── */}
                <div className="bg-card border rounded-3xl p-8 shadow-xl text-center space-y-4">
                    <VerdictIcon
                        className={`w-16 h-16 mx-auto ${verdict.accent}`}
                        aria-hidden="true"
                    />

                    <div className="space-y-3">
                        <h1 className="text-3xl font-afo">{verdict.title}</h1>
                        <div className="flex justify-center">
                            <StatusBadge
                                tone={verdict.tone}
                                label={verdict.badge}
                            />
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {verdict.detail}
                    </p>
                </div>

                {/* ── Détail du billet ──────────────────────────────────── */}
                {found && (
                    <div className="bg-card border rounded-3xl p-6 space-y-4">
                        <h2 className="font-afo text-2xl">
                            {found.order.event.title}
                        </h2>

                        <dl className="space-y-3 text-sm">
                            <div className="flex items-start gap-2.5">
                                <IconCalendarEvent
                                    className="w-4 h-4 mt-0.5 shrink-0 text-secondary"
                                    aria-hidden="true"
                                />
                                <div>
                                    <dt className="sr-only">Date</dt>
                                    <dd>
                                        {formatDateTime(
                                            found.order.event.startDate,
                                        )}
                                    </dd>
                                </div>
                            </div>

                            {found.order.event.eventType === "IN_PERSON" &&
                                found.order.event.location && (
                                    <div className="flex items-start gap-2.5">
                                        <IconMapPin
                                            className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <dt className="sr-only">Lieu</dt>
                                            <dd className="text-muted-foreground">
                                                {found.order.event.location}
                                            </dd>
                                        </div>
                                    </div>
                                )}

                            <div className="flex items-start gap-2.5">
                                <IconTicket
                                    className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <div>
                                    <dt className="sr-only">
                                        Catégorie de billet
                                    </dt>
                                    <dd className="text-muted-foreground">
                                        {found.ticket.title}
                                    </dd>
                                </div>
                            </div>

                            {holderName && (
                                <div className="flex items-start gap-2.5">
                                    <IconUser
                                        className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <dt className="sr-only">Titulaire</dt>
                                        <dd className="text-muted-foreground">
                                            {holderName}
                                        </dd>
                                    </div>
                                </div>
                            )}

                            {found.ticket.validDays.length === 0 && found.scannedCount > 0 && (
                                <div className="flex items-start gap-2.5">
                                    <IconScan
                                        className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <dt className="sr-only">Scans</dt>
                                        <dd className="text-muted-foreground">
                                            Scanné {found.scannedCount} fois sur{" "}
                                            {found.quantity}
                                        </dd>
                                    </div>
                                </div>
                            )}
                        </dl>

                        <p className="border-t pt-3 text-xs text-muted-foreground">
                            Réf. commande : {found.order.reference}
                        </p>
                    </div>
                )}

                {/* ── Actions ───────────────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                    {found && (
                        <Button asChild variant="secondary">
                            <Link href={`/events/${found.order.event.slug}`}>
                                Voir l&apos;évènement
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href="/">Retour à l&apos;accueil</Link>
                    </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Cette page vérifie l&apos;authenticité d&apos;un billet.
                    Seul un agent habilité peut le valider à l&apos;entrée.
                </p>
            </div>
        </div>
    );
}
