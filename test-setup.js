// Test script to verify API connection
// Run this in browser console after building and deploying

console.log('🧪 Testing Primus Client Setup...');

// Test API base URL
const apiBase = localStorage.getItem("primus_api_base") || "https://primusadmin.in";
console.log('📍 API Base URL:', apiBase);

// Test API connectivity
async function testAPI() {
  try {
    console.log('🔗 Testing API connectivity...');
    const response = await fetch(`${apiBase}/`);
    const data = await response.json();
    console.log('✅ API is reachable:', data);
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return false;
  }
}

// Test authentication endpoints
async function testAuthEndpoints() {
  try {
    console.log('🔐 Testing auth endpoints...');
    
    // Test registration endpoint (should return 400 for empty data)
    const registerResponse = await fetch(`${apiBase}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log('📝 Registration endpoint:', registerResponse.status);
    
    // Test login endpoint (should return 401 for empty data)
    const loginResponse = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=&password='
    });
    console.log('🔑 Login endpoint:', loginResponse.status);
    
    return true;
  } catch (error) {
    console.error('❌ Auth endpoints test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting tests...');
  
  const apiTest = await testAPI();
  const authTest = await testAuthEndpoints();
  
  if (apiTest && authTest) {
    console.log('🎉 All tests passed! Your setup is ready.');
    console.log('📋 Next steps:');
    console.log('1. Visit primustech.in');
    console.log('2. Try registering a new account');
    console.log('3. Try logging in with the account');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}

// Export for manual testing
window.testPrimusSetup = runTests;

console.log('💡 Run testPrimusSetup() in console to test your setup');
