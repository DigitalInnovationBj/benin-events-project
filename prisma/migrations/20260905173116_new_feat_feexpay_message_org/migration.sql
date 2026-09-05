/*
  Warnings:

  - You are about to drop the column `checkoutUrl` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `geniuspayId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `checkoutUrl` on the `PlatformPayment` table. All the data in the column will be lost.
  - You are about to drop the column `geniuspayId` on the `PlatformPayment` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `PlatformPayment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerReference]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerReference]` on the table `PlatformPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PlatformPayment_reference_key";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "postPurchaseMessage" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "checkoutUrl",
DROP COLUMN "geniuspayId",
ADD COLUMN     "payerNetwork" TEXT,
ADD COLUMN     "payerPhone" TEXT,
ADD COLUMN     "providerReference" TEXT;

-- AlterTable
ALTER TABLE "PlatformPayment" DROP COLUMN "checkoutUrl",
DROP COLUMN "geniuspayId",
DROP COLUMN "reference",
ADD COLUMN     "payerNetwork" TEXT,
ADD COLUMN     "payerPhone" TEXT,
ADD COLUMN     "providerReference" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Order_providerReference_key" ON "Order"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPayment_providerReference_key" ON "PlatformPayment"("providerReference");
