/**
 * Transaction Sync Utility
 * Syncs historical Stripe charges to the database for CE 3.0 matching
 */

import { stripe } from './stripe'
import { supabaseAdmin } from './supabase'
import type Stripe from 'stripe'

export interface SyncResult {
  total: number
  synced: number
  skipped: number
  errors: number
}

/**
 * Sync all successful Stripe charges to the transactions table
 */
export async function syncHistoricalTransactions(
  limit: number = 100,
  startingAfter?: string,
  merchantId?: string,
  stripeClient?: Stripe
): Promise<SyncResult> {
  const stripeInstance = stripeClient || stripe
  const result: SyncResult = {
    total: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    let hasMore = true
    let lastChargeId = startingAfter

    while (hasMore && result.synced < limit) {
      const charges = await stripeInstance.charges.list({
        limit: 100,
        ...(lastChargeId && { starting_after: lastChargeId }),
      })

      result.total += charges.data.length

      for (const charge of charges.data) {
        try {
          // Only sync succeeded charges with customers
          if (charge.status !== 'succeeded' || !charge.customer) {
            result.skipped++
            continue
          }

          // Check if already exists (with merchant_id if provided)
          let existingQuery = supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('stripe_charge_id', charge.id)
          
          if (merchantId) {
            existingQuery = existingQuery.eq('merchant_id', merchantId)
          }
          
          const { data: existing } = await existingQuery.single()

          if (existing) {
            result.skipped++
            continue
          }

          // Extract payment method fingerprint
          const paymentMethodFingerprint = 
            charge.payment_method_details?.card?.fingerprint || null

          // Insert transaction (with merchant_id if provided)
          const insertData: any = {
            stripe_charge_id: charge.id,
            customer_id: charge.customer as string,
            amount: charge.amount,
            status: 'succeeded',
            ip_address: charge.metadata?.ip_address || null,
            device_fingerprint: charge.metadata?.device_fingerprint || null,
            payment_method_fingerprint: paymentMethodFingerprint,
            customer_email: charge.billing_details?.email || charge.receipt_email || null,
            description: charge.description || charge.statement_descriptor || null,
            disputed: false,
            created_at: new Date(charge.created * 1000).toISOString(),
          }
          
          if (merchantId) {
            insertData.merchant_id = merchantId
          }
          
          const { error } = await supabaseAdmin
            .from('transactions')
            .insert(insertData)

          if (error) {
            console.error(`Error syncing charge ${charge.id}:`, error)
            result.errors++
          } else {
            result.synced++
          }
        } catch (error) {
          console.error(`Error processing charge ${charge.id}:`, error)
          result.errors++
        }
      }

      hasMore = charges.has_more
      if (charges.data.length > 0) {
        lastChargeId = charges.data[charges.data.length - 1].id
      }
    }

    return result
  } catch (error) {
    console.error('Error syncing transactions:', error)
    throw error
  }
}

/**
 * Sync transactions for a specific customer
 */
export async function syncCustomerTransactions(
  customerId: string,
  merchantId?: string,
  stripeClient?: Stripe
): Promise<SyncResult> {
  const stripeInstance = stripeClient || stripe
  const result: SyncResult = {
    total: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    const charges = await stripeInstance.charges.list({
      customer: customerId,
      limit: 100,
    })

    result.total = charges.data.length

    for (const charge of charges.data) {
      try {
        if (charge.status !== 'succeeded') {
          result.skipped++
          continue
        }

        let existingQuery = supabaseAdmin
          .from('transactions')
          .select('id')
          .eq('stripe_charge_id', charge.id)
        
        if (merchantId) {
          existingQuery = existingQuery.eq('merchant_id', merchantId)
        }
        
        const { data: existing } = await existingQuery.single()

        if (existing) {
          result.skipped++
          continue
        }

        const paymentMethodFingerprint = 
          charge.payment_method_details?.card?.fingerprint || null

        const insertData: any = {
          stripe_charge_id: charge.id,
          customer_id: customerId,
          amount: charge.amount,
          status: 'succeeded',
          ip_address: charge.metadata?.ip_address || null,
          device_fingerprint: charge.metadata?.device_fingerprint || null,
          payment_method_fingerprint: paymentMethodFingerprint,
          customer_email: charge.billing_details?.email || charge.receipt_email || null,
          description: charge.description || charge.statement_descriptor || null,
          disputed: false,
          created_at: new Date(charge.created * 1000).toISOString(),
        }
        
        if (merchantId) {
          insertData.merchant_id = merchantId
        }

        const { error } = await supabaseAdmin
          .from('transactions')
          .insert(insertData)

        if (error) {
          result.errors++
        } else {
          result.synced++
        }
      } catch (error) {
        result.errors++
      }
    }

    return result
  } catch (error) {
    console.error('Error syncing customer transactions:', error)
    throw error
  }
}

/**
 * Sync last 12 months of transactions (required for CE 3.0 matching)
 * This ensures Vantirs has historical data immediately upon signup
 * CRITICAL: Without this, Vantirs is "blind" for the first 4 months
 */
export async function syncLast12Months(
  merchantId?: string,
  stripeClient?: Stripe
): Promise<SyncResult> {
  const stripeInstance = stripeClient || stripe
  const result: SyncResult = {
    total: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
  }

  // Calculate date: 12 months ago
  const monthsAgo12 = new Date()
  monthsAgo12.setMonth(monthsAgo12.getMonth() - 12)
  const timestamp12MonthsAgo = Math.floor(monthsAgo12.getTime() / 1000)

  try {
    let hasMore = true
    let lastChargeId: string | undefined

    console.log('🔄 Starting 12-month backfill sync...')
    console.log(`📅 Syncing transactions from ${monthsAgo12.toLocaleDateString()} to now\n`)

    // Sync in batches
    while (hasMore) {
      const charges = await stripeInstance.charges.list({
        limit: 100,
        created: { gte: timestamp12MonthsAgo },
        ...(lastChargeId && { starting_after: lastChargeId }),
      })

      result.total += charges.data.length

      for (const charge of charges.data) {
        try {
          // Only sync succeeded charges with customers
          if (charge.status !== 'succeeded' || !charge.customer) {
            result.skipped++
            continue
          }

          // Check if already exists
          const { data: existing } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('stripe_charge_id', charge.id)
            .single()

          if (existing) {
            result.skipped++
            continue
          }

          // Extract payment method fingerprint
          const paymentMethodFingerprint = 
            charge.payment_method_details?.card?.fingerprint || null

          // Insert transaction
          const { error } = await supabaseAdmin
            .from('transactions')
            .insert({
              stripe_charge_id: charge.id,
              customer_id: charge.customer as string,
              amount: charge.amount,
              status: 'succeeded',
              ip_address: charge.metadata?.ip_address || null,
              device_fingerprint: charge.metadata?.device_fingerprint || null,
              payment_method_fingerprint: paymentMethodFingerprint,
              customer_email: charge.billing_details?.email || charge.receipt_email || null,
              description: charge.description || charge.statement_descriptor || null,
              disputed: false,
              created_at: new Date(charge.created * 1000).toISOString(),
            })

          if (error) {
            console.error(`Error syncing charge ${charge.id}:`, error)
            result.errors++
          } else {
            result.synced++
          }
        } catch (error) {
          console.error(`Error processing charge ${charge.id}:`, error)
          result.errors++
        }
      }

      hasMore = charges.has_more
      if (charges.data.length > 0) {
        lastChargeId = charges.data[charges.data.length - 1].id
      }

      // Log progress every 100 charges
      if (result.synced % 100 === 0 && result.synced > 0) {
        console.log(`✅ Synced ${result.synced} transactions so far...`)
      }
    }

    console.log(`\n✨ Backfill complete: ${result.synced} transactions synced from last 12 months`)
    return result
  } catch (error) {
    console.error('Error syncing last 12 months:', error)
    throw error
  }
}

