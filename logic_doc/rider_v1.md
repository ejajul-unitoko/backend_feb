
# 🏍️ RIDER MANAGEMENT SYSTEM (UTD - DELIVERY PARTNER)

This document outlines the architecture for the **UniToko Delivery App (UTD)**, focusing on Rider Profiles, KYC, and Operational Status.

---

## 1️⃣ CORE PERSONAS & VISIBILITY

### 🏍️ UTD — Rider (The Human Partner)
* Logs in via **Universal Users Table** (`scope = 'utd'`).
* **Identity**: Authenticates via Phone OTP for field-ready access.
* **Profile**: Manages vehicle details, license info, and bank details.
* **Status**: Toggles between `online` (ready for tasks), `offline`, and `busy`.

### 🟨 UTB — Business / Branch Staff
* **Limited Access**: Can only see the Rider's **Name and Phone** once the rider has accepted the order for pickup.
* **Purpose**: To coordinate the handoff of the package at the branch.

### 🟪 UTC — Customer
* **Safety First**: Can see the Rider's **Name, Photo, and Phone** only after the order is "Out for Delivery".
* **PII Protection**: Rider's phone number should ideally be masked/proxied via the app.

### 🟦 UTA — Admin
* Full KYC verification control.
* Can suspend riders for policy violations or poor ratings.

---

## 2️⃣ RELATIONAL ARCHITECTURE

1. **`users` (Identity)**: Core account credentials.
2. **`rider_profiles` (Professional Info)**: (New) Stores vehicle and legal data.
3. **`addresses` (Home/Hub)**: Stores the rider's home location for payout/legal compliance.

---

## 3️⃣ DATABASE SCHEMA (UPGRADED DESIGN)

### 🏍️ 3.1 `rider_profiles` (The Operational Core)

```sql
CREATE TABLE rider_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional Profile
    avatar_media_id UUID REFERENCES media_assets(id),
    
    -- Vehicle Details
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bicycle', 'bike', 'scooter', 'ev', 'other')),
    vehicle_number TEXT, -- e.g., DL 01 AB 1234
    
    -- Documentation (KYC)
    driving_license_number TEXT,
    license_expiry DATE,
    dl_media_id UUID REFERENCES media_assets(id), -- Image of DL
    
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
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 4️⃣ RIDER WORKFLOW (THE "REAL APP" EXPERIENCE)

### 🔄 A. Onboarding & KYC
1. **Signup**: User registers with `scope = 'utd'` via OTP.
2. **Profile Creation**: Rider enters Name and Vehicle Type.
3. **KYC Upload**: Rider uploads photos of Driving License (DL) via `media_assets`.
4. **Admin Approval**: Rider state is `pending` until UTA verifies documents.

### 🔄 B. Going Online
1. Rider toggles "Go Online".
2. System checks: `kyc_status == 'approved'`.
3. If OK -> `work_status` becomes `online`.
4. Rider starts broadcasting GPS location to the server.

### 🔄 C. Order Assignment
1. Order is ready at Branch A.
2. System broadcasts to nearest `online` riders.
3. Once accepted -> `work_status` = `busy`.

---

## 5️⃣ REAL-WORLD EDGE CASES (WORLD-CLASS DESIGN)

### ⚠️ Edge Case 1: License Expiry
**Problem**: Rider's license expires while they are an active partner.
✅ **Solution**: Automated script checks `license_expiry` daily. If expired, `work_status` is force-updated to `suspended` and rider is notified to re-upload.

### ⚠️ Edge Case 2: Vehicle Swap
**Problem**: Rider changes from a Petrol Bike to an EV.
✅ **Solution**: Rider must update vehicle number. If the category changes (e.g., Bicycle to Bike), it triggers a minor re-verification of DL.

### ⚠️ Edge Case 3: Offline with a Package
**Problem**: Rider's phone battery dies or they accidentally toggle offline while carrying a customer's order.
✅ **Solution**: The system prevents toggling `offline` if there is an active/accepted delivery task associated with the `user_id`.

### ⚠️ Edge Case 4: GPS Latency
**Problem**: Rider is in a basement (no signal).
✅ **Solution**: The app cache stores timestamps. If `last_location_at` is older than 5 minutes, the rider is automatically marked as "Inactive/Away" to prevent assigning them new orders.

---

## 6️⃣ SECURITY & PII DATA POLICY

1. **Isolation**: Rider data is NEVER mixed with Customer metadata.
2. **Access Logging**: Like the Customer system, every time UTB (Business) views Rider info, the access is logged in `rider_data_access_logs`.
3. **Self-Service**: Riders can edit standard details (Name, Profile Pic) but **cannot** edit verified details (License Number, Pincode) once approved without a re-verification flow.

---

# 8️⃣ ADMIN (UTA) CRUD & OVERSIGHT

The Admin Panel (UTA) is the master control for the rider fleet.

### 🎮 A. Fleet Management
* **List/Search**: View all riders across the system with filters for `vehicle_type`, `kyc_status`, and `work_status`.
* **Deep Dive**: View a rider's full history, including total deliveries, average ratings, and GPS history.
* **Manual Overrides**: Admins can manually update a rider's `kyc_status` or `work_status` in case of disputes or support tickets.

### 🎮 B. KYC Approval Flow
* Admins see a queue of "Pending" riders.
* Verify the uploaded Driving License (DL) against the text data.
* Approve/Reject with remarks.

---

# 9️⃣ RIDER (UTD) SELF-SERVICE

Riders have control over their professional identity but with safety guardrails.

### 🔄 A. Standard Profile Edits (Self-Service)
* **Standard Fields**: `avatar`, `preferred_language`, `phone` (with OTP).
* **Vehicle Info**: Can update vehicle number (triggers a "Self-Declaration" log).

### 🔄 B. Sensitive Edits (Restricted)
* **Fields**: `driving_license_number`, `vehicle_type`.
* **Logic**: Changing these fields resets the `kyc_status` to `pending`. The rider remains restricted from taking new orders until an Admin (UTA) re-approves the updated details.

---

# 🔟 IMPLEMENTATION STEPS (MAPPING TO BACKEND)

### 1. Database Layer
* Create `rider_profiles` table (`021_create_rider_profiles.sql`).
* Create `rider_data_access_logs` for tracking UTB/UTA lookups.

### 2. Endpoints (UTD - Rider)
* `GET /api/utd/profile` -> View own stats and details.
* `PATCH /api/utd/profile` -> Update standard details.
* `PATCH /api/utd/status` -> Toggle `online`/`offline`.

### 3. Endpoints (UTA - Admin)
* `GET /api/admin/riders` -> List all riders.
* `GET /api/admin/riders/:id` -> Detailed view.
* `PATCH /api/admin/riders/:id` -> Full CRUD for support.
* `POST /api/admin/riders/:id/verify` -> KYC Approval.

### 4. Endpoints (UTB - Business)
* `GET /api/utb/riders/:id` -> Limited view (Name/Phone) for arrivals.

---
