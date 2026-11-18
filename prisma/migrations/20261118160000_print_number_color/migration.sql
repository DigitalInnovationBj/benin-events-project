-- Couleur du numéro sur les billets imprimés (noir ou blanc selon le visuel).
ALTER TABLE "Ticket" ADD COLUMN "printNumberColor" TEXT NOT NULL DEFAULT 'dark';

-- Compteur des numéros imprimés : un numéro annulé n'est jamais réattribué.
ALTER TABLE "Ticket" ADD COLUMN "printSerialSeq" INTEGER NOT NULL DEFAULT 0;
UPDATE "Ticket" t SET "printSerialSeq" = s.max_serial
FROM (SELECT "ticketId", MAX("serial") AS max_serial FROM "OrderItem" WHERE "serial" IS NOT NULL GROUP BY "ticketId") s
WHERE s."ticketId" = t.id;
