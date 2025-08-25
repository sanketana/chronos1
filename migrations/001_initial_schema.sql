-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for Chronos application
-- Tables: users, events, availabilities, preferences, meetings, scheduler_runs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores all user types (admin, superadmin, faculty, student)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'superadmin', 'faculty', 'student')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table - stores scheduling events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    slot_len INTEGER NOT NULL, -- slot length in minutes
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'COLLECTING_AVAIL', 'SCHEDULING', 'PUBLISHED')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available_slots JSONB, -- stores available time slots as JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availabilities table - stores faculty availability for events
CREATE TABLE IF NOT EXISTS availabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    available_slots JSONB NOT NULL, -- stores available time slots as JSON array
    preferences TEXT, -- additional preferences or notes
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faculty_id, event_id)
);

-- Preferences table - stores student preferences for events
CREATE TABLE IF NOT EXISTS preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    professor_ids JSONB NOT NULL, -- stores array of professor IDs
    preferences TEXT, -- additional preferences or notes
    available_slots JSONB, -- stores available time slots as JSON array
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, event_id)
);

-- Scheduler runs table - tracks scheduler executions
CREATE TABLE IF NOT EXISTS scheduler_runs (
    id SERIAL PRIMARY KEY,
    algorithm VARCHAR(100) NOT NULL,
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    run_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT
);

-- Meetings table - stores scheduled meetings
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(50) DEFAULT 'AUTO' CHECK (source IN ('AUTO', 'MANUAL')),
    run_id INTEGER REFERENCES scheduler_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_availabilities_faculty_event ON availabilities(faculty_id, event_id);
CREATE INDEX IF NOT EXISTS idx_preferences_student_event ON preferences(student_id, event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_event_id ON meetings(event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_faculty_id ON meetings(faculty_id);
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 