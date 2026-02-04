import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/auth';
const TEST_EMAIL = `rbac_test_${Date.now()}@example.com`;
const TEST_PASS = 'Password123!';

async function testRbacFlow() {
    console.log('--- Starting RBAC Verification ---');

    try {
        // 1. Register as Customer (UTC)
        console.log(`\n1. Registering Customer (UTC): ${TEST_EMAIL}`);
        const utcRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-app-type': 'utc' },
            body: JSON.stringify({ name: 'Customer', email: TEST_EMAIL, password: TEST_PASS, phone: `+1${Date.now()}` })
        });
        const utcData = await utcRes.json();
        
        if (!utcRes.ok) throw new Error(`UTC Register Failed: ${JSON.stringify(utcData)}`);
        
        console.log('✅ UTC Registration Success');
        console.log('   Roles:', utcData.roles);
        console.log('   Permissions:', utcData.permissions);

        if (!utcData.roles.includes('customer')) throw new Error('Missing customer role');
        if (!utcData.permissions.includes('orders:create')) throw new Error('Missing orders:create permission');

        // 2. Register SAME EMAIL as Business Owner (UTB)
        console.log(`\n2. Registering Business Owner (UTB): ${TEST_EMAIL}`);
        const utbRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-app-type': 'utb' },
            body: JSON.stringify({ name: 'Owner', email: TEST_EMAIL, password: TEST_PASS, phone: `+1${Date.now()}` })
        });
        const utbData = await utbRes.json();

        if (!utbRes.ok) throw new Error(`UTB Register Failed: ${JSON.stringify(utbData)}`);

        console.log('✅ UTB Registration Success');
        console.log('   Roles:', utbData.roles);
        console.log('   Permissions:', utbData.permissions);

        if (!utbData.roles.includes('business_owner')) throw new Error('Missing business_owner role');
        if (!utbData.permissions.includes('staff:manage')) throw new Error('Missing staff:manage permission');

        // 3. Verify Scope Isolation (Login to UTC, ensure no UTB perms)
        console.log('\n3. Verifying Scope Isolation (Login UTC)');
        const loginUtc = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-app-type': 'utc' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS })
        });
        const loginUtcData = await loginUtc.json();
        
        if (loginUtcData.permissions.includes('staff:manage')) {
            throw new Error('FAILED: UTC user has UTB permission (staff:manage)!');
        }
        console.log('✅ Isolation Verified: UTC user does NOT have UTB permissions.');

        console.log('\n--- RBAC Test Passed Successfully ---');

    } catch (error) {
        console.error('\n❌ RBAC Test Failed:', error.message);
        process.exit(1);
    }
}

testRbacFlow();
