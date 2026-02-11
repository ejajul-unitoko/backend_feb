-- Migration 020: Implement Customer Management System
-- Description: Updates users and addresses tables, creates customer_profiles and data access logs for world-class customer management.

BEGIN;

-- 1. Update Users Table
-- Add is_temporary and additional flags
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;

-- Update status check constraint to include 'blocked', 'suspended', 'temporary'
-- We use a DO block to find and drop the existing anonymous check constraint on the status column
DO $$
DECLARE
    cn TEXT;
BEGIN
    FOR cn IN 
        SELECT conname 
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'users'::regclass 
        AND att.attname = 'status' 
        AND con.contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || cn;
    END LOOP;
END $$;

ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled', 'pending', 'blocked', 'suspended', 'temporary'));

-- 2. Update Addresses Table
-- Add label and upgrade GPS precision
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Home' 
CHECK (label IN ('Home', 'Work', 'Other', 'Default'));

-- Upgrade precision for GPS
ALTER TABLE addresses 
ALTER COLUMN latitude TYPE DECIMAL(10,8),
ALTER COLUMN longitude TYPE DECIMAL(11,8);

-- Add unique index for default address per user (only one active default)
DROP INDEX IF EXISTS unique_default_address_per_user;
CREATE UNIQUE INDEX unique_default_address_per_user
ON addresses(user_id)
WHERE is_default = true AND deleted_at IS NULL;

-- 3. Create Customer Profiles Table
CREATE TABLE IF NOT EXISTS customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    avatar_media_id UUID REFERENCES media_assets(id),
    
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    
    preferred_language TEXT DEFAULT 'en',
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "sms": true, "push": true}',
    
    -- Metrics
    total_orders_count INT NOT NULL DEFAULT 0,
    total_spend DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    
    -- Customer lifecycle
    customer_tier TEXT DEFAULT 'new' 
        CHECK (customer_tier IN ('new', 'regular', 'vip', 'premium')),
    
    -- Risk / fraud
    risk_score INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add generated column for average order value (Postgres 12+)
ALTER TABLE customer_profiles 
ADD COLUMN average_order_value DECIMAL(14,2) 
GENERATED ALWAYS AS (CASE WHEN total_orders_count > 0 THEN total_spend / total_orders_count ELSE 0 END) STORED;

-- 4. Create Access Logs Table (Privacy & Security for GDPR/PII)
CREATE TABLE IF NOT EXISTS customer_data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_by_user_id UUID REFERENCES users(id),
    customer_user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id), 
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_tier ON customer_profiles(customer_tier);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_spend ON customer_profiles(total_spend);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_verified ON customer_profiles(is_verified);

COMMIT;
