-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "city" TEXT;

-- CreateIndex
CREATE INDEX "Event_city_idx" ON "Event"("city");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");
