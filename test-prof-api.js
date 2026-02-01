// Test script to verify professor hierarchy API
const fetch = require('node-fetch');

async function testProfHierarchy() {
  try {
    // Login first to get session
    const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'prof@classetrack.com',
        password: 'Prof@12345',
      }),
    });

    console.log('Login response:', loginRes.status);

    // Now test the hierarchy endpoint
    const hierRes = await fetch('http://localhost:3000/api/prof/hierarchy', {
      method: 'GET',
      headers: {
        'Cookie': loginRes.headers.get('set-cookie') || '',
      },
    });

    console.log('Hierarchy response:', hierRes.status);
    const data = await hierRes.json();
    console.log('Hierarchy data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProfHierarchy();
