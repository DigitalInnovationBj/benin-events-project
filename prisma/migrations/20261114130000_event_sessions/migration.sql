-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_alsoValidForEventId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "alsoValidForEventId";

-- DropIndex
DROP INDEX "TicketScan_orderItemId_day_eventId_key";

-- AlterTable
ALTER TABLE "TicketScan" ADD COLUMN     "checkpoint" TEXT NOT NULL DEFAULT 'main';

-- CreateTable
CREATE TABLE "EventSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketSession" (
    "ticketId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "TicketSession_pkey" PRIMARY KEY ("ticketId","sessionId")
);

-- CreateIndex
CREATE INDEX "EventSession_eventId_idx" ON "EventSession"("eventId");

-- CreateIndex
CREATE INDEX "TicketSession_sessionId_idx" ON "TicketSession"("sessionId");

-- Les scans enregistrés pour l'ancien accès « autre évènement » deviennent
-- des doublons (même billet, même jour, point « main ») : on garde le premier.
DELETE FROM "TicketScan" a
USING "TicketScan" b
WHERE a."orderItemId" = b."orderItemId"
  AND a."day" = b."day"
  AND a."scannedAt" > b."scannedAt";

-- CreateIndex
CREATE UNIQUE INDEX "TicketScan_orderItemId_day_checkpoint_key" ON "TicketScan"("orderItemId", "day", "checkpoint");

-- AddForeignKey
ALTER TABLE "EventSession" ADD CONSTRAINT "EventSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSession" ADD CONSTRAINT "TicketSession_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketSession" ADD CONSTRAINT "TicketSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EventSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
