/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Purchase" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_reference_key" ON "public"."Purchase"("reference");
