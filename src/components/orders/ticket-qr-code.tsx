"use client";

import QRCode from "react-qr-code";
import { useState } from "react";
import { QrCode, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    itemId: string;
    orderReference: string;
    ticketTitle: string;
    quantity: number;
    appUrl: string;
}

export function TicketQrCode({
    itemId,
    orderReference,
    ticketTitle,
    quantity,
    appUrl,
}: Props) {
    const [open, setOpen] = useState(false);
    const url = `${appUrl}/verify?item=${itemId}&order=${orderReference}`;

    return (
        <div className="border rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
            >
                <span className="flex items-center gap-2 font-medium">
                    <QrCode className="w-4 h-4 text-secondary shrink-0" />
                    {ticketTitle}
                    {quantity > 1 && (
                        <span className="text-xs text-muted-foreground">
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
                <div className="border-t px-4 py-5 flex flex-col items-center gap-3 bg-white">
                    <div className="p-3 bg-white rounded-xl border shadow-sm">
                        <QRCode
                            value={url}
                            size={200}
                            level="H"
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground max-w-[220px]">
                        Présentez ce code à l&apos;entrée pour valider{" "}
                        {quantity > 1 ? `vos ${quantity} entrées` : "votre entrée"}
                    </p>
                </div>
            )}
        </div>
    );
}
