-- Billets imprimés recto seul : plus de visuel verso.
ALTER TABLE "Ticket" DROP COLUMN "printBackUrl";

-- Code imprimé choisi par l'organisateur (STD-1J-0001…), unique dans l'évènement.
ALTER TABLE "Ticket" ADD COLUMN "printCode" TEXT;
CREATE UNIQUE INDEX "Ticket_eventId_printCode_key" ON "Ticket"("eventId", "printCode");

-- Billet donnant accès uniquement à ses sessions (ex. Pass Ecotourisme).
ALTER TABLE "Ticket" ADD COLUMN "sessionOnly" BOOLEAN NOT NULL DEFAULT false;
