"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
    IconCamera,
    IconCircleCheck,
    IconCircleX,
    IconLoader2,
    IconTicket,
    IconUser,
    IconClock,
    IconAlertTriangle,
    IconShieldExclamation,
    IconCalendarOff,
    IconScan,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { IDetectedBarcode } from "@yudiel/react-qr-scanner";

const Scanner = dynamic(
    () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
    { ssr: false },
);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ScanResult {
    valid: boolean;
    message: string;
    detail?: string;
    ticketTitle?: string;
    attendeeName?: string;
    scannedCount?: number;
    quantity?: number;
}

// Chaque cas d'erreur identifiable a sa propre icône et couleur
type ErrorVariant = "used" | "wrong-event" | "unconfirmed" | "not-found" | "invalid" | "access";

function getErrorVariant(message: string): ErrorVariant {
    if (message === "Billet déjà utilisé") return "used";
    if (message === "Mauvais évènement") return "wrong-event";
    if (message === "Commande non confirmée") return "unconfirmed";
    if (message === "Billet introuvable") return "not-found";
    if (message === "QR code invalide" || message === "QR code non reconnu") return "invalid";
    return "access";
}

const ERROR_STYLE: Record<ErrorVariant, { bg: string; border: string; icon: string; iconColor: string; textColor: string }> = {
    "used":         { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: "clock", iconColor: "text-orange-500", textColor: "text-orange-800 dark:text-orange-200" },
    "wrong-event":  { bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", icon: "calendar-x", iconColor: "text-yellow-500", textColor: "text-yellow-800 dark:text-yellow-200" },
    "unconfirmed":  { bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", icon: "alert", iconColor: "text-yellow-500", textColor: "text-yellow-800 dark:text-yellow-200" },
    "not-found":    { bg: "bg-red-50 dark:bg-red-950/30",    border: "border-red-200 dark:border-red-800",    icon: "shield", iconColor: "text-red-500",    textColor: "text-red-800 dark:text-red-200" },
    "invalid":      { bg: "bg-red-50 dark:bg-red-950/30",    border: "border-red-200 dark:border-red-800",    icon: "x",      iconColor: "text-red-500",    textColor: "text-red-800 dark:text-red-200" },
    "access":       { bg: "bg-red-50 dark:bg-red-950/30",    border: "border-red-200 dark:border-red-800",    icon: "shield", iconColor: "text-red-500",    textColor: "text-red-800 dark:text-red-200" },
};

function ErrorIcon({ variant, className }: { variant: ErrorVariant; className?: string }) {
    const icon = ERROR_STYLE[variant].icon;
    const props = { className: `${ERROR_STYLE[variant].iconColor} ${className ?? "w-10 h-10"} mx-auto mb-3` };
    if (icon === "clock") return <IconClock {...props} />;
    if (icon === "calendar-x") return <IconCalendarOff {...props} />;
    if (icon === "alert") return <IconAlertTriangle {...props} />;
    if (icon === "shield") return <IconShieldExclamation {...props} />;
    return <IconCircleX {...props} />;
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

export function QrScanner({ eventId }: { eventId: string }) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    async function handleScan(detected: IDetectedBarcode[]) {
        if (!detected.length) return;
        const data = detected[0].rawValue;
        setScanning(false);

        try {
            const url = new URL(data);
            const itemId = url.searchParams.get("item");
            const orderRef = url.searchParams.get("order");

            if (!itemId || !orderRef) {
                setResult({ valid: false, message: "QR code non reconnu", detail: "Ce QR code n'est pas un billet Benin Events." });
                return;
            }

            const res = await fetch("/api/agent/validate-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, orderReference: orderRef, eventId }),
            });

            setResult(await res.json());
        } catch {
            setResult({ valid: false, message: "QR code invalide", detail: "Impossible de lire les données de ce QR code." });
        }
    }

    function handleError(err: unknown) {
        console.error(err);
        setScanning(false);
        setCameraError("Impossible d'accéder à la caméra. Vérifiez que vous avez accordé la permission dans votre navigateur.");
    }

    function restart() {
        setResult(null);
        setCameraError(null);
        setScanning(true);
    }

    return (
        <div className="space-y-5">
            {/* ── Viewfinder ─────────────────────────────────── */}
            <div className="relative bg-zinc-900 rounded-2xl overflow-hidden max-w-sm mx-auto">
                {scanning ? (
                    <div className="relative">
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            constraints={{ facingMode: "environment" }}
                            scanDelay={300}
                            formats={["qr_code"]}
                            styles={{
                                container: { width: "100%", borderRadius: 0 },
                                video: { width: "100%", display: "block" },
                            }}
                            components={{ finder: false }}
                        />
                        {/* Cadre de visée */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-52 h-52 relative">
                                <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-white rounded-tl-sm" />
                                <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-white rounded-tr-sm" />
                                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-white rounded-bl-sm" />
                                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-white rounded-br-sm" />
                            </div>
                            <p className="absolute bottom-3 text-white text-xs bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                Pointez vers le QR code du billet
                            </p>
                        </div>
                    </div>
                ) : (
                    !result && (
                        <div className="aspect-4/3 flex flex-col items-center justify-center gap-3 text-zinc-500">
                            <IconScan className="w-10 h-10" />
                            <p className="text-xs">Scanner inactif</p>
                        </div>
                    )
                )}
            </div>

            {/* ── Bouton démarrer / arrêter ───────────────────── */}
            {!result && (
                <div className="flex justify-center">
                    {!scanning ? (
                        <Button
                            onClick={() => { setCameraError(null); setScanning(true); }}
                            size="lg"
                            className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        >
                            <IconCamera className="w-5 h-5" />
                            Démarrer le scanner
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setScanning(false)}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                        >
                            <IconLoader2 className="w-5 h-5 animate-spin" />
                            Scan en cours… (Arrêter)
                        </Button>
                    )}
                </div>
            )}

            {/* ── Erreur caméra ───────────────────────────────── */}
            {cameraError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-center space-y-3">
                    <IconCamera className="w-8 h-8 text-red-400 mx-auto" />
                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">Caméra inaccessible</p>
                    <p className="text-red-600 dark:text-red-400 text-xs">{cameraError}</p>
                    <Button onClick={restart} variant="outline" size="sm" className="gap-2 mt-1">
                        <IconCamera className="w-4 h-4" />
                        Réessayer
                    </Button>
                </div>
            )}

            {/* ── Résultat ────────────────────────────────────── */}
            {result && (
                result.valid
                    ? <ValidResult result={result} onNext={restart} />
                    : <InvalidResult result={result} onNext={restart} />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Carte résultat valide
// ─────────────────────────────────────────────

function ValidResult({ result, onNext }: { result: ScanResult; onNext: () => void }) {
    return (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 space-y-4">
            <div className="text-center">
                <IconCircleCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-xl text-emerald-800 dark:text-emerald-200">
                    {result.message}
                </p>
            </div>

            <div className="space-y-2 border-t border-emerald-200 dark:border-emerald-700 pt-4">
                {result.ticketTitle && (
                    <div className="flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                        <IconTicket className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{result.ticketTitle}</span>
                    </div>
                )}
                {result.attendeeName && (
                    <div className="flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                        <IconUser className="w-4 h-4 shrink-0" />
                        <span>
                            Bénéficiaire :{" "}
                            <span className="font-semibold">{result.attendeeName}</span>
                        </span>
                    </div>
                )}
                {result.scannedCount !== undefined && result.quantity !== undefined && (
                    <div className="flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                        <IconScan className="w-4 h-4 shrink-0" />
                        <span>
                            Entrée{result.quantity > 1 ? "s" : ""} validée{result.quantity > 1 ? "s" : ""} :{" "}
                            <span className="font-semibold">{result.scannedCount} / {result.quantity}</span>
                        </span>
                    </div>
                )}
            </div>

            <Button onClick={onNext} variant="outline" size="sm" className="w-full gap-2 mt-2">
                <IconCamera className="w-4 h-4" />
                Scanner un autre billet
            </Button>
        </div>
    );
}

// ─────────────────────────────────────────────
// Carte résultat invalide
// ─────────────────────────────────────────────

function InvalidResult({ result, onNext }: { result: ScanResult; onNext: () => void }) {
    const variant = getErrorVariant(result.message);
    const style = ERROR_STYLE[variant];

    return (
        <div className={`${style.bg} ${style.border} border rounded-2xl p-6 space-y-4`}>
            <div className="text-center">
                <ErrorIcon variant={variant} className="w-12 h-12" />
                <p className={`font-bold text-xl ${style.textColor}`}>
                    {result.message}
                </p>
            </div>

            {(result.detail || result.ticketTitle || result.attendeeName || result.scannedCount !== undefined) && (
                <div className={`space-y-2 border-t ${style.border} pt-4`}>
                    {result.detail && (
                        <p className={`text-sm ${style.textColor} opacity-90`}>
                            {result.detail}
                        </p>
                    )}
                    {result.ticketTitle && (
                        <div className={`flex items-center gap-2.5 text-sm ${style.textColor}`}>
                            <IconTicket className="w-4 h-4 shrink-0 opacity-70" />
                            <span className="font-medium">{result.ticketTitle}</span>
                        </div>
                    )}
                    {result.attendeeName && (
                        <div className={`flex items-center gap-2.5 text-sm ${style.textColor}`}>
                            <IconUser className="w-4 h-4 shrink-0 opacity-70" />
                            <span>
                                Bénéficiaire :{" "}
                                <span className="font-semibold">{result.attendeeName}</span>
                            </span>
                        </div>
                    )}
                    {result.scannedCount !== undefined && result.quantity !== undefined && (
                        <div className={`flex items-center gap-2.5 text-sm ${style.textColor}`}>
                            <IconScan className="w-4 h-4 shrink-0 opacity-70" />
                            <span>
                                Entrées utilisées :{" "}
                                <span className="font-semibold">{result.scannedCount} / {result.quantity}</span>
                            </span>
                        </div>
                    )}
                </div>
            )}

            <Button onClick={onNext} variant="outline" size="sm" className="w-full gap-2 mt-2">
                <IconCamera className="w-4 h-4" />
                Scanner un autre billet
            </Button>
        </div>
    );
}
