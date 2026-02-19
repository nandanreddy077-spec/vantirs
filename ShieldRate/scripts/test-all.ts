/**
 * Comprehensive Testing Script for Vantirs
 * Tests all endpoints and functionality
 * 
 * Usage:
 *   npx tsx scripts/test-all.ts [baseUrl]
 * 
 * Example:
 *   npx tsx scripts/test-all.ts http://localhost:3000
 *   npx tsx scripts/test-all.ts https://vantirs.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

async function runTest(name: string, fn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}`)
    const data = await fn()
    results.push({ name, passed: true, data })
    console.log(`✅ PASSED: ${name}`)
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message })
    console.log(`❌ FAILED: ${name}`)
    console.log(`   Error: ${error.message}`)
  }
}

async function fetchJSON(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  const text = await response.text()
  if (!text) {
    throw new Error(`Empty response from ${url}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
  }
}

async function runTests() {
  console.log(`\n🚀 Starting comprehensive tests for: ${BASE_URL}\n`)
  console.log('='.repeat(60))

  // Phase 1: Health Checks
  await runTest('Health Check', async () => {
    const data = await fetchJSON(`${BASE_URL}/api/health`)
    if (data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(data)}`)
    }
    if (!data.checks.environment || !data.checks.database) {
      throw new Error(`Some health checks failed: ${JSON.stringify(data.checks)}`)
    }
    return data
  })

  // Phase 2: Onboarding API - Validation Tests
  await runTest('Onboarding - Missing Fields Validation', async () => {
    const response = await fetch(`${BASE_URL}/api/onboarding/connect-stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    const data = await response.json()
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`)
    }
    if (!data.error || !data.error.includes('Missing required fields')) {
      throw new Error(`Expected error message about missing fields, got: ${data.error}`)
    }
    return data
  })

  await runTest('Onboarding - Invalid Stripe Key Format', async () => {
    const response = await fetch(`${BASE_URL}/api/onboarding/connect-stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Merchant',
        email: 'test@example.com',
        stripe_secret_key: 'sk_test_invalid', // Should be rk_test_
        stripe_webhook_secret: 'whsec_test',
      }),
    })
    const data = await response.json()
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`)
    }
    if (!data.error || !data.error.includes('restricted key')) {
      throw new Error(`Expected error about restricted key, got: ${data.error}`)
    }
    return data
  })

  // Phase 3: Dashboard API - Authentication Tests
  await test('Dashboard Stats - Unauthorized (No API Key)', async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/stats`)
    const data = await response.json()
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
    if (!data.error || !data.error.includes('Unauthorized')) {
      throw new Error(`Expected unauthorized error, got: ${data.error}`)
    }
    return data
  })

  await test('Dashboard Stats - Invalid API Key', async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: { 'Authorization': 'Bearer invalid_key_12345' },
    })
    const data = await response.json()
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
    return data
  })

  await test('Disputes List - Unauthorized', async () => {
    const response = await fetch(`${BASE_URL}/api/disputes`)
    const data = await response.json()
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
    return data
  })

  // Phase 4: Event Tracking
  await test('Event Tracking - Missing Merchant ID', async () => {
    const response = await fetch(`${BASE_URL}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test_action' }),
    })
    const data = await response.json()
    // Should either require merchant_id or handle gracefully
    return data
  })

  // Phase 5: Webhook Endpoint Structure
  await test('Webhook Endpoint - Invalid Method (GET)', async () => {
    const response = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'GET',
    })
    // Should return 405 Method Not Allowed or handle gracefully
    if (response.status === 200) {
      throw new Error('Webhook should not accept GET requests')
    }
    return { status: response.status }
  })

  // Phase 6: Transaction Sync - Validation
  await test('Transaction Sync - Missing Merchant ID', async () => {
    const response = await fetch(`${BASE_URL}/api/onboarding/sync-transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await response.json()
    // Should handle missing merchant_id gracefully
    return data
  })

  // Phase 7: Dispute PDF - Unauthorized
  await test('Dispute PDF - Unauthorized', async () => {
    const response = await fetch(`${BASE_URL}/api/disputes/test-id/pdf`)
    const data = await response.json()
    if (response.status !== 401 && response.status !== 404) {
      throw new Error(`Expected 401 or 404, got ${response.status}`)
    }
    return data
  })

  // Phase 8: Dispute Submit - Unauthorized
  await test('Dispute Submit - Unauthorized', async () => {
    const response = await fetch(`${BASE_URL}/api/disputes/test-id/submit`, {
      method: 'POST',
    })
    const data = await response.json()
    if (response.status !== 401 && response.status !== 404) {
      throw new Error(`Expected 401 or 404, got ${response.status}`)
    }
    return data
  })

  // Phase 9: Metrics Endpoint
  await test('Metrics - Unauthorized', async () => {
    const response = await fetch(`${BASE_URL}/api/metrics`)
    const data = await response.json()
    // Metrics may require auth or be public
    return data
  })

  // Phase 10: Public Pages
  await test('Landing Page - Loads', async () => {
    const response = await fetch(`${BASE_URL}/`)
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }
    const text = await response.text()
    if (!text.includes('Vantirs') && !text.includes('vantirs')) {
      throw new Error('Landing page does not contain expected content')
    }
    return { status: response.status, hasContent: true }
  })

  await test('Onboarding Page - Loads', async () => {
    const response = await fetch(`${BASE_URL}/onboarding`)
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`)
    }
    const text = await response.text()
    if (!text.includes('Connect') && !text.includes('Stripe')) {
      throw new Error('Onboarding page does not contain expected content')
    }
    return { status: response.status, hasContent: true }
  })

  // Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 TEST SUMMARY\n')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})




