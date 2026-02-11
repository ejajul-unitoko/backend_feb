-- Migration: Create branches table
-- Description: Stores branch/location data for businesses
-- Dependencies: businesses table

-- Ensure search path includes public where geo types live
SET search_path TO public, "$user";

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Business relationship
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    
    -- Geolocation (optional)
    latitude DECIMAL(9,6),  -- Range: -90 to 90
    longitude DECIMAL(9,6), -- Range: -180 to 180
    
    -- Primary branch flag
    is_primary BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
CREATE INDEX IF NOT EXISTS idx_branches_is_primary ON branches(is_primary) WHERE is_primary = true;

-- Basic index for location queries (alternative to earthdistance)
CREATE INDEX IF NOT EXISTS idx_branches_geo ON branches(latitude, longitude);

-- Comments for documentation
COMMENT ON TABLE branches IS 'Stores branch/location data for businesses';
COMMENT ON COLUMN branches.business_id IS 'Reference to parent business';
COMMENT ON COLUMN branches.name IS 'Branch name (e.g., "Main Store", "Karol Bagh Branch")';
COMMENT ON COLUMN branches.address IS 'Physical address of the branch';
COMMENT ON COLUMN branches.latitude IS 'Latitude coordinate (optional)';
COMMENT ON COLUMN branches.longitude IS 'Longitude coordinate (optional)';
COMMENT ON COLUMN branches.is_primary IS 'True if this is the primary/default branch';
COMMENT ON COLUMN branches.status IS 'Branch operational status: active, inactive';

-- Edge Case Handling:
-- 1. Edge Case 1: Individual sellers get auto-created default branch with is_primary = true
-- 2. CASCADE delete: If business is deleted, all branches are removed
-- 3. One business can have multiple branches (no unique constraint)
-- 4. Branches can be temporarily deactivated without deletion
