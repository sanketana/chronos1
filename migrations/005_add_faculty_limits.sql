-- Migration: 005_add_faculty_limits.sql
-- Description: Add min_faculty and max_faculty columns to events table for configurable faculty preferences
-- This replaces the minPreferences stored in available_slots JSONB with dedicated columns

-- Add the new columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS min_faculty INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS max_faculty INTEGER DEFAULT 5;

-- Add constraints to ensure valid values
ALTER TABLE events 
ADD CONSTRAINT check_min_faculty_positive CHECK (min_faculty > 0),
ADD CONSTRAINT check_max_faculty_positive CHECK (max_faculty > 0),
ADD CONSTRAINT check_max_greater_than_min CHECK (max_faculty >= min_faculty);

-- Migrate existing minPreferences data from available_slots JSONB to min_faculty column
UPDATE events 
SET min_faculty = COALESCE(
    CASE 
        WHEN available_slots IS NOT NULL AND jsonb_typeof(available_slots) = 'object' 
        THEN (available_slots->>'minPreferences')::INTEGER
        ELSE NULL 
    END, 
    3
)
WHERE available_slots IS NOT NULL;

-- Clean up available_slots JSONB to remove minPreferences (keep only slots)
UPDATE events 
SET available_slots = jsonb_build_object('slots', available_slots->'slots')
WHERE available_slots IS NOT NULL 
  AND jsonb_typeof(available_slots) = 'object' 
  AND available_slots ? 'minPreferences';

-- Add index for better performance on faculty limit queries
CREATE INDEX IF NOT EXISTS idx_events_faculty_limits ON events(min_faculty, max_faculty);
