-- Migration: Fix message unread counter
-- This migration creates triggers to automatically update the unread_count in message_threads

-- Function to increment unread count when a new message is inserted
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Determine who the recipient is (not the sender)
  SELECT CASE 
    WHEN NEW.sender_id = mt.tenant_id THEN mt.landlord_id
    ELSE mt.tenant_id
  END INTO recipient_id
  FROM message_threads mt
  WHERE mt.id = NEW.thread_id;

  -- Increment unread count for the thread
  UPDATE message_threads
  SET 
    unread_count = COALESCE(unread_count, 0) + 1,
    last_message = NEW.body,
    updated_at = NEW.created_at
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset unread count when messages are marked as read
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a message is marked as read (read_at is set), decrement the counter
  IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
    UPDATE message_threads
    SET unread_count = GREATEST(COALESCE(unread_count, 0) - 1, 0)
    WHERE id = NEW.thread_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS messages_increment_unread ON messages;
DROP TRIGGER IF EXISTS messages_decrement_unread ON messages;

-- Create trigger for incrementing unread count on new messages
CREATE TRIGGER messages_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Create trigger for decrementing unread count when messages are read
CREATE TRIGGER messages_decrement_unread
  AFTER UPDATE ON messages
  FOR EACH ROW
  WHEN (OLD.read_at IS DISTINCT FROM NEW.read_at)
  EXECUTE FUNCTION reset_unread_count();

-- Initialize unread_count for existing threads (set to 0 if null)
UPDATE message_threads
SET unread_count = 0
WHERE unread_count IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_sender ON messages(thread_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;
