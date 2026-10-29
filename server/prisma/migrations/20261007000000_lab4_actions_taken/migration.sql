-- Lab 4: additive Action Taken history and dashboard indexes.
-- No existing Lab 1-3 rows are rewritten or deleted by this migration.

CREATE TABLE "ActionTaken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "performedById" INTEGER NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNote" TEXT,
    "attachmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTaken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionTaken_ticketId_actionDateTime_idx"
    ON "ActionTaken"("ticketId", "actionDateTime");
CREATE INDEX "ActionTaken_performedById_actionDateTime_idx"
    ON "ActionTaken"("performedById", "actionDateTime");

ALTER TABLE "ActionTaken"
    ADD CONSTRAINT "ActionTaken_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionTaken"
    ADD CONSTRAINT "ActionTaken_performedById_fkey"
    FOREIGN KEY ("performedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Ticket_requesterId_updatedAt_idx"
    ON "Ticket"("requesterId", "updatedAt");
CREATE INDEX "Ticket_ownerId_idx"
    ON "Ticket"("ownerId");
CREATE INDEX "Ticket_currentStatus_updatedAt_idx"
    ON "Ticket"("currentStatus", "updatedAt");
CREATE INDEX "Ticket_itPriority_idx"
    ON "Ticket"("itPriority");
CREATE INDEX "Ticket_createdAt_idx"
    ON "Ticket"("createdAt");
