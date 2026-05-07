"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanResult {
    valid: boolean;
    message: string;
    ticketTitle?: string;
    scannedCount?: number;
    quantity?: number;
}

export function QrScanner({ eventId }: { eventId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);

    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!("BarcodeDetector" in window)) setSupported(false);
        return () => stop();
    }, []);

    function stop() {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setScanning(false);
    }

    const runDetection = useCallback(() => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;

        // @ts-expect-error — BarcodeDetector not yet in TS lib
        const detector = new BarcodeDetector({ formats: ["qr_code"] });

        const tick = async () => {
            if (!videoRef.current || !streamRef.current) return;
            try {
                const codes = await detector.detect(videoRef.current);
                if (codes.length > 0) {
                    stop();
                    await validate(codes[0].rawValue);
                    return;
                }
            } catch {
                // non-fatal, keep looping
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, []);

    async function start() {
        setError(null);
        setResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: 640, height: 480 },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setScanning(true);
            runDetection();
        } catch {
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
    }

    async function validate(raw: string) {
        try {
            const url = new URL(raw);
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
            setResult(await res.json());
        } catch {
            setResult({ valid: false, message: "QR code invalide" });
        }
    }

    if (!supported) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
                <p className="text-yellow-800 font-medium text-sm">
                    Votre navigateur ne supporte pas la détection de QR codes.
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                    Utilisez Chrome 83+ ou Edge sur Android / desktop.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Viewfinder */}
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-4/3 max-w-sm mx-auto">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                />
                {!scanning && !result && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CameraOff className="w-10 h-10 text-zinc-500" />
                    </div>
                )}
                {scanning && (
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
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center">
                {!scanning ? (
                    <Button
                        onClick={start}
                        size="lg"
                        className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    >
                        <Camera className="w-5 h-5" />
                        Démarrer le scanner
                    </Button>
                ) : (
                    <Button onClick={stop} variant="outline" size="lg" className="gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scan en cours… (Arrêter)
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className={`rounded-2xl p-6 text-center border ${result.valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    {result.valid
                        ? <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        : <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    }
                    <p className={`font-bold text-lg ${result.valid ? "text-emerald-800" : "text-red-800"}`}>
                        {result.message}
                    </p>
                    {result.ticketTitle && (
                        <p className="text-sm mt-1 text-zinc-600">{result.ticketTitle}</p>
                    )}
                    {result.scannedCount !== undefined && result.quantity !== undefined && (
                        <p className="text-sm mt-1 text-zinc-500">
                            Entrées validées : <strong>{result.scannedCount} / {result.quantity}</strong>
                        </p>
                    )}
                    <Button
                        onClick={() => { setResult(null); start(); }}
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
