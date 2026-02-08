This is the final, production-grade specification for the **Unitoko Geographic & Address System (UGAS)**. It is designed to match your specific `users` table migration style (Raw SQL) and solves all the logistics edge cases we discussed.

### Part 1: Comprehensive Engineering Specification (Edge Cases)

This document serves as the "Rule Book" for your backend logic.

#### 1. Data Integrity & Logic Rules

| Case Name | The Problem | The Solution |
| --- | --- | --- |
| **The "Non-Delivery" Trap** | User selects an admin-only Post Office (e.g., "Army Base PO") as a home address. | **Query Filter:** The API for the locality dropdown must strictly filter: `WHERE delivery_status = 'Delivery'`. |
| **The "Missing Locality"** | A new society isn't in your Pincode Directory CSV yet. User cannot save address. | **"Other" Protocol:** If user selects "Other" from the dropdown, force them to type the locality manually. Flag this address as `verification_needed: true` for Admin review. |
| **The Order History Crash** | A user deletes their "Home" address while an order is being delivered. | **Snapshot Strategy:** Never link an active order to the live address table. When an order is placed, copy the full address JSON into the `orders` table column `delivery_snapshot`. |

#### 2. User & GPS Rules

| Case Name | The Problem | The Solution |
| --- | --- | --- |
| **GPS "Border" Drift** | GPS places user in Pincode `110058` (error), but they live across the street in `110059`. | **Trust but Verify:** Pre-fill the form with GPS data but keep fields editable. If the user edits the Pincode, immediately re-fetch the State/District/Locality from the server. |
| **The Vertical World** | 500 customers in one skyscraper have the exact same Lat/Long. | **Structured Schema:** Do not use a single `address` text field. You must enforce separate columns: `house_no`, `floor`, `tower_block`. |

#### 3. System Concurrency Rules

| Case Name | The Problem | The Solution |
| --- | --- | --- |
| **Double Default Race** | User taps "Set Default" on two phones at the same exact second. | **Partial Index:** A Database Constraint `UNIQUE (user_id) WHERE is_default = true`. The database will physically reject the second request. |
| **Master Duplication** | 5 family members add the exact same address. System stores 5 duplicate rows. | **Content Hashing:** Generate a unique hash of the address fields. If a new address matches an existing hash, link the user to the *existing* `master_address_id`. |

---

### Part 2: The Database Migration (Raw SQL)

Since you provided the `users` table in SQL, here are the corresponding migrations for the Address System. Run these in order.

#### Migration 003: Create Pincode Directory (The Reference)

```sql
-- Migration 003: Create Pincode Directory
-- Description: Static reference table for all valid Indian Pincodes (loaded from your CSV)

CREATE TABLE IF NOT EXISTS pincode_directory (
    -- Composite Primary Key: A pincode can have multiple office names
    pincode TEXT NOT NULL,
    office_name TEXT NOT NULL,
    
    -- Hierarchy
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    circle TEXT NOT NULL, -- e.g. "Delhi Circle"
    
    -- Logistics Flags
    delivery_status TEXT DEFAULT 'Delivery', -- 'Delivery' or 'Non Delivery'
    is_serviceable BOOLEAN DEFAULT true,     -- Admin kill-switch for riot/flood zones
    
    -- Approximate Center Coords of the Pincode
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    PRIMARY KEY (pincode, office_name)
);

-- Index for fast dropdown search
CREATE INDEX IF NOT EXISTS idx_pincode_lookup ON pincode_directory(pincode);

```

#### Migration 004: Create Master Addresses (The Physical Places)

This table stores unique locations on Earth. If two users live in the same house, they point to the **same row** in this table.

```sql
-- Migration 004: Create Master Addresses
-- Description: Unique physical locations. Deduplicated via content_hash.

CREATE TABLE IF NOT EXISTS master_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 1. Broad Location (Validated against Pincode Directory)
    pincode TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    locality TEXT NOT NULL, -- The user selected "Office Name" or "Other"
    
    -- 2. Vertical World Structure (Crucial for Delivery)
    tower_block TEXT,        -- "Tower A", "Building 5"
    floor TEXT,              -- "5th Floor"
    house_no TEXT NOT NULL,  -- "Flat 502"
    landmark TEXT,
    
    -- 3. Coordinates (For Riders)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(10, 8),
    is_verified_coords BOOLEAN DEFAULT false, -- True if user used "Use Current Location"
    
    -- 4. Deduplication Logic
    -- Hash = MD5(pincode + locality + tower_block + house_no)
    -- This ensures we don't store the same house twice.
    content_hash TEXT UNIQUE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_geo ON master_addresses(latitude, longitude);

```

#### Migration 005: Create User Address Registry (The Link)

This connects your `users` table to the `master_addresses` table. It holds personal preferences (Home vs Work).

```sql
-- Migration 005: Create User Address Registry
-- Description: Links users to master addresses with personal labels.

CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    master_address_id UUID NOT NULL REFERENCES master_addresses(id), -- No Cascade! Preserve history.
    
    -- Personalization
    label TEXT NOT NULL, -- "Home", "Work", "Store 1"
    
    -- Recipient Details (Can differ from User Profile)
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    
    -- Status & Flags
    is_default BOOLEAN DEFAULT false,
    
    -- Standard Timestamps & Soft Delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL
);

-- CONSTRAINT: Partial Index for "Double Default" Edge Case
-- Only one "is_default=true" allowed per user, ignoring deleted addresses.
CREATE UNIQUE INDEX idx_user_unique_default 
ON user_addresses (user_id) 
WHERE is_default = TRUE AND deleted_at IS NULL;

-- Index for fetching a user's address book quickly
CREATE INDEX IF NOT EXISTS idx_user_address_lookup ON user_addresses(user_id);

```

### How to Implement the "Deduplication" Logic (Node.js/Service Layer)

When you insert an address in your backend, use this logic to generate the `content_hash`:

```javascript
const crypto = require('crypto');

function generateAddressHash(data) {
  // Normalize strings: lowercase and trim to ensure "Tower A" == "tower a "
  const rawString = `${data.pincode}-${data.locality}-${data.tower_block || ''}-${data.house_no}`.toLowerCase().trim();
  
  return crypto.createHash('md5').update(rawString).digest('hex');
}

// Service Function: Add Address
async function addUserAddress(user, addressData) {
  const hash = generateAddressHash(addressData);

  // 1. Try to find existing Master Address
  let masterAddress = await db('master_addresses').where({ content_hash: hash }).first();

  // 2. If not found, create it
  if (!masterAddress) {
    [masterAddress] = await db('master_addresses').insert({
      ...addressData,
      content_hash: hash
    }).returning('*');
  }

  // 3. Link User to this Master Address
  await db('user_addresses').insert({
    user_id: user.id,
    master_address_id: masterAddress.id,
    label: addressData.label,
    recipient_name: addressData.recipient_name,
    recipient_phone: addressData.recipient_phone,
    is_default: addressData.is_default
  });
}

```