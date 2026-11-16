-- CreateEnum
CREATE TYPE "TicketSort" AS ENUM ('PRICE_ASC', 'PRICE_DESC', 'CUSTOM');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "ticketSort" "TicketSort" NOT NULL DEFAULT 'PRICE_ASC';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Positions initiales : prix croissant au sein de chaque évènement, pour qu'un
-- passage en ordre personnalisé parte de l'affichage actuel.
UPDATE "Ticket" t
SET "position" = ranked.rn
FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "eventId" ORDER BY "price" ASC, "createdAt" ASC) - 1 AS rn
    FROM "Ticket"
) ranked
WHERE t."id" = ranked."id";
