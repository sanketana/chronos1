-- Migration: 002_add_superadmin_support.sql
-- Description: Add superadmin role support and create initial superadmin user
-- This migration ensures the superadmin role is properly supported

-- Update the users table to ensure superadmin role is allowed
-- (This is already handled in the initial schema, but adding for clarity)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'superadmin', 'faculty', 'student'));

-- Note: Default superadmin user creation moved to migration 003
-- This migration only handles role constraint updates

-- Add any additional indexes that might be useful for superadmin functionality
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at); 