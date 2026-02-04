-- Migration 002: Create users table
-- Description: Creates the core identity table for all users

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Identity
    name TEXT,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    
    -- Status & Flags
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
    is_phone_verified BOOLEAN DEFAULT false,
    is_email_verified BOOLEAN DEFAULT false,
    
    -- Profile
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    
    -- Standard Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,

    -- Constraints
    CONSTRAINT users_phone_or_email_required CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
