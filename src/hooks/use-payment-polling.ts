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
    /**
     * Appelé une fois que le statut est définitif (≠ PENDING).
     *
     * Préférable à un `useEffect` qui observerait `status` côté appelant :
     * la résolution est un évènement, pas un état à synchroniser.
     */
    onSettled?: (status: string) => void;
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
    const { intervalMs = 4000, maxAttempts = 22, onSettled } = options;

    // Le callback est lu au moment de l'appel : pas de closure périmée, et
    // `check` n'a pas à être recréé quand l'appelant redéfinit sa fonction.
    const onSettledRef = useRef(onSettled);

    const [isPolling, setIsPolling] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    /** Vrai après plusieurs échecs réseau d'affilée : la connexion semble coupée. */
    const [connectionIssue, setConnectionIssue] = useState(false);

    const idRef = useRef<string | null>(null);
    const attemptsRef = useRef(0);
    const consecutiveErrorsRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Indirection sur la fonction : `check` se replanifie elle-même, or une
    // référence directe créerait un cycle (et une erreur de lint).
    const checkRef = useRef<() => void>(() => {});

    const stop = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        setIsPolling(false);
    }, []);

    const check = useCallback(async () => {
        const id = idRef.current;
        if (!id) return;

        try {
            const res = await checkStatus(id);
            consecutiveErrorsRef.current = 0;
            setConnectionIssue(false);

            if (res.status) {
                setStatus(res.status);
                if (res.status !== "PENDING") {
                    stop();
                    onSettledRef.current?.(res.status);
                    return;
                }
            }
        } catch {
            // Coupure réseau ou action serveur indisponible. Auparavant la
            // promesse rejetait, la boucle s'arrêtait et l'utilisateur restait
            // devant un écran figé sans explication. On continue à réessayer.
            consecutiveErrorsRef.current += 1;
            if (consecutiveErrorsRef.current >= 3) setConnectionIssue(true);
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= maxAttempts) {
            setTimedOut(true);
            stop();
            return;
        }
        timerRef.current = setTimeout(() => checkRef.current(), intervalMs);
    }, [checkStatus, intervalMs, maxAttempts, stop]);

    useEffect(() => {
        checkRef.current = check;
    }, [check]);

    useEffect(() => {
        onSettledRef.current = onSettled;
    }, [onSettled]);

    const start = useCallback(
        (id: string) => {
            idRef.current = id;
            attemptsRef.current = 0;
            consecutiveErrorsRef.current = 0;
            setTimedOut(false);
            setConnectionIssue(false);
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
        consecutiveErrorsRef.current = 0;
        setIsPolling(true);
        check();
    }, [check]);

    // Nettoyage à l'unmount — pas de timer qui fuit si l'utilisateur quitte la page.
    useEffect(() => stop, [stop]);

    return {
        start,
        retryNow,
        stop,
        isPolling,
        timedOut,
        status,
        connectionIssue,
    };
}
