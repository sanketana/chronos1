-- Migration script to upgrade existing admin to superadmin
-- Run this script to upgrade the current admin user to superadmin role

-- First, let's see what admin users exist
SELECT id, name, email, role FROM users WHERE role = 'admin';

-- Update the first admin user to superadmin role
-- You may want to run this manually for the specific admin you want to upgrade
UPDATE users 
SET role = 'superadmin' 
WHERE role = 'admin' 
AND id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Verify the change
SELECT id, name, email, role FROM users WHERE role IN ('admin', 'superadmin'); 