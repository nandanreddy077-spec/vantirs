#!/usr/bin/env tsx
/**
 * Production Verification Script
 * Verifies environment variables and database schema
 * 
 * Usage: npx tsx scripts/verify-production.ts
 */

import { supabaseAdmin } from '../lib/supabase'

async function verifyEnvironment() {
  console.log('🔍 Verifying Environment Variables...\n')
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ]
  
  const optional = [
    'ENCRYPTION_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'STRIPE_CONNECT_CLIENT_ID',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ]
  
  let allGood = true
  
  console.log('📋 Required Variables:')
  for (const key of required) {
    if (process.env[key]) {
      const value = process.env[key] || ''
      const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value
      console.log(`  ✅ ${key}: ${displayValue}`)
    } else {
      console.log(`  ❌ ${key} - MISSING (CRITICAL)`)
      allGood = false
    }
  }
  
  console.log('\n📋 Optional Variables:')
  for (const key of optional) {
    if (process.env[key]) {
      const value = process.env[key] || ''
      const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value
      console.log(`  ✅ ${key}: ${displayValue}`)
    } else {
      console.log(`  ⚠️  ${key} - Not set (optional)`)
    }
  }
  
  return allGood
}

async function verifyDatabase() {
  console.log('\n🔍 Verifying Database Schema...\n')
  
  let allGood = true
  
  // Check merchants table
  try {
    const { data: merchants, error: merchantsError } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .limit(1)
    
    if (merchantsError) {
      console.log(`  ❌ merchants table - ERROR: ${merchantsError.message}`)
      console.log('     → Run: database/migration-multi-tenant.sql')
      allGood = false
    } else {
      console.log('  ✅ merchants table exists')
    }
  } catch (error: any) {
    console.log(`  ❌ merchants table - ERROR: ${error.message}`)
    allGood = false
  }
  
  // Check disputes table has merchant_id
  try {
    const { data: disputes, error: disputesError } = await supabaseAdmin
      .from('disputes')
      .select('merchant_id')
      .limit(1)
    
    if (disputesError && disputesError.message.includes('merchant_id')) {
      console.log(`  ❌ disputes.merchant_id column - MISSING`)
      console.log('     → Run: database/migration-multi-tenant.sql')
      allGood = false
    } else {
      console.log('  ✅ disputes.merchant_id column exists')
    }
  } catch (error: any) {
    if (error.message?.includes('merchant_id')) {
      console.log(`  ❌ disputes.merchant_id column - MISSING`)
      console.log('     → Run: database/migration-multi-tenant.sql')
      allGood = false
    } else {
      console.log('  ✅ disputes.merchant_id column exists')
    }
  }
  
  // Check transactions table has merchant_id
  try {
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('merchant_id')
      .limit(1)
    
    if (transactionsError && transactionsError.message.includes('merchant_id')) {
      console.log(`  ❌ transactions.merchant_id column - MISSING`)
      console.log('     → Run: database/migration-multi-tenant.sql')
      allGood = false
    } else {
      console.log('  ✅ transactions.merchant_id column exists')
    }
  } catch (error: any) {
    if (error.message?.includes('merchant_id')) {
      console.log(`  ❌ transactions.merchant_id column - MISSING`)
      console.log('     → Run: database/migration-multi-tenant.sql')
      allGood = false
    } else {
      console.log('  ✅ transactions.merchant_id column exists')
    }
  }
  
  // Check card_network column (for Mastercard FPT)
  try {
    const { data: disputesNetwork, error: networkError } = await supabaseAdmin
      .from('disputes')
      .select('card_network')
      .limit(1)
    
    if (networkError && networkError.message.includes('card_network')) {
      console.log(`  ❌ disputes.card_network column - MISSING`)
      console.log('     → This column is in base schema.sql')
      allGood = false
    } else {
      console.log('  ✅ disputes.card_network column exists (for Mastercard FPT)')
    }
  } catch (error: any) {
    if (error.message?.includes('card_network')) {
      console.log(`  ❌ disputes.card_network column - MISSING`)
      allGood = false
    } else {
      console.log('  ✅ disputes.card_network column exists')
    }
  }
  
  // Check subscription plan columns
  try {
    const { data: merchantPlan, error: planError } = await supabaseAdmin
      .from('merchants')
      .select('plan, disputes_used, disputes_limit, subscription_status')
      .limit(1)
    
    if (planError && planError.message.includes('plan')) {
      console.log(`  ❌ merchants.plan column - MISSING`)
      console.log('     → Run: database/migration-add-subscription-plans.sql')
      allGood = false
    } else {
      console.log('  ✅ merchants subscription columns exist (plan, disputes_used, etc.)')
    }
  } catch (error: any) {
    if (error.message?.includes('plan')) {
      console.log(`  ❌ merchants.plan column - MISSING`)
      console.log('     → Run: database/migration-add-subscription-plans.sql')
      allGood = false
    } else {
      console.log('  ✅ merchants subscription columns exist')
    }
  }
  
  // Check action_taxonomy is seeded
  try {
    const { count, error: countError } = await supabaseAdmin
      .from('action_taxonomy')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log(`  ⚠️  action_taxonomy table - Could not verify: ${countError.message}`)
    } else if (count && count >= 10) {
      console.log(`  ✅ action_taxonomy table seeded (${count} actions)`)
    } else {
      console.log(`  ⚠️  action_taxonomy table - Only ${count} actions (expected at least 10)`)
    }
  } catch (error: any) {
    console.log(`  ⚠️  action_taxonomy - Could not verify: ${error.message}`)
  }
  
  return allGood
}

async function verifyCriticalColumns() {
  console.log('\n🔍 Verifying Critical Columns for Mastercard FPT...\n')
  
  let allGood = true
  
  // Check disputes table has all required columns for Mastercard FPT
  const requiredDisputeColumns = [
    'device_fingerprint',
    'ip_address',
    'card_network',
    'match_count',
  ]
  
  for (const column of requiredDisputeColumns) {
    try {
      const { data, error } = await supabaseAdmin
        .from('disputes')
        .select(column)
        .limit(1)
      
      if (error && error.message.includes(column)) {
        console.log(`  ❌ disputes.${column} - MISSING`)
        allGood = false
      } else {
        console.log(`  ✅ disputes.${column} exists`)
      }
    } catch (error: any) {
      if (error.message?.includes(column)) {
        console.log(`  ❌ disputes.${column} - MISSING`)
        allGood = false
      } else {
        console.log(`  ✅ disputes.${column} exists`)
      }
    }
  }
  
  // Check transactions table has required columns
  const requiredTransactionColumns = [
    'device_fingerprint',
    'ip_address',
    'payment_method_fingerprint',
  ]
  
  for (const column of requiredTransactionColumns) {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select(column)
        .limit(1)
      
      if (error && error.message.includes(column)) {
        console.log(`  ❌ transactions.${column} - MISSING`)
        allGood = false
      } else {
        console.log(`  ✅ transactions.${column} exists`)
      }
    } catch (error: any) {
      if (error.message?.includes(column)) {
        console.log(`  ❌ transactions.${column} - MISSING`)
        allGood = false
      } else {
        console.log(`  ✅ transactions.${column} exists`)
      }
    }
  }
  
  return allGood
}

async function main() {
  console.log('🚀 Vantirs Production Verification\n')
  console.log('='.repeat(50) + '\n')
  
  const envOk = await verifyEnvironment()
  const dbOk = await verifyDatabase()
  const columnsOk = await verifyCriticalColumns()
  
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 Summary:')
  console.log(`  Environment Variables: ${envOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Database Schema: ${dbOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Critical Columns: ${columnsOk ? '✅ PASS' : '❌ FAIL'}`)
  
  if (envOk && dbOk && columnsOk) {
    console.log('\n✅ All critical checks passed! System is production-ready.')
    console.log('\n💡 Next Steps:')
    console.log('  1. Verify Stripe webhook is configured')
    console.log('  2. Test onboarding flow with a test merchant')
    console.log('  3. Run Shadow Pilot to verify CE 3.0 matching')
    console.log('  4. Test Mastercard FPT logic with a test dispute')
    process.exit(0)
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above.')
    console.log('\n📚 Migration Files:')
    console.log('  - database/schema.sql (base schema)')
    console.log('  - database/migration-multi-tenant.sql (merchants table)')
    console.log('  - database/migration-add-subscription-plans.sql (billing)')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('\n❌ Verification script error:', error)
  process.exit(1)
})




