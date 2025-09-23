/*
  Warnings:

  - You are about to drop the column `maxTickets` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `eventDateId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `qrcode` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `name` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PURCHASE_STATUT" AS ENUM ('PENDING', 'CANCELLED', 'CONFIRMED');

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_eventDateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_userId_fkey";

-- DropIndex
DROP INDEX "public"."Ticket_code_key";

-- DropIndex
DROP INDEX "public"."Ticket_eventId_userId_key";

-- DropIndex
DROP INDEX "public"."Ticket_qrcode_key";

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "maxTickets";

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "code",
DROP COLUMN "eventDateId",
DROP COLUMN "purchaseDate",
DROP COLUMN "qrcode",
DROP COLUMN "userId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Purchase" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qrcode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "statut" "public"."PURCHASE_STATUT" NOT NULL DEFAULT 'PENDING',
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_qrcode_key" ON "public"."Purchase"("qrcode");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_code_key" ON "public"."Purchase"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_eventId_userId_key" ON "public"."Purchase"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "public"."Event"("slug");

-- AddForeignKey
ALTER TABLE "public"."Purchase" ADD CONSTRAINT "Purchase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase" ADD CONSTRAINT "Purchase_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "public"."EventDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
