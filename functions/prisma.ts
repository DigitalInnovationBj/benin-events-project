import { PrismaClient } from "@/lib/generated/prisma";

export const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
    errorFormat: "pretty",
});