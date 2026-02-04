-- Migration 007: Create media_assets table
-- Description: Stores metadata for uploaded files

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for finding user's uploads
CREATE INDEX IF NOT EXISTS idx_media_user ON media_assets(user_id);
