"use client"; // Une limite d'erreur doit être un Client Component

/**
 * Erreur au niveau du layout racine — remplace tout le document.
 *
 * Next indique que cette page rend son propre document sans les styles globaux
 * de l'app : le thème applicatif (classe `.dark`) ne l'atteint pas. Les styles
 * sont donc en ligne et suivent le thème système via `color-scheme`.
 */
export default function GlobalError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    return (
        <html lang="fr">
            <body
                style={{
                    colorScheme: "light dark",
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                    fontFamily:
                        "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    textAlign: "center",
                }}
            >
                <title>Erreur — Benin Events</title>

                <main style={{ maxWidth: "28rem" }}>
                    <h1
                        style={{
                            fontSize: "1.75rem",
                            fontWeight: 700,
                            marginBottom: "0.75rem",
                        }}
                    >
                        Une erreur inattendue est survenue
                    </h1>

                    <p
                        style={{
                            fontSize: "0.9rem",
                            opacity: 0.7,
                            lineHeight: 1.6,
                            marginBottom: "1.5rem",
                        }}
                    >
                        Le site n&apos;a pas pu se charger correctement.
                        Réessayez, ou revenez dans quelques instants.
                    </p>

                    <button
                        onClick={() => unstable_retry()}
                        style={{
                            cursor: "pointer",
                            borderRadius: "0.625rem",
                            border: "1px solid currentColor",
                            background: "transparent",
                            color: "inherit",
                            padding: "0.6rem 1.5rem",
                            font: "inherit",
                            fontWeight: 600,
                        }}
                    >
                        Réessayer
                    </button>

                    {error.digest && (
                        <p
                            style={{
                                fontSize: "0.7rem",
                                opacity: 0.5,
                                marginTop: "1.5rem",
                            }}
                        >
                            Code d&apos;erreur : {error.digest}
                        </p>
                    )}
                </main>
            </body>
        </html>
    );
}
