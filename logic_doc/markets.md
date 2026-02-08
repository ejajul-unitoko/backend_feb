
# 🔹 PHASE 1.1 — MARKET SYSTEM (DELHI ONLY, V1)

## 1️⃣ PERSONAS (IMPORTANT BEFORE SCHEMA)

### 🟦 UTA — Admin (Market Controller)

* Creates markets
* Enables / disables markets
* Decides **what a “market” means**
* No buying/selling

---

### 🟪 UTC — Customer (Public Viewer)

* Can see markets **without login**
* Can browse shops & products
* Must login **only at checkout**

---

### 🟨 UTB — Business / Seller

* Registers business (later)
* Selects **one or more markets**
* Lists shop under a market

---

### 🟧 UTD — Delivery

* **No direct interaction** with markets (important)

---

## 2️⃣ WHAT IS A “MARKET” IN UNITOKO?

In Unitoko (V1):

> **A Market = A real-world commercial cluster**

* Chandni Chowk
* Lajpat Nagar
* Karol Bagh
* Sarojini Nagar

### Market properties:

* Belongs to **one city (Delhi for now)**
* Contains **many businesses**
* Used for:

  * Discovery
  * Delivery radius
  * Seller onboarding
  * Search filtering

---

## 3️⃣ CORE PROBLEMS MARKET MUST SOLVE

### Problem A

❌ “How does customer browse shops by area?”

✅ Market acts as **top-level entry point**

---

### Problem B

❌ “How do sellers say where they operate?”

✅ Seller links their business to **one or more markets**

---

### Problem C

❌ “How do we keep this public but controlled?”

✅ Market is **public-readable**, **admin-writable**

---

### Problem D

❌ “How do we search markets quickly?”

✅ Searchable by:

* Name
* Slug
* Keywords

---

## 4️⃣ EDGE CASES (VERY IMPORTANT)

### ⚠️ Edge Case 1: Market visible but no sellers

**Example:** New market added but no shops yet

**Solution:**

* Market can exist with `business_count = 0`
* UTC shows “Coming soon”

---

### ⚠️ Edge Case 2: Seller chooses wrong market

**Example:** Seller in Karol Bagh selects Lajpat Nagar

**Solution (V1):**

* Admin approval required later at business onboarding
* Market is **not auto-verified**

---

### ⚠️ Edge Case 3: Market renamed

**Example:** “South Delhi Market” → “Lajpat Nagar”

**Solution:**

* Use immutable `slug`
* Name can change, slug should not

---

### ⚠️ Edge Case 4: Market disabled

**Example:** Admin wants to pause a market

**Solution:**

* `status = inactive`
* UTC hides it
* UTB cannot select it

---

### ⚠️ Edge Case 5: No login browsing

**Requirement:** Public visibility

**Solution:**

* Market API is **public GET**
* Shopping/cart requires login later

---

## 5️⃣ MARKET TABLE — SQL SCHEMA (V1)

This is **clean, future-proof, and minimal**.

```sql
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
```

---

## 6️⃣ LOGIC & FLOWS (CRYSTAL CLEAR)

---

## 🟦 ADMIN FLOW — “ADD A MARKET”

**Endpoint**

```
POST /uta/markets
```

**Permission**

```
markets:create
```

**Flow**

1. Admin enters:

   * name
   * description
   * coordinates (optional)
2. Backend:

   * Generates slug (`slugify(name)`)
   * Validates uniqueness
3. Insert into `markets`
4. Market becomes visible to UTC instantly (if `is_public = true`)

✅ **Problem solved:** Controlled creation

---

## 🟪 CUSTOMER FLOW — “SEE MARKETS” (NO LOGIN)

**Endpoint**

```
GET /public/markets?city=Delhi
```

**Query rules**

* `status = 'active'`
* `is_public = true`

**Response**

```json
[
  {
    "id": "uuid",
    "name": "Chandni Chowk",
    "slug": "chandni-chowk"
  }
]
```

✅ **Problem solved:** Public discovery

---

## 🟪 CUSTOMER FLOW — “SEARCH MARKET”

**Endpoint**

```
GET /public/markets/search?q=chandni
```

**SQL logic**

```sql
SELECT id, name, slug
FROM markets
WHERE is_public = true
  AND status = 'active'
  AND to_tsvector('english', name) @@ plainto_tsquery('english', $1)
ORDER BY name;
```

✅ **Problem solved:** Fast search bar

---

## 🟨 SELLER FLOW — “SELECT MARKET” (PREVIEW)

> Seller does NOT create market.

**Endpoint**

```
GET /utb/markets
```

Same data as public, but:

* Excludes inactive markets
* Includes market ID for linking

Later:

* Seller links **business → market** (next step)

✅ **Problem solved:** Seller onboarding

---

## 7️⃣ HOW THIS FITS YOUR EXISTING USER SYSTEM

IMPORTANT POINT YOU RAISED 👇

> “we have made the user table not specific business table”

### That is CORRECT.

* `markets` **DO NOT belong to users**
* `businesses` (next step) will belong to users
* `business_markets` (junction table) will connect them

You did **the right thing** by not mixing user & business.

---

## 8️⃣ WHAT MARKET UNLOCKS IMMEDIATELY

Once this exists:

✅ UTC can:

* Open app
* See Delhi markets
* Search markets

✅ UTB can:

* Choose market during onboarding


