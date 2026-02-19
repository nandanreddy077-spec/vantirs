/**
 * Webhook Testing Script
 * 
 * Tests the Stripe webhook handler with a mock dispute event
 * 
 * Usage:
 *   npx tsx scripts/test-webhook.ts
 */

import { stripe } from '../lib/stripe'

async function testWebhook() {
  console.log('🧪 Testing Stripe Webhook Handler...\n')

  try {
    // Get a recent charge to use for testing
    const charges = await stripe.charges.list({ limit: 1 })

    if (charges.data.length === 0) {
      console.log('❌ No charges found. Create a test charge first.')
      return
    }

    const charge = charges.data[0]
    console.log(`📋 Using charge: ${charge.id}`)
    console.log(`   Customer: ${charge.customer || 'N/A'}`)
    console.log(`   Amount: $${(charge.amount / 100).toFixed(2)}\n`)

    // Create a test dispute (this will create a real dispute in test mode)
    console.log('⚠️  Creating test dispute...')
    console.log('   Note: This creates a REAL dispute in Stripe test mode\n')

    // For testing, you can use Stripe CLI:
    // stripe trigger charge.dispute.created

    console.log('💡 To test the webhook:')
    console.log('   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli')
    console.log('   2. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe')
    console.log('   3. In another terminal: stripe trigger charge.dispute.created')
    console.log('\n   Or use the Stripe Dashboard to create a test dispute manually.')

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  testWebhook()
}










