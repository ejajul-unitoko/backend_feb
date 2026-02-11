
# 🔹 ADDRESS MASTER SYSTEM (FOUNDATION LAYER)

> One address system
> Used by **Business, Branch, Customer, Rider, Orders, Delivery**

---

## 1️⃣ WHY ADDRESS MUST BE A MASTER (NOT EMBEDDED)

### ❌ Bad approach (what many apps do)

* `business.address`
* `branch.address`
* `customer.address`
* `rider.address`

This causes:

* Duplication
* Inconsistent formats
* Impossible geo-queries
* Painful delivery logic

### ✅ Correct approach (what you’re doing)

* One **`addresses` master table**
* Everything else **references it**

This is how Swiggy, Amazon, Uber design it.

---

## 2️⃣ PERSONAS WHO USE ADDRESS

### 🟨 Business Owner

* Registered business address (legal)
* Branch addresses (operational)

---

### 🟪 Customer

* Saved delivery addresses
* Multiple addresses
* Default address

---

### 🟧 Rider

* Home address
* Vehicle pickup hub (future)

---

### 🟦 Admin

* Verification
* Fraud checks
* Geo analysis

---

## 3️⃣ ADDRESS TYPES (IMPORTANT)

Address is **not just text**, it has **purpose**.

### Supported address purposes (V1)

* `business_registered`
* `branch_location`
* `customer_delivery`
* `rider_home`
* `warehouse` (future-safe)

We’ll enforce this via enum-like checks.

---

## 4️⃣ REAL-WORLD EDGE CASES (INTERNET-GRADE)

### ⚠️ Edge Case 1: Same address used in multiple places

**Example:**
Business registered address = primary branch

✅ **Solution**

* One address row
* Referenced by:

  * `business.address_id`
  * `branches.address_id`

---

### ⚠️ Edge Case 2: Customer enters messy address

**Example:**
“near temple behind red shop”

✅ **Solution**

* Split fields:

  * address_line_1
  * landmark (optional)
* Free-text allowed, but structured fields preserved

---

### ⚠️ Edge Case 3: Address without coordinates

**Example:**
GPS not available

✅ **Solution**

* `latitude` / `longitude` nullable
* Mandatory only for delivery assignment later

---

### ⚠️ Edge Case 4: Address deletion

**Example:**
Customer deletes saved address

✅ **Solution**

* Soft delete (`deleted_at`)
* Never hard delete (orders depend on it)

---

### ⚠️ Edge Case 5: Same user has multiple addresses

**Expected behavior**

✅ **Solution**

* Address is **not unique per user**
* Mapping tables decide ownership

---

## 5️⃣ CORE DESIGN DECISIONS

| Decision                | Reason               |
| ----------------------- | -------------------- |
| Separate address entity | Reusability          |
| Purpose field           | Context awareness    |
| Geo fields              | Delivery, distance   |
| Soft delete             | Order history safety |
| Country/state fields    | Legal & tax          |

---

## 6️⃣ ADDRESS MASTER — SQL SCHEMA

This is **production-safe and extensible**.

```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership (who added it)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Purpose of address
    purpose TEXT NOT NULL
        CHECK (purpose IN (
            'business_registered',
            'branch_location',
            'customer_delivery',
            'rider_home',
            'warehouse'
        )),

    -- Address details
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark TEXT,

    city TEXT NOT NULL DEFAULT 'Delhi',
    district TEXT,
    state TEXT NOT NULL DEFAULT 'Delhi',
    country TEXT NOT NULL DEFAULT 'India',
    pincode TEXT NOT NULL,

    -- Geo-coordinates
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),

    -- Flags
    is_default BOOLEAN DEFAULT false,

    -- Lifecycle
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_pincode ON addresses(pincode);
```

---

## 7️⃣ HOW IT MAPS TO OTHER TABLES (CRUCIAL)

### Business

```sql
ALTER TABLE businesses
ADD COLUMN registered_address_id UUID
REFERENCES addresses(id);
```

---

### Branch

```sql
ALTER TABLE branches
ADD COLUMN address_id UUID
REFERENCES addresses(id);
```

---

### Customer (future)

```sql
-- No direct column
-- Customer addresses are queried via addresses.user_id + purpose
```

---

### Rider (future)

```sql
-- Same approach
-- purpose = 'rider_home'
```

---

### Orders (future – VERY IMPORTANT)

```sql
order_delivery_address_id → addresses.id
```

This ensures:

* Orders remain immutable
* Address edits don’t affect past orders

---

## 8️⃣ FLOWS — HOW ADDRESS IS CREATED & USED

---

### 🟨 Business Registration Flow

1. Owner fills registered address form
2. Backend:

   * Creates `addresses` row (`purpose = business_registered`)
3. Business row references `address_id`

---

### 🟨 Branch Creation Flow

1. Owner enters branch address
2. Backend:

   * Creates `addresses` row (`purpose = branch_location`)
3. Branch references it

---

### 🟪 Customer Flow (Later)

* Customer adds address
* `purpose = customer_delivery`
* `is_default = true/false`

---

## 9️⃣ WHY THIS SOLVES FUTURE PROBLEMS

This single table enables:

✅ Delivery radius logic
✅ Nearest branch detection
✅ Rider assignment
✅ Legal audits
✅ Address reuse
✅ Clean order history

You’ve now built a **geo-capable foundation**.

---

