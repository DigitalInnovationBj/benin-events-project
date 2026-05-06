import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Ticket, Calendar } from "lucide-react";

interface Props {
    searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
    const { orderId } = await searchParams;
    const { userId } = await auth();

    let order = null;

    if (orderId && userId) {
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (dbUser) {
            order = await prisma.order.findFirst({
                where: { id: orderId, userId: dbUser.id },
                include: {
                    event: { select: { title: true, slug: true } },
                    items: {
                        include: { ticket: { select: { title: true } } },
                    },
                },
            });
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
                    {isConfirmed
                        ? "Paiement confirmé !"
                        : "Confirmation en attente"}
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
                                <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                >
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
                    </>
                ) : (
                    <p className="text-muted-foreground">
                        Votre paiement est en cours de traitement. Vous
                        recevrez une confirmation dès qu&apos;il sera validé.
                        Vérifiez vos commandes dans quelques instants.
                    </p>
                )}

                <div className="flex flex-col gap-3 pt-2">
                    <Button asChild variant="secondary">
                        <Link href="/dashboard/orders">Mes commandes</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/events">Voir d&apos;autres évènements</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
