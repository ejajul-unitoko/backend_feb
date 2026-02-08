
# 🔹 PHASE 1.2 — BUSINESS, BRANCH & BRANCH USERS (FOUNDATION)

---

## 1️⃣ PERSONAS (WHO TOUCHES BUSINESS SYSTEM)

### 🟨 UTB — Business Owner (Primary Persona)

* Logs in using **universal users table**
* Registers business
* Uploads legal documents
* Creates branches (optional)
* Assigns branch managers
* Has **100% access always**

---

### 🟨 UTB — Branch Manager (Delegated Persona)

* Created by owner
* Gets **email + password** set by owner
* Can manage **only assigned branch**
* Cannot edit business-level info

---

### 🟦 UTA — Admin (Verifier)

* Verifies business KYC
* Approves / rejects documents
* Can suspend business

---

### 🟪 UTC — Customer

* Sees business **only after approval**
* Shops from branch under market

---

## 2️⃣ BUSINESS REGISTRATION — LEGAL POV (INDIA)

For **India-compliant onboarding (V1)**, these are **minimum required**:

### Mandatory (V1)

* Business Name (Legal)
* Business Type

  * Proprietorship
  * Partnership
  * LLP
  * Private Limited
* PAN (Business / Proprietor)
* GSTIN (Optional but recommended)
* Registered Address
* Owner Name
* Owner PAN
* Bank Account Details (later phase, can be optional in V1)
* Shop Logo
* Shop Images
* Business Proof Document (any one):

  * GST Certificate
  * Shop Act License
  * Udyam Registration
  * Trade License

✅ **V1 rule**: At least **ONE valid document** required.

---

## 3️⃣ CORE RELATIONSHIP MODEL (VERY IMPORTANT)

### DO NOT MIX THESE:

* User ≠ Business ≠ Branch

### Correct hierarchy:

```
User (Owner)
   ↓
Business
   ↓
Branches (0..N)
   ↓
Branch Users (Managers / Staff)
```

* One **user** can own **multiple businesses**
* One **business** can have **multiple branches**
* One **branch** can have **multiple users**
* Owner bypasses branch restriction

This is exactly how Zomato / Swiggy do it.

---

## 4️⃣ EDGE CASES (REAL-WORLD, NOT THEORY)

### ⚠️ Edge Case 1: Individual seller, no branch

**Example:** Home-based seller

**Solution**

* Allow business without branches
* Auto-create **virtual default branch**
* Mark it as `is_primary = true`

---

### ⚠️ Edge Case 2: Same user opens UTB twice

**Example:** Owner logs in again

**Solution**

* Check: `does user already own a business?`
* If yes → redirect to dashboard
* If no → show registration flow

---

### ⚠️ Edge Case 3: Owner assigns wrong email to branch manager

**Example:** Typo email

**Solution**

* Branch user remains `pending`
* Activation only after first login
* Owner can revoke & recreate

---

### ⚠️ Edge Case 4: Business rejected in verification

**Example:** Fake GST

**Solution**

* Status = `rejected`
* Reason stored
* Owner can re-upload documents

---

### ⚠️ Edge Case 5: Owner wants full access always

**Requirement:** Owner must override branch limits

**Solution**

* Owner role is **business-level**, not branch-level
* Owner bypasses `branch_users` checks

---

### ⚠️ Edge Case 6: Business operates in multiple markets

**Example:** Seller serves Karol Bagh + Lajpat Nagar

**Solution**

* Many-to-many mapping: `business_markets`
* Branches inherit market unless overridden

---

## 5️⃣ DESIGN DECISIONS (WHY THIS ARCHITECTURE WORKS)

| Problem        | Decision                |
| -------------- | ----------------------- |
| Universal user | Use `users` table only  |
| Branch RBAC    | `branch_users` table    |
| Owner override | Business-level role     |
| KYC lifecycle  | Business status machine |
| Market linkage | Separate mapping table  |
| Media uploads  | `media_assets` reuse    |

---

## 6️⃣ DATABASE SCHEMA (SQL)

### 🟨 `businesses`

```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    owner_user_id UUID NOT NULL REFERENCES users(id),

    -- Identity
    legal_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    business_type TEXT NOT NULL
        CHECK (business_type IN ('proprietorship', 'partnership', 'llp', 'private_limited')),

    -- Legal
    pan TEXT NOT NULL,
    gstin TEXT,
    registered_address TEXT NOT NULL,

    -- Verification
    kyc_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_remarks TEXT,

    -- Media
    logo_media_id UUID REFERENCES media_assets(id),

    -- Status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 🟨 `business_markets`

```sql
CREATE TABLE business_markets (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    PRIMARY KEY (business_id, market_id)
);
```

---

### 🟨 `branches`

```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    address TEXT NOT NULL,

    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),

    is_primary BOOLEAN DEFAULT false,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 🟨 `branch_users`

```sql
CREATE TABLE branch_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role TEXT NOT NULL
        CHECK (role IN ('owner', 'manager', 'staff')),

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (branch_id, user_id)
);
```

---

## 7️⃣ UTB FLOW — END TO END (REALISTIC)

### STEP 1: Login (Already Built)

```
POST /auth/login
app_type = utb
```

---

### STEP 2: Check business existence

```
GET /utb/business
```

* If exists → dashboard
* Else → registration form

---

### STEP 3: Register Business

```
POST /utb/business
```

* Save business
* Upload documents (media_assets)
* Map markets

---

### STEP 4: Add Branch (Optional)

```
POST /utb/branches
```

* If skipped → auto-create default branch

---

### STEP 5: Assign Branch Manager

```
POST /utb/branches/:id/users
```

* Owner provides email + password
* User created if not exists
* Role assigned

---

### STEP 6: Verification

* Business shows:

  * 🟡 Pending
  * 🟢 Approved
  * 🔴 Rejected

Admin approves via UTA.

---

## 8️⃣ WHAT THIS UNLOCKS NEXT

Once this is done:

✅ UTC can:

* Browse shops under market
* View branches

✅ UTB can:

* Fully manage shop
* Prepare for inventory

✅ UTA can:

* Verify businesses
* Control marketplace trust

