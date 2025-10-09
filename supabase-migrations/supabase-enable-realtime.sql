-- Enable Realtime for chat_messages table
-- Run this in Supabase SQL Editor if chat messages are not appearing in real-time

-- Enable realtime publication for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Verify it's enabled (should show chat_messages in the list)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- If you need to disable it later (for debugging):
-- ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;
