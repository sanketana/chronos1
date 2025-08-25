-- Migration: 003_create_default_superadmin.sql
-- Description: Create default superadmin user with specific credentials
-- This migration ensures a default superadmin user exists for initial access

-- Create default superadmin user with specific credentials
-- Email: admin@chronos.edu
-- Password: chronos2024!
-- This user will be created only if no superadmin exists

DO $$
BEGIN
    -- Check if any superadmin exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin') THEN
        -- Insert the default superadmin user
        INSERT INTO users (name, email, department, role, status, password, created_at, updated_at)
        VALUES (
            'System Administrator',
            'admin@chronos.edu',
            'Information Technology',
            'superadmin',
            'active',
            'chronos2024!',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Default superadmin user created: admin@chronos.edu';
    ELSE
        RAISE NOTICE 'Superadmin user already exists, skipping default user creation';
    END IF;
END $$;

-- Verify the superadmin user was created (for logging purposes)
SELECT 
    name, 
    email, 
    role, 
    status, 
    created_at 
FROM users 
WHERE role = 'superadmin' 
ORDER BY created_at DESC 
LIMIT 1; 