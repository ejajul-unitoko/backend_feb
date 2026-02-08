-- Migration: Create Markets Table
-- Purpose: Store real-world commercial clusters (markets) for Unitoko V1
-- Scope: Delhi only for V1, expandable for future cities

CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,                    -- "Chandni Chowk"
    slug TEXT NOT NULL UNIQUE,             -- "chandni-chowk"
    description TEXT,

    -- Geography (Delhi-only for now)
    city TEXT NOT NULL DEFAULT 'Delhi',
    state TEXT NOT NULL DEFAULT 'Delhi',
    country TEXT NOT NULL DEFAULT 'India',

    -- Coordinates (for delivery & distance later)
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),

    -- Status & Visibility
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    is_public BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    created_by UUID REFERENCES users(id),  -- Admin who created it

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for search & performance
CREATE INDEX idx_markets_name ON markets USING gin (to_tsvector('english', name));
CREATE INDEX idx_markets_slug ON markets (slug);
CREATE INDEX idx_markets_city ON markets (city);
CREATE INDEX idx_markets_status ON markets (status) WHERE status = 'active';
