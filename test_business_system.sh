#!/bin/bash

# Business System Test Script
# Tests basic business registration flow

echo "🧪 Testing Business System Implementation"
echo "=========================================="
echo ""

# Base URL
BASE_URL="http://localhost:3000/api"

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/../health")
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
    echo "   Response: $HEALTH"
else
    echo "❌ Server is not responding"
    exit 1
fi
echo ""

# Test 2: Login as UTB user (you'll need to create a test user first)
echo "2️⃣  Testing UTB Login..."
echo "   (Skipping - requires test user creation)"
echo ""

# Test 3: Check if business exists
echo "3️⃣  Testing GET /api/utb/business (requires auth token)"
echo "   (Skipping - requires authentication)"
echo ""

# Test 4: Admin endpoints
echo "4️⃣  Testing Admin Endpoints..."
echo "   GET /api/admin/businesses (requires auth + RBAC)"
echo "   (Skipping - requires authentication)"
echo ""

echo "=========================================="
echo "✅ Basic connectivity test passed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Create a UTB test user via /api/auth/register"
echo "   2. Login and get JWT token"
echo "   3. Test business registration with token"
echo "   4. Verify auto-created default branch"
echo "   5. Test admin KYC verification"
echo ""
echo "📚 See walkthrough.md for full API documentation"
