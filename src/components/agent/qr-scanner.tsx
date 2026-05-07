"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanResult {
    valid: boolean;
    message: string;
    ticketTitle?: string;
    scannedCount?: number;
    quantity?: number;
}

const SCANNER_ID = "qr-scanner-region";

export function QrScanner({ eventId }: { eventId: string }) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    async function stopScanner() {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop().catch(() => {});
        }
        setScanning(false);
    }

    async function startScanner() {
        setError(null);
        setResult(null);

        try {
            const scanner = new Html5Qrcode(SCANNER_ID);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await stopScanner();
                    await validateCode(decodedText);
                },
                () => {},
            );

            setScanning(true);
        } catch {
            setError(
                "Impossible d'accéder à la caméra. Vérifiez les permissions.",
            );
        }
    }

    async function validateCode(rawValue: string) {
        try {
            const url = new URL(rawValue);
            const itemId = url.searchParams.get("item");
            const orderRef = url.searchParams.get("order");

            if (!itemId || !orderRef) {
                setResult({ valid: false, message: "QR code non reconnu" });
                return;
            }

            const res = await fetch("/api/agent/validate-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, orderReference: orderRef, eventId }),
            });

            const data: ScanResult = await res.json();
            setResult(data);
        } catch {
            setResult({ valid: false, message: "QR code invalide" });
        }
    }

    async function handleRestart() {
        setResult(null);
        await startScanner();
    }

    return (
        <div className="space-y-6">
            {/* Scanner region */}
            <div className="max-w-md mx-auto">
                <div
                    id={SCANNER_ID}
                    className="rounded-2xl overflow-hidden border bg-black aspect-[4/3]"
                />
            </div>

            {/* Controls */}
            <div className="flex justify-center">
                {!scanning ? (
                    <Button
                        onClick={startScanner}
                        size="lg"
                        className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    >
                        <Camera className="w-5 h-5" />
                        Démarrer le scanner
                    </Button>
                ) : (
                    <Button
                        onClick={stopScanner}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                    >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scan en cours... (Arrêter)
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Scan result */}
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
                        onClick={handleRestart}
                        className="mt-4 gap-2"
                        variant="outline"
                    >
                        <Camera className="w-4 h-4" />
                        Scanner un autre billet
                    </Button>
                </div>
            )}
        </div>
    );
}
