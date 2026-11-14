-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('FEEXPAY', 'GENIUSPAY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'FEEXPAY';
