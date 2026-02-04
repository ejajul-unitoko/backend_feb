-- Migration 004: Add scope to users table
-- Description: Adds scope column and updates unique constraints for multi-app support

-- 1. Add scope column
ALTER TABLE users 
ADD COLUMN scope TEXT NOT NULL DEFAULT 'public';

-- 2. Drop old global constraints
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_email_key,
DROP CONSTRAINT IF EXISTS users_phone_key;

-- 3. Add new composite constraints
-- Email must be unique PER SCOPE
CREATE UNIQUE INDEX idx_users_email_scope ON users(email, scope);

-- Phone must be unique PER SCOPE (if not null)
CREATE UNIQUE INDEX idx_users_phone_scope ON users(phone, scope);

-- 4. Make scope explicitly checked
ALTER TABLE users
ADD CONSTRAINT check_users_scope CHECK (scope IN ('uta', 'utb', 'utc', 'utd', 'public'));
