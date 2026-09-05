"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface StatusResult {
    status?: string;
    error?: string;
}

interface UsePaymentPollingOptions {
    intervalMs?: number;
    /** ~90s par défaut (22 × 4s) — un push Mobile Money se résout en général en quelques minutes max. */
    maxAttempts?: number;
}

/**
 * Poll un statut de paiement (Order/PlatformPayment) côté serveur pendant
 * que l'utilisateur confirme sur son téléphone (push FeexPay). Le webhook
 * FeexPay met à jour la ligne en base ; on se contente de la relire.
 */
export function usePaymentPolling(
    checkStatus: (id: string) => Promise<StatusResult>,
    options: UsePaymentPollingOptions = {},
) {
    const { intervalMs = 4000, maxAttempts = 22 } = options;

    const [isPolling, setIsPolling] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const idRef = useRef<string | null>(null);
    const attemptsRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stop = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        setIsPolling(false);
    }, []);

    const check = useCallback(async () => {
        const id = idRef.current;
        if (!id) return;

        const res = await checkStatus(id);
        if (res.status) {
            setStatus(res.status);
            if (res.status !== "PENDING") {
                stop();
                return;
            }
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= maxAttempts) {
            setTimedOut(true);
            stop();
            return;
        }
        timerRef.current = setTimeout(check, intervalMs);
    }, [checkStatus, intervalMs, maxAttempts, stop]);

    const start = useCallback(
        (id: string) => {
            idRef.current = id;
            attemptsRef.current = 0;
            setTimedOut(false);
            setStatus("PENDING");
            setIsPolling(true);
            check();
        },
        [check],
    );

    /** Vérification manuelle immédiate (bouton "Vérifier maintenant"). */
    const retryNow = useCallback(() => {
        setTimedOut(false);
        attemptsRef.current = 0;
        setIsPolling(true);
        check();
    }, [check]);

    // Nettoyage à l'unmount — pas de timer qui fuit si l'utilisateur quitte la page.
    useEffect(() => stop, [stop]);

    return { start, retryNow, stop, isPolling, timedOut, status };
}
