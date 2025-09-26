-- Migration: 004_add_updated_at_to_meetings.sql
-- Description: Add updated_at column to meetings table and create trigger

-- Add updated_at column to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at for meetings
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();






