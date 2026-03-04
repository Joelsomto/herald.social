/**
 * Herald Backend API Manual Test
 * Run this in browser console to test API endpoints
 */

const API_BASE_URL = 'https://herald-backend-6i3m.onrender.com/api/v1';

// Store test state
let testResults = {
  accessToken: null,
  userId: null,
  passed: 0,
  failed: 0,
};

// Color logging utilities
const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️ ${msg}`),
  warning: (msg) => console.warn(`⚠️ ${msg}`),
};

// Helper function to make API requests
async function apiCall(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: null, ok: false, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  log.info('Testing Health Check...');
  try {
    const response = await fetch(`${API_BASE_URL}/../health/`);
    if (response.ok || response.status === 404) {
      log.success('Backend is accessible at ' + API_BASE_URL);
      testResults.passed++;
    } else {
      log.error('Backend health check failed');
      testResults.failed++;
    }
  } catch (error) {
    log.warning('Backend may not be running or CORS issue: ' + error.message);
  }
}

async function testSignup() {
  log.info('Testing Signup...');
  const testUser = {
    email: `test${Date.now()}@herald.local`,
    password: 'TestPass123!',
    username: `testuser${Date.now()}`,
    display_name: 'Test User',
  };

  const result = await apiCall('/auth/signup/', {
    method: 'POST',
    body: testUser,
  });

  if (result.ok && result.data?.access_token) {
    testResults.accessToken = result.data.access_token;
    testResults.userId = result.data.user?.id;
    log.success('Signup successful');
    log.info('Access Token: ' + testResults.accessToken.substring(0, 20) + '...');
    testResults.passed++;
  } else {
    log.error('Signup failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

async function testSignin() {
  log.info('Testing Signin...');
  const testCreds = {
    email: 'test@herald.local',
    password: 'TestPass123!',
  };

  const result = await apiCall('/auth/signin/', {
    method: 'POST',
    body: testCreds,
  });

  if (result.ok && result.data?.access_token) {
    testResults.accessToken = result.data.access_token;
    log.success('Signin successful');
    log.info('Access Token: ' + testResults.accessToken.substring(0, 20) + '...');
    testResults.passed++;
  } else if (result.status === 401 || result.status === 404) {
    log.warning('Signin test user not found. Run testSignup() first');
  } else {
    log.error('Signin failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

async function testGetCurrentUser() {
  log.info('Testing Get Current User...');
  if (!testResults.accessToken) {
    log.warning('No access token. Run testSignup() or testSignin() first');
    return;
  }

  const result = await apiCall('/auth/users/profiles/me/', {
    token: testResults.accessToken,
  });

  if (result.ok) {
    log.success('Get current user successful');
    log.info('User: ' + JSON.stringify(result.data, null, 2));
    testResults.passed++;
  } else {
    log.error('Get current user failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

async function testGetPosts() {
  log.info('Testing Get Posts Feed...');
  const result = await apiCall('/posts/?page=1&limit=5');

  if (result.ok) {
    log.success('Get posts feed successful');
    log.info(`Retrieved ${Array.isArray(result.data?.data) ? result.data.data.length : result.data?.length || 0} posts`);
    testResults.passed++;
  } else {
    log.error('Get posts failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

async function testGetWallet() {
  log.info('Testing Get Wallet...');
  if (!testResults.accessToken) {
    log.warning('No access token. Run testSignup() or testSignin() first');
    return;
  }

  const result = await apiCall('/wallets/me/', {
    token: testResults.accessToken,
  });

  if (result.ok) {
    log.success('Get wallet successful');
    log.info('Wallet: ' + JSON.stringify(result.data, null, 2));
    testResults.passed++;
  } else {
    log.error('Get wallet failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

async function testCreatePost() {
  log.info('Testing Create Post...');
  if (!testResults.accessToken) {
    log.warning('No access token. Run testSignup() or testSignin() first');
    return;
  }

  const result = await apiCall('/posts/', {
    method: 'POST',
    token: testResults.accessToken,
    body: { content: 'Test post from API integration test' },
  });

  if (result.ok || result.status === 201) {
    log.success('Create post successful');
    log.info('Post: ' + JSON.stringify(result.data, null, 2));
    testResults.passed++;
  } else {
    log.error('Create post failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

async function testGetCommunities() {
  log.info('Testing Get Communities...');
  const result = await apiCall('/communities/?page=1&limit=5');

  if (result.ok) {
    log.success('Get communities successful');
    log.info(`Retrieved ${Array.isArray(result.data?.data) ? result.data.data.length : result.data?.length || 0} communities`);
    testResults.passed++;
  } else {
    log.error('Get communities failed: ' + JSON.stringify(result.data));
    testResults.failed++;
  }
}

// Run all tests
async function runAllTests() {
  console.clear();
  log.info('🚀 Starting Herald Backend API Tests');
  log.info(`Backend: ${API_BASE_URL}\n`);

  await testHealthCheck();
  await testSignup();
  await testGetCurrentUser();
  await testGetPosts();
  await testGetWallet();
  await testCreatePost();
  await testGetCommunities();

  // Summary
  console.log('\n' + '='.repeat(50));
  log.info('Test Summary:');
  log.success(`Passed: ${testResults.passed}`);
  log.error(`Failed: ${testResults.failed}`);
  console.log('='.repeat(50) + '\n');

  log.info('Test Results stored in: testResults');
  log.info('To run individual tests, call:');
  log.info('  testHealthCheck()');
  log.info('  testSignup()');
  log.info('  testSignin()');
  log.info('  testGetCurrentUser()');
  log.info('  testGetPosts()');
  log.info('  testGetWallet()');
  log.info('  testCreatePost()');
  log.info('  testGetCommunities()');
}

// Export for console
window.apiTest = {
  runAllTests,
  testHealthCheck,
  testSignup,
  testSignin,
  testGetCurrentUser,
  testGetPosts,
  testGetWallet,
  testCreatePost,
  testGetCommunities,
  testResults,
  apiCall,
};

log.success('API Test utilities loaded!');
log.info('Run: apiTest.runAllTests() to test all endpoints');
log.info('Or run individual tests like: apiTest.testSignup()');
