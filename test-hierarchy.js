const http = require('http');

// Test if hierarchy endpoint works
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/prof/hierarchy',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n✓ API Response (parsed):');
      console.log(JSON.stringify(parsed, null, 2).substring(0, 1000));
      if (JSON.stringify(parsed).length > 1000) {
        console.log('... (truncated)');
      }
    } catch (e) {
      console.log('\nRaw Response:');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error(`problem with request: ${error.message}`);
});

req.end();
