-- Soccer Organizer: Chat, Enhanced Profiles, and Notifications
-- This migration adds chat functionality, enhanced user profiles, and notification preferences

-- ============================================================================
-- 1. ENHANCED USER PROFILES
-- ============================================================================

-- Add skill level and position preferences to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS position_preference TEXT CHECK (position_preference IN ('goalkeeper', 'defender', 'midfielder', 'forward', 'any')),
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_rate NUMERIC(3,2) DEFAULT 1.00 CHECK (on_time_rate >= 0 AND on_time_rate <= 1),
ADD COLUMN IF NOT EXISTS preferred_cities TEXT[] DEFAULT '{}';

-- Add indexes for filtering by skill and position
CREATE INDEX IF NOT EXISTS idx_users_skill_level ON users(skill_level);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position_preference);

COMMENT ON COLUMN users.skill_level IS 'Player skill level for team balancing';
COMMENT ON COLUMN users.position_preference IS 'Preferred playing position';
COMMENT ON COLUMN users.games_played IS 'Total number of games participated in';
COMMENT ON COLUMN users.on_time_rate IS 'Percentage of times user arrived on time (1.0 = 100%)';
COMMENT ON COLUMN users.preferred_cities IS 'Cities user wants notifications for';

-- ============================================================================
-- 2. CHAT SYSTEM
-- ============================================================================

-- Chat messages table for event discussions
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 1000),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for fast chat retrieval
CREATE INDEX IF NOT EXISTS idx_chat_event_id ON chat_messages(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_messages(user_id);

-- Add chat_enabled flag to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON TABLE chat_messages IS 'Real-time chat messages for event participants';
COMMENT ON COLUMN chat_messages.message IS 'Chat message content (max 1000 characters)';
COMMENT ON COLUMN chat_messages.is_deleted IS 'Soft delete flag for message removal';

-- ============================================================================
-- 3. NOTIFICATION SYSTEM
-- ============================================================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_event_reminder BOOLEAN DEFAULT TRUE,
  email_event_cancelled BOOLEAN DEFAULT TRUE,
  email_new_events BOOLEAN DEFAULT FALSE,
  email_feedback_received BOOLEAN DEFAULT TRUE,
  reminder_hours_before INTEGER DEFAULT 24 CHECK (reminder_hours_before >= 1 AND reminder_hours_before <= 168),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_notification_preferences IS 'User preferences for email notifications';
COMMENT ON COLUMN user_notification_preferences.reminder_hours_before IS 'Hours before event to send reminder (default 24h)';

-- Notification log for tracking sent emails
CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('event_reminder', 'event_cancelled', 'new_event', 'feedback_received')),
  sent_at TIMESTAMP DEFAULT NOW(),
  email_to TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced'))
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_event ON notification_log(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type, sent_at DESC);

COMMENT ON TABLE notification_log IS 'Audit log of all sent notifications';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
-- Users can read messages if they are participants in the event
CREATE POLICY "Users can read chat if participant"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.event_id = chat_messages.event_id
        AND participants.user_id = auth.uid()
        AND participants.payment_status = 'succeeded'
    )
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = chat_messages.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Users can insert messages if they are participants
CREATE POLICY "Participants can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND
    (
      EXISTS (
        SELECT 1 FROM participants
        WHERE participants.event_id = chat_messages.event_id
          AND participants.user_id = auth.uid()
          AND participants.payment_status = 'succeeded'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = chat_messages.event_id
          AND events.organizer_id = auth.uid()
      )
    )
  );

-- Users can update/delete their own messages
CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification Log Policies (read-only for users)
CREATE POLICY "Users can view own notification log"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update games_played count
CREATE OR REPLACE FUNCTION increment_games_played()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count if payment succeeded and user_id exists
  IF NEW.payment_status = 'succeeded' AND NEW.user_id IS NOT NULL THEN
    UPDATE users
    SET games_played = games_played + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment games_played when participant pays
CREATE TRIGGER trigger_increment_games_played
AFTER INSERT ON participants
FOR EACH ROW
EXECUTE FUNCTION increment_games_played();

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification preferences for new users
CREATE TRIGGER trigger_create_notification_prefs
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_prefs();

-- Function to update chat message timestamp on edit
CREATE OR REPLACE FUNCTION update_chat_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating message timestamp
CREATE TRIGGER trigger_update_chat_timestamp
BEFORE UPDATE ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_message_timestamp();

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can access event chat
CREATE OR REPLACE FUNCTION user_can_access_chat(p_user_id UUID, p_event_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM participants
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND payment_status = 'succeeded'
  ) OR EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
      AND organizer_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_chat_count(p_user_id UUID)
RETURNS TABLE (
  event_id INTEGER,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.event_id,
    COUNT(*)::BIGINT as unread_count
  FROM chat_messages cm
  WHERE cm.event_id IN (
    SELECT p.event_id
    FROM participants p
    WHERE p.user_id = p_user_id
      AND p.payment_status = 'succeeded'
  )
  AND cm.user_id != p_user_id
  AND cm.created_at > COALESCE(
    (SELECT last_read_at FROM user_last_read WHERE user_id = p_user_id AND event_id = cm.event_id),
    '1970-01-01'::TIMESTAMP
  )
  GROUP BY cm.event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_notification_preferences TO authenticated;
GRANT SELECT ON notification_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE chat_messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notification_log_id_seq TO authenticated;

-- ============================================================================
-- 8. INITIAL DATA SETUP
-- ============================================================================

-- Create notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new columns in users table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('skill_level', 'position_preference', 'games_played', 'on_time_rate', 'preferred_cities')
ORDER BY column_name;

-- Verify new tables
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('chat_messages', 'user_notification_preferences', 'notification_log')
ORDER BY table_name;

-- Show RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('chat_messages', 'user_notification_preferences', 'notification_log')
ORDER BY tablename, policyname;
