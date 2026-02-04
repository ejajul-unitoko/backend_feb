import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/auth';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_USER_BASE = {
    name: 'Scoped User',
    email: TEST_EMAIL,
    password: 'Password123!',
    phone: `+1${Date.now()}`
};

async function testAuthFlow() {
    console.log('--- Starting Auth Flow Test (Scoped Identity) ---');

    try {
        // 1. Register in UTC
        console.log(`\n1. Registering in UTC: ${TEST_EMAIL}`);
        const regUtcRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-app-type': 'utc' 
            },
            body: JSON.stringify(TEST_USER_BASE)
        });
        const utcData = await regUtcRes.json();
        if (!regUtcRes.ok) throw new Error(`UTC Registration failed: ${JSON.stringify(utcData)}`);
        console.log('✅ UTC Registration successful');
        console.log('   User ID:', utcData.user.id);

        // 2. Register SAME EMAIL in UTB (Should Succeed now!)
        console.log(`\n2. Registering SAME EMAIL in UTB: ${TEST_EMAIL}`);
        const regUtbRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-app-type': 'utb' // Different scope!
            },
            body: JSON.stringify(TEST_USER_BASE)
        });
        const utbData = await regUtbRes.json();
        
        if (!regUtbRes.ok) throw new Error(`UTB Registration failed: ${JSON.stringify(utbData)}`);
        console.log('✅ UTB Registration successful (Separate Account Created)');
        console.log('   User ID:', utbData.user.id);

        if (utcData.user.id === utbData.user.id) throw new Error('❌ Error: User IDs should be different!');
        console.log('✅ Verified: User IDs are unique per app.');

        // 3. Login to UTC
        console.log('\n3. Logging into UTC');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-app-type': 'utc'
            },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_USER_BASE.password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('UTC Login failed');
        console.log('✅ UTC Login successful');

        // 4. Try Login to UTB with WRONG Scope Header (Should fail or treated as different user)
        // Actually, if we send 'utc' header but try to log in user that only exists in 'utb', it would fail.
        // But here we have users in both.
        // Let's just verify we get the correct user back.
        if (loginData.user.id !== utcData.user.id) throw new Error('❌ Login returned wrong user ID');

        console.log('\n--- Test Passed Successfully ---');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        process.exit(1);
    }
}

testAuthFlow();
