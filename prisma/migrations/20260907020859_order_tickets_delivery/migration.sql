-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ticketsSendError" TEXT,
ADD COLUMN     "ticketsSentAt" TIMESTAMP(3);
