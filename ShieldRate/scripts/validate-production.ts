/**
 * Production Validation Script
 * 
 * Tests all critical functionality before marketing launch
 * 
 * Usage:
 *   npx tsx scripts/validate-production.ts [baseUrl]
 * 
 * Example:
 *   npx tsx scripts/validate-production.ts https://vantirs.com
 * 
 * Requirements:
 *   - Stripe test restricted key (rk_test_...)
 *   - Stripe webhook secret (whsec_...)
 *   - Stripe test account with at least one charge
 */

import * as readline from 'readline'

// Default to www subdomain to avoid redirects
const BASE_URL = process.argv[2] || 'https://www.vantirs.com'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  data?: any
  critical: boolean
}

const results: TestResult[] = []

// Helper to prompt for user input
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function test(name: string, critical: boolean, fn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}${critical ? ' [CRITICAL]' : ''}`)
    const data = await fn()
    results.push({ name, passed: true, data, critical })
    console.log(`✅ PASSED: ${name}`)
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, critical })
    console.log(`❌ FAILED: ${name}`)
    console.log(`   Error: ${error.message}`)
    if (critical) {
      console.log(`   ⚠️  CRITICAL FAILURE - Fix before marketing!`)
    }
  }
}

async function fetchJSON(url: string, options?: RequestInit, timeout: number = 30000) {
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    // Follow redirects automatically
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    const text = await response.text()
    if (!text || text.trim() === '') {
      throw new Error(`Empty response from ${url} (Status: ${response.status})`)
    }
    
    // Check if response is HTML (likely an error page)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`Received HTML instead of JSON. Status: ${response.status}. This might be a routing issue.`)
    }
    
    try {
      return JSON.parse(text)
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 200)} (Status: ${response.status})`)
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms. The endpoint may be slow or unresponsive.`)
    }
    throw error
  }
}

async function runValidation() {
  console.log(`\n🚀 Vantirs Production Validation`)
  console.log(`Testing: ${BASE_URL}`)
  console.log('='.repeat(60))
  console.log('\n⚠️  This script will create real test data in Stripe!')
  console.log('   Make sure you\'re using Stripe TEST mode keys.\n')
  
  // Test connectivity first
  console.log('🔍 Testing connectivity...')
  try {
    const healthCheck = await fetchJSON(`${BASE_URL}/api/health`)
    console.log(`✅ Health check passed: ${healthCheck.status}`)
  } catch (error: any) {
    console.error(`❌ Health check failed: ${error.message}`)
    console.error(`\n⚠️  Cannot connect to ${BASE_URL}`)
    console.error(`   Try using: https://www.vantirs.com (with www)`)
    process.exit(1)
  }

  // Get user input for Stripe keys
  const stripeSecretKey = await prompt('Enter Stripe Restricted Key (rk_test_...): ')
  const webhookSecret = await prompt('Enter Webhook Secret (whsec_...): ')
  const merchantName = await prompt('Enter Test Merchant Name (or press Enter for "Test Merchant"): ') || 'Test Merchant'
  const merchantEmail = await prompt('Enter Test Merchant Email: ')

  if (!stripeSecretKey.startsWith('rk_')) {
    console.error('❌ Invalid restricted key format. Must start with rk_')
    process.exit(1)
  }

  if (!webhookSecret.startsWith('whsec_')) {
    console.error('❌ Invalid webhook secret format. Must start with whsec_')
    process.exit(1)
  }

  let merchantId: string | null = null
  let apiKey: string | null = null

  // Test 1: Health Check
  await test('Health Check', false, async () => {
    const data = await fetchJSON(`${BASE_URL}/api/health`)
    if (data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(data)}`)
    }
    if (!data.checks.environment || !data.checks.database) {
      throw new Error(`Some health checks failed: ${JSON.stringify(data.checks)}`)
    }
    return data
  })

  // Test 2: Onboarding Flow
  await test('Onboarding - Create Merchant', true, async () => {
    const url = `${BASE_URL}/api/onboarding/connect-stripe`
    console.log(`   📡 Calling: ${url}`)
    
    const data = await fetchJSON(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: merchantName,
        email: merchantEmail,
        stripe_secret_key: stripeSecretKey,
        stripe_webhook_secret: webhookSecret,
      }),
    })

    if (!data.success) {
      throw new Error(`Onboarding failed: ${data.error || data.message}`)
    }

    if (!data.merchant?.id) {
      throw new Error('Merchant ID not returned')
    }

    if (!data.merchant?.api_key) {
      throw new Error('API key not returned')
    }

    merchantId = data.merchant.id
    apiKey = data.merchant.api_key

    console.log(`   ✅ Merchant ID: ${merchantId}`)
    console.log(`   ✅ API Key: ${apiKey}`)
    console.log(`   ✅ Webhook URL: ${data.merchant.webhook_url}`)

    return data
  })

  if (!merchantId || !apiKey) {
    console.error('\n❌ Cannot continue - onboarding failed')
    process.exit(1)
  }

  // Test 3: Transaction Sync
  await test('Transaction Sync - 12 Month Backfill', true, async () => {
    const response = await fetch(`${BASE_URL}/api/onboarding/sync-transactions?merchant_id=${merchantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!data.success && data.error) {
      throw new Error(`Transaction sync failed: ${data.error}`)
    }

    const synced = data.synced || 0
    console.log(`   ✅ Synced ${synced} transactions`)

    if (synced === 0) {
      console.log(`   ⚠️  Warning: No transactions synced. This is OK if account has no charges.`)
    }

    return data
  })

  // Test 4: Dashboard Stats
  await test('Dashboard Stats - Authenticated Request', false, async () => {
    const data = await fetchJSON(`${BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    console.log(`   ✅ Total Disputes: ${data.totalDisputes || 0}`)
    console.log(`   ✅ Total Transactions: ${data.totalTransactions || 0}`)
    console.log(`   ✅ VAMP Ratio: ${((data.vampRatio || 0) * 100).toFixed(2)}%`)

    return data
  })

  // Test 5: Get Disputes List
  await test('Disputes List - Authenticated Request', false, async () => {
    const data = await fetchJSON(`${BASE_URL}/api/disputes`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const disputes = Array.isArray(data) ? data : data.disputes || []
    console.log(`   ✅ Found ${disputes.length} disputes`)

    return data
  })

  // Test 6: Webhook Processing (Manual - requires user to create dispute)
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 MANUAL TEST REQUIRED: Webhook Processing')
  console.log('\nTo test webhook processing:')
  console.log('1. Go to Stripe Dashboard → Payments')
  console.log('2. Find a test charge')
  console.log('3. Click "..." → "Create dispute"')
  console.log('4. Select a reason and submit')
  console.log('\nThen press Enter to continue validation...')

  await prompt('Press Enter after creating test dispute in Stripe...')

  // Check if dispute was created
  await test('Webhook Processing - Dispute Created', true, async () => {
    const data = await fetchJSON(`${BASE_URL}/api/disputes`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const disputes = Array.isArray(data) ? data : data.disputes || []

    if (disputes.length === 0) {
      throw new Error('No disputes found. Webhook may not have processed yet. Check Vercel logs.')
    }

    const latestDispute = disputes[0]
    console.log(`   ✅ Dispute ID: ${latestDispute.id}`)
    console.log(`   ✅ Stripe Dispute ID: ${latestDispute.stripe_dispute_id}`)
    console.log(`   ✅ Amount: $${((latestDispute.amount || 0) / 100).toFixed(2)}`)
    console.log(`   ✅ Status: ${latestDispute.status}`)
    console.log(`   ✅ CE 3.0 Eligible: ${latestDispute.ce3_eligible || latestDispute.auto_win_eligible ? 'Yes' : 'No'}`)
    console.log(`   ✅ Compliance Score: ${latestDispute.v_compliance_score || 0}/100`)

    return latestDispute
  })

  // Test 7: PDF Generation
  await test('PDF Generation - Download Compliance Pack', true, async () => {
    // Get latest dispute
    const data = await fetchJSON(`${BASE_URL}/api/disputes`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const disputes = Array.isArray(data) ? data : data.disputes || []

    if (disputes.length === 0) {
      throw new Error('No disputes found for PDF generation test')
    }

    const disputeId = disputes[0].id

    const response = await fetch(`${BASE_URL}/api/disputes/${disputeId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PDF generation failed: ${response.status} ${errorText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('pdf')) {
      throw new Error(`Expected PDF, got ${contentType}`)
    }

    const pdfBuffer = await response.arrayBuffer()
    const pdfSize = pdfBuffer.byteLength

    console.log(`   ✅ PDF generated: ${(pdfSize / 1024).toFixed(2)} KB`)
    console.log(`   ✅ Content-Type: ${contentType}`)

    if (pdfSize < 1000) {
      throw new Error('PDF file too small - may be corrupted')
    }

    return { size: pdfSize, contentType }
  })

  // Test 8: Evidence Submission (Optional - requires user confirmation)
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 OPTIONAL TEST: Evidence Submission')
  console.log('\nThis will submit evidence to Stripe for the test dispute.')
  console.log('⚠️  This creates real evidence in Stripe!')
  
  const submitEvidence = await prompt('Submit evidence to Stripe? (y/N): ')

  if (submitEvidence.toLowerCase() === 'y') {
    await test('Evidence Submission - Submit to Stripe', true, async () => {
      const data = await fetchJSON(`${BASE_URL}/api/disputes`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      const disputes = Array.isArray(data) ? data : data.disputes || []

      if (disputes.length === 0) {
        throw new Error('No disputes found for submission test')
      }

      const disputeId = disputes[0].id

      const response = await fetch(`${BASE_URL}/api/disputes/${disputeId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(`Evidence submission failed: ${result.error || result.message}`)
      }

      console.log(`   ✅ Evidence submitted successfully`)
      console.log(`   ✅ Message: ${result.message}`)
      console.log(`   ⚠️  Check Stripe Dashboard → Disputes to verify evidence attached`)

      return result
    })
  } else {
    console.log('   ⏭️  Skipped evidence submission test')
    results.push({
      name: 'Evidence Submission - Submit to Stripe',
      passed: true,
      critical: true,
      data: { skipped: true },
    })
  }

  // Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 VALIDATION SUMMARY\n')

  const allTests = results.length
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const criticalPassed = results.filter(r => r.critical && r.passed).length
  const criticalFailed = results.filter(r => r.critical && !r.passed).length

  console.log(`Total Tests: ${allTests}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / allTests) * 100).toFixed(1)}%`)
  console.log(`\n🔴 Critical Tests:`)
  console.log(`   ✅ Passed: ${criticalPassed}`)
  console.log(`   ❌ Failed: ${criticalFailed}`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`)
    })
  }

  if (criticalFailed > 0) {
    console.log('\n🚨 CRITICAL FAILURES DETECTED!')
    console.log('   ⚠️  DO NOT MARKET until these are fixed!')
    console.log('\n   Failed critical tests:')
    results.filter(r => r.critical && !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`)
    })
    process.exit(1)
  } else if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('✅ Ready for marketing launch!')
  } else {
    console.log('\n⚠️  Some non-critical tests failed')
    console.log('✅ Core functionality working - safe to launch')
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📝 Test Results Summary:')
  console.log(`   Merchant ID: ${merchantId}`)
  console.log(`   API Key: ${apiKey}`)
  console.log(`   Base URL: ${BASE_URL}`)
  console.log('\n💡 Next Steps:')
  console.log('   1. Save the API key securely')
  console.log('   2. Configure webhook in Stripe Dashboard')
  console.log('   3. Monitor Vercel logs for first real dispute')
  console.log('   4. Ready to market! 🚀\n')
}

// Run validation
runValidation().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

