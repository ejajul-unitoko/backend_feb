-- Migration 003: Create sessions table
-- Description: Stores active refresh tokens and session metadata

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session Context
    app_type TEXT NOT NULL, -- uta, utb, utc, utd
    refresh_token_hash TEXT NOT NULL,
    
    -- Device Metadata
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Lifecycle
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_app ON sessions(user_id, app_type);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
