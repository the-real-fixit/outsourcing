-- DropIndex
DROP INDEX "Message_createdAt_idx";

-- CreateIndex
CREATE INDEX "Chat_user2Id_idx" ON "Chat"("user2Id");

-- CreateIndex
CREATE INDEX "Message_user1Id_user2Id_createdAt_idx" ON "Message"("user1Id", "user2Id", "createdAt");
