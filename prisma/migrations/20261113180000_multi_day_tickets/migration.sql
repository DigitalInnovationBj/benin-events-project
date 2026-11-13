-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "alsoValidForEventId" TEXT,
ADD COLUMN     "validDays" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "TicketScan" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketScan_orderItemId_day_eventId_key" ON "TicketScan"("orderItemId", "day", "eventId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_alsoValidForEventId_fkey" FOREIGN KEY ("alsoValidForEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketScan" ADD CONSTRAINT "TicketScan_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
