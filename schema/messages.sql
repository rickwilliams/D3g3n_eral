-- Messages table for storing chat messages
CREATE TABLE messages (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "userId" UUID REFERENCES accounts("id"),
    "roomId" UUID REFERENCES rooms("id"),
    CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms("id") ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX idx_messages_room ON messages("roomId");
CREATE INDEX idx_messages_user ON messages("userId");
CREATE INDEX idx_messages_created_at ON messages("createdAt");
