-- Billets physiques : lots imprimés, activation en point de vente.

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PRINTED';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "printFrontUrl" TEXT,
ADD COLUMN "printBackUrl" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "serial" INTEGER,
ADD COLUMN "activatedAt" TIMESTAMP(3),
ADD COLUMN "activatedById" TEXT;

-- AlterTable
ALTER TABLE "EventAgent" ADD COLUMN "canScan" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "canSell" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_ticketId_serial_key" ON "OrderItem"("ticketId", "serial");

-- CreateIndex
CREATE INDEX "OrderItem_activatedById_idx" ON "OrderItem"("activatedById");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
