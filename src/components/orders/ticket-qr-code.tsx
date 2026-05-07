"use client";

import Image from "next/image";
import { useState } from "react";
import { QrCode, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
    qrDataUrl: string;
    ticketTitle: string;
    quantity: number;
}

export function TicketQrCode({ qrDataUrl, ticketTitle, quantity }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
            >
                <span className="flex items-center gap-2 font-medium">
                    <QrCode className="w-4 h-4 text-secondary shrink-0" />
                    <span className="truncate">{ticketTitle}</span>
                    {quantity > 1 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                            × {quantity}
                        </span>
                    )}
                </span>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
            </button>

            {open && (
                <div className="border-t px-4 py-5 flex flex-col items-center gap-3 bg-white dark:bg-zinc-950">
                    <div className="p-3 bg-white rounded-xl border shadow-sm">
                        <Image
                            src={qrDataUrl}
                            alt={`QR code — ${ticketTitle}`}
                            width={200}
                            height={200}
                            unoptimized
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground max-w-55">
                        Présentez ce code à l&apos;entrée pour valider{" "}
                        {quantity > 1
                            ? `vos ${quantity} entrées`
                            : "votre entrée"}
                    </p>
                </div>
            )}
        </div>
    );
}
