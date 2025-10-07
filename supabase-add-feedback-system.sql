-- Create feedback system for player and organizer reviews
-- This allows organizers to review players and players to review organizers after events

-- Create feedback types enum
CREATE TYPE feedback_type AS ENUM ('praise', 'report');
CREATE TYPE feedback_target AS ENUM ('player', 'organizer');

-- Feedback categories for players (from organizer)
CREATE TYPE player_report_category AS ENUM (
  'no_show',           -- Nie pojawił się
  'late',              -- Spóźnienie (>15 min)
  'vulgar',            -- Wulgarność/Agresja
  'bad_fair_play',     -- Zły fair play
  'left_early'         -- Wyszedł wcześniej przed końcem
);

CREATE TYPE player_praise_category AS ENUM (
  'mvp',               -- MVP meczu
  'team_player',       -- Gracz zespołowy
  'positive_energy',   -- Pozytywna energia
  'fair_play',         -- Fair play
  'helpful'            -- Pomocny w organizacji
);

-- Feedback categories for organizers (from players)
CREATE TYPE organizer_report_category AS ENUM (
  'poor_organization', -- Źle zorganizowane
  'payment_issues',    -- Problemy z płatnością/rozliczeniem
  'bad_time_mgmt',     -- Złe zarządzanie czasem
  'no_communication',  -- Brak komunikacji
  'unprofessional'     -- Nieprofesjonalne zachowanie
);

CREATE TYPE organizer_praise_category AS ENUM (
  'great_organization', -- Świetna organizacja
  'good_communication', -- Dobra komunikacja
  'provided_equipment', -- Zapewnił sprzęt
  'fair_teams',         -- Sprawiedliwe drużyny
  'friendly_atmosphere',-- Przyjazna atmosfera
  'punctual'            -- Punktualność
);

-- Main feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  feedback_type feedback_type NOT NULL,
  feedback_target feedback_target NOT NULL,

  -- Category (stored as text for flexibility)
  category TEXT NOT NULL,

  -- Optional comment
  comment TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT no_self_feedback CHECK (from_user_id != to_user_id),
  CONSTRAINT one_feedback_per_user_per_event UNIQUE (event_id, from_user_id, to_user_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_feedback_event ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_from_user ON event_feedback(from_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_to_user ON event_feedback(to_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_target ON event_feedback(feedback_target);

-- Function to check if user participated in event
CREATE OR REPLACE FUNCTION user_participated_in_event(p_user_id UUID, p_event_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM participants
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND payment_status = 'succeeded'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user organized event
CREATE OR REPLACE FUNCTION user_organized_event(p_user_id UUID, p_event_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
      AND organizer_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if event has ended
CREATE OR REPLACE FUNCTION event_has_ended(p_event_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  event_end_time TIMESTAMP;
BEGIN
  SELECT end_time INTO event_end_time
  FROM events
  WHERE id = p_event_id;

  RETURN event_end_time IS NOT NULL AND event_end_time < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for event_feedback table
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback they gave or received
CREATE POLICY "Users can view their own feedback"
  ON event_feedback FOR SELECT
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

-- Users can insert feedback if:
-- 1. Event has ended
-- 2. They participated in the event OR organized it
-- 3. Target user participated in the event (if giving feedback to player)
-- 4. Target user organized the event (if giving feedback to organizer)
CREATE POLICY "Users can give feedback after event"
  ON event_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id AND
    event_has_ended(event_id) AND
    (
      -- Organizer giving feedback to player
      (feedback_target = 'player' AND
       user_organized_event(auth.uid(), event_id) AND
       user_participated_in_event(to_user_id, event_id))
      OR
      -- Player giving feedback to organizer
      (feedback_target = 'organizer' AND
       user_participated_in_event(auth.uid(), event_id) AND
       user_organized_event(to_user_id, event_id))
    )
  );

-- Only allow updates within 48 hours of creation
CREATE POLICY "Users can update feedback within 48h"
  ON event_feedback FOR UPDATE
  USING (
    auth.uid() = from_user_id AND
    created_at > NOW() - INTERVAL '48 hours'
  );

-- Users can delete their own feedback within 48 hours
CREATE POLICY "Users can delete feedback within 48h"
  ON event_feedback FOR DELETE
  USING (
    auth.uid() = from_user_id AND
    created_at > NOW() - INTERVAL '48 hours'
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON event_feedback TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE event_feedback_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE event_feedback IS 'Stores feedback (praise and reports) between players and organizers after events';
