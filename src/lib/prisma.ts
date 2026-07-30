import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon (serverless) coupe les connexions inactives après ~5 min :
    // on recycle les nôtres avant, sinon le pool réutilise des connexions
    // mortes → "Connection terminated unexpectedly".
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    max: 5,
});

// Une connexion tuée par Neon pendant qu'elle est idle émet une erreur
// au niveau du pool : sans handler, Node crashe (unhandled 'error' event).
pool.on("error", (err) => {
    console.error("[prisma] Connexion du pool perdue :", err.message);
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        // "query" en dev uniquement : en production, ces logs polluent
        // Vercel et ralentissent chaque requête.
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
