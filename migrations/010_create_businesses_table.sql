-- Migration: Create businesses table
-- Description: Stores business registration data with KYC status and verification workflow
-- Dependencies: users table, media_assets table

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership (links to universal users table)
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Identity
    legal_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    business_type TEXT NOT NULL
        CHECK (business_type IN ('proprietorship', 'partnership', 'llp', 'private_limited')),
    
    -- Legal/Compliance (India V1)
    pan TEXT NOT NULL,
    gstin TEXT,  -- Optional but recommended
    registered_address TEXT NOT NULL,
    
    -- KYC Verification Workflow
    kyc_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_remarks TEXT,  -- Stores rejection reason or admin notes
    
    -- Media
    logo_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    
    -- Status Management
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_businesses_owner_user_id ON businesses(owner_user_id);
CREATE INDEX idx_businesses_kyc_status ON businesses(kyc_status);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_created_at ON businesses(created_at DESC);

-- Index for searching by business name
CREATE INDEX idx_businesses_legal_name ON businesses USING gin(to_tsvector('english', legal_name));
CREATE INDEX idx_businesses_display_name ON businesses USING gin(to_tsvector('english', display_name));

-- Comments for documentation
COMMENT ON TABLE businesses IS 'Stores business registration data for UTB (Business Owners)';
COMMENT ON COLUMN businesses.owner_user_id IS 'User who owns this business (from universal users table)';
COMMENT ON COLUMN businesses.legal_name IS 'Legal business name as per registration documents';
COMMENT ON COLUMN businesses.display_name IS 'Display name shown to customers';
COMMENT ON COLUMN businesses.business_type IS 'Type of business entity: proprietorship, partnership, llp, private_limited';
COMMENT ON COLUMN businesses.pan IS 'PAN number (business or proprietor)';
COMMENT ON COLUMN businesses.gstin IS 'GST Identification Number (optional in V1)';
COMMENT ON COLUMN businesses.kyc_status IS 'KYC verification status: pending (default), approved, rejected';
COMMENT ON COLUMN businesses.kyc_remarks IS 'Admin remarks for KYC (especially rejection reasons)';
COMMENT ON COLUMN businesses.logo_media_id IS 'Business logo (references media_assets table)';
COMMENT ON COLUMN businesses.status IS 'Business operational status: active, suspended';

-- Edge Case Handling:
-- 1. One user can own multiple businesses (no unique constraint on owner_user_id)
-- 2. ON DELETE RESTRICT prevents deleting user if they own a business
-- 3. KYC workflow: pending → approved/rejected (with remarks)
-- 4. Suspended businesses remain in DB but are hidden from customers
