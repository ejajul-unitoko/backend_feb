-- Migration 021: Implement Rider Management System
-- Description: Creates rider_profiles and access logs for delivery partner management.

BEGIN;

-- 1. Create Rider Profiles Table
CREATE TABLE IF NOT EXISTS rider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional Profile
    avatar_media_id UUID REFERENCES media_assets(id),
    
    -- Vehicle Details
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bicycle', 'bike', 'scooter', 'ev', 'other')),
    vehicle_number TEXT, -- e.g., DL 01 AB 1234
    
    -- Documentation (KYC)
    driving_license_number TEXT,
    license_expiry DATE,
    dl_media_id UUID REFERENCES media_assets(id), -- Image/Doc of DL
    
    -- Operational State
    work_status TEXT DEFAULT 'offline'
        CHECK (work_status IN ('online', 'offline', 'busy', 'suspended')),
    
    -- GPS & Location (Last Known)
    last_latitude DECIMAL(10,8),
    last_longitude DECIMAL(11,8),
    last_location_at TIMESTAMPTZ,
    
    -- Ratings & Metrics
    total_deliveries INT DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0,
    
    -- Status
    kyc_status TEXT DEFAULT 'pending'
        CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_remarks TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Rider Data Access Logs (Privacy Audit for UTB/UTA)
CREATE TABLE IF NOT EXISTS rider_data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_by_user_id UUID REFERENCES users(id),
    rider_user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id), -- Context if UTB accessed it
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_rider_profiles_status ON rider_profiles(work_status);
CREATE INDEX IF NOT EXISTS idx_rider_profiles_kyc ON rider_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_rider_profiles_vehicle ON rider_profiles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_rider_location ON rider_profiles(last_latitude, last_longitude);

COMMIT;
