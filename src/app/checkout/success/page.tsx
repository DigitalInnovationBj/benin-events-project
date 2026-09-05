import { getCurrentUser } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Ticket, Calendar, UserPlus } from "lucide-react";

interface Props {
    searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
    const { orderId } = await searchParams;
    const dbUser = await getCurrentUser();

    let order = null;
    let isGuest = false;

    if (orderId) {
        if (dbUser) {
            // Utilisateur connecté : on vérifie la propriété
            order = await prisma.order.findFirst({
                where: { id: orderId, userId: dbUser.id },
                include: {
                    event: {
                        select: {
                            title: true,
                            slug: true,
                            eventType: true,
                            onlineUrl: true,
                            postPurchaseMessage: true,
                        },
                    },
                    items: { include: { ticket: { select: { title: true } } } },
                },
            });
        }

        if (!order) {
            // Commande invité : accessible par l'URL (orderId = token non devinable)
            const candidate = await prisma.order.findFirst({
                where: { id: orderId, userId: null },
                include: {
                    event: {
                        select: {
                            title: true,
                            slug: true,
                            eventType: true,
                            onlineUrl: true,
                            postPurchaseMessage: true,
                        },
                    },
                    items: { include: { ticket: { select: { title: true } } } },
                },
            });
            if (candidate) {
                order = candidate;
                isGuest = true;
            }
        }
    }

    const isConfirmed = order?.status === "COMPLETED";

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="max-w-md w-full bg-card border rounded-3xl p-8 shadow-xl text-center space-y-6">
                {isConfirmed ? (
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                ) : (
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto" />
                )}

                <h1 className="text-3xl font-afo">
                    {isConfirmed ? "Paiement confirmé !" : "Confirmation en attente"}
                </h1>

                {isConfirmed && order ? (
                    <>
                        <p className="text-muted-foreground">
                            Votre commande pour{" "}
                            <span className="font-semibold text-foreground">
                                {order.event.title}
                            </span>{" "}
                            a été confirmée.
                        </p>

                        <div className="bg-muted/40 rounded-2xl p-4 text-left space-y-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Ticket className="w-4 h-4 text-secondary" />
                                        {item.ticket.title} × {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                        {item.price === 0
                                            ? "Gratuit"
                                            : `${(item.price * item.quantity).toLocaleString("fr-FR")} FCFA`}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-secondary">
                                    {order.totalAmount === 0
                                        ? "Gratuit"
                                        : `${order.totalAmount.toLocaleString("fr-FR")} FCFA`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                            <Calendar className="w-3.5 h-3.5" />
                            Réf : {order.reference}
                        </div>

                        {/* Message post-achat / lien d'accès (jamais avant COMPLETED) */}
                        {(order.event.onlineUrl || order.event.postPurchaseMessage) && (
                            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-left space-y-2">
                                <p className="font-semibold text-sm">
                                    {order.event.eventType === "ONLINE"
                                        ? "Accès à l'évènement"
                                        : "Informations complémentaires"}
                                </p>
                                {order.event.onlineUrl && (
                                    <a
                                        href={order.event.onlineUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-secondary underline break-all"
                                    >
                                        {order.event.onlineUrl}
                                    </a>
                                )}
                                {order.event.postPurchaseMessage && (
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: order.event.postPurchaseMessage,
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* CTA création de compte pour les invités */}
                        {isGuest && (
                            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-left space-y-2">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    <UserPlus className="w-4 h-4 text-secondary shrink-0" />
                                    Retrouvez vos billets à tout moment
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Créez un compte avec l&apos;email utilisé lors de l&apos;achat pour accéder à vos billets et QR codes depuis votre espace personnel.
                                </p>
                                <Button asChild size="sm" variant="secondary" className="w-full mt-1">
                                    <Link href="/sign-up">Créer mon compte</Link>
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-muted-foreground">
                        Votre paiement est en cours de traitement. Vous
                        recevrez une confirmation dès qu&apos;il sera validé.
                        {!dbUser && " Vérifiez votre boîte email dans quelques instants."}
                        {dbUser && " Vérifiez vos commandes dans quelques instants."}
                    </p>
                )}

                <div className="flex flex-col gap-3 pt-2">
                    {dbUser ? (
                        <Button asChild variant="secondary">
                            <Link href="/dashboard/orders">Mes commandes</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="secondary">
                            <Link href="/sign-in?redirect_url=%2Fdashboard%2Forders">Se connecter pour voir mes commandes</Link>
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href="/events">Voir d&apos;autres évènements</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
