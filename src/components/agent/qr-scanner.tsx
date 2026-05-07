"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// SSR disabled — react-qr-scanner uses getUserMedia & Web Worker
const QrReader = dynamic(() => import("react-qr-scanner"), { ssr: false });

interface ScanResult {
    valid: boolean;
    message: string;
    ticketTitle?: string;
    scannedCount?: number;
    quantity?: number;
}

export function QrScanner({ eventId }: { eventId: string }) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleScan(data: string | null) {
        if (!data) return;
        setScanning(false);

        try {
            const url = new URL(data);
            const itemId = url.searchParams.get("item");
            const orderRef = url.searchParams.get("order");

            if (!itemId || !orderRef) {
                setResult({ valid: false, message: "QR code non reconnu" });
                return;
            }

            const res = await fetch("/api/agent/validate-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId,
                    orderReference: orderRef,
                    eventId,
                }),
            });

            setResult(await res.json());
        } catch {
            setResult({ valid: false, message: "QR code invalide" });
        }
    }

    function handleError(err: unknown) {
        console.error(err);
        setScanning(false);
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }

    function restart() {
        setResult(null);
        setError(null);
        setScanning(true);
    }

    return (
        <div className="space-y-5">
            {/* Viewfinder */}
            <div className="relative bg-black rounded-2xl overflow-hidden max-w-sm mx-auto">
                {scanning ? (
                    <div className="relative">
                        <QrReader
                            delay={200}
                            facingMode="rear"
                            onScan={handleScan}
                            onError={handleError}
                            style={{ width: "100%", display: "block" }}
                        />
                        {/* Scan frame overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-52 h-52 relative">
                                <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                                <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                            </div>
                            <p className="absolute bottom-3 text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                                Pointez vers un QR code
                            </p>
                        </div>
                    </div>
                ) : (
                    !result && (
                        <div className="aspect-4/3 flex items-center justify-center">
                            <Camera className="w-10 h-10 text-zinc-500" />
                        </div>
                    )
                )}
            </div>

            {/* Controls */}
            {!result && (
                <div className="flex justify-center">
                    {!scanning ? (
                        <Button
                            onClick={() => { setError(null); setScanning(true); }}
                            size="lg"
                            className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        >
                            <Camera className="w-5 h-5" />
                            Démarrer le scanner
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setScanning(false)}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Scan en cours… (Arrêter)
                        </Button>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button onClick={restart} variant="outline" size="sm" className="mt-3 gap-2">
                        <Camera className="w-4 h-4" />
                        Réessayer
                    </Button>
                </div>
            )}

            {/* Result */}
            {result && (
                <div
                    className={`rounded-2xl p-6 text-center border ${
                        result.valid
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200"
                    }`}
                >
                    {result.valid ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    ) : (
                        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    )}
                    <p
                        className={`font-bold text-lg ${
                            result.valid ? "text-emerald-800" : "text-red-800"
                        }`}
                    >
                        {result.message}
                    </p>
                    {result.ticketTitle && (
                        <p className="text-sm mt-1 text-zinc-600">
                            {result.ticketTitle}
                        </p>
                    )}
                    {result.scannedCount !== undefined &&
                        result.quantity !== undefined && (
                            <p className="text-sm mt-1 text-zinc-500">
                                Entrées validées :{" "}
                                <strong>
                                    {result.scannedCount} / {result.quantity}
                                </strong>
                            </p>
                        )}
                    <Button
                        onClick={restart}
                        className="mt-4 gap-2"
                        variant="outline"
                        size="sm"
                    >
                        <Camera className="w-4 h-4" />
                        Scanner un autre billet
                    </Button>
                </div>
            )}
        </div>
    );
}
