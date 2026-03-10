/**
 * Shadow Pilot Script - CE 3.0 Eligibility Scraper
 * 
 * This script identifies exactly how much "free money" is sitting in Stripe history.
 * 
 * Usage:
 *   npx tsx scripts/shadow-pilot.ts
 * 
 * Output: JSON report showing eligible disputes and potential recovery
 */

import { stripe } from '../lib/stripe'
import { supabaseAdmin } from '../lib/supabase'
import { findCE3Matches } from '../lib/ce3-matcher'
import { generateShadowPilotReport } from '../lib/pdf-generator'
import * as fs from 'fs'
import * as path from 'path'
import type Stripe from 'stripe'

interface ShadowPilotResult {
  total_disputes: number
  ce_3_0_eligible: number
  golden_matches: number
  recoverable_amount: number
  current_vamp_ratio: number
  projected_vamp_ratio: number
  vamp_penalty_savings: number
  disputes_by_reason_code: Record<string, number>
  eligible_disputes: Array<{
    dispute_id: string
    amount: number
    reason_code: string
    matches_found: number
  }>
}

async function runShadowPilot(): Promise<ShadowPilotResult> {
  console.log('🔍 Starting Shadow Pilot - Scanning Stripe history...\n')

  // Fetch all disputes from last 90 days
  const daysAgo90 = new Date()
  daysAgo90.setDate(daysAgo90.getDate() - 90)
  const timestamp90DaysAgo = Math.floor(daysAgo90.getTime() / 1000)

  const disputes: Stripe.Dispute[] = []
  let hasMore = true
  let startingAfter: string | undefined

  // Paginate through all disputes
  while (hasMore) {
    const response = await stripe.disputes.list({
      limit: 100,
      created: { gte: timestamp90DaysAgo },
      ...(startingAfter && { starting_after: startingAfter }),
    })

    disputes.push(...response.data)
    hasMore = response.has_more
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id
    }
  }

  console.log(`📊 Found ${disputes.length} disputes in last 90 days\n`)

  // Filter for fraudulent reason codes (CE 3.0 eligible)
  const fraudulentDisputes = disputes.filter(
    d => d.reason === 'fraudulent' || d.reason === 'general'
  )

  console.log(`🎯 ${fraudulentDisputes.length} disputes with fraud-related reason codes\n`)

  // Get all transactions for matching
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('status', 'succeeded')
    .eq('disputed', false)

  console.log(`💳 Found ${transactions?.length || 0} historical transactions in database\n`)

  // Process each dispute
  let ce3Eligible = 0
  let goldenMatches = 0
  let recoverableAmount = 0
  const disputesByReason: Record<string, number> = {}
  const eligibleDisputes: Array<{
    dispute_id: string
    amount: number
    reason_code: string
    matches_found: number
  }> = []

  for (const dispute of fraudulentDisputes) {
    // Count by reason code
    disputesByReason[dispute.reason] = (disputesByReason[dispute.reason] || 0) + 1

    try {
      // Get charge details
      const charge = await stripe.charges.retrieve(dispute.charge as string)
      const customerId = charge.customer as string

      if (!customerId) continue

      // Extract IP and device fingerprint
      const ipAddress = charge.metadata?.ip_address || null
      const deviceFingerprint = charge.metadata?.device_fingerprint || null

      // Run CE 3.0 matching (pass reason code for 10.4 eligibility)
      const match = await findCE3Matches(
        customerId,
        ipAddress,
        deviceFingerprint,
        dispute.charge as string,
        undefined,
        undefined,
        dispute.reason,
      )

      if (match.matched && match.matches.length >= 2) {
        ce3Eligible++
        goldenMatches += match.matches.length
        recoverableAmount += dispute.amount
        eligibleDisputes.push({
          dispute_id: dispute.id,
          amount: dispute.amount,
          reason_code: dispute.reason,
          matches_found: match.matches.length,
        })
      }
    } catch (error) {
      console.warn(`⚠️  Error processing dispute ${dispute.id}:`, error)
    }
  }

  // Calculate VAMP ratios
  const totalTransactions = transactions?.length || 1
  const currentVampRatio = disputes.length / totalTransactions
  const projectedVampRatio = (disputes.length - ce3Eligible) / totalTransactions

  // Calculate VAMP penalty savings (if ratio > 1.5%, $8 per dispute)
  const vampPenaltySavings = currentVampRatio > 0.015 
    ? ce3Eligible * 8 
    : 0

  const result: ShadowPilotResult = {
    total_disputes: disputes.length,
    ce_3_0_eligible: ce3Eligible,
    golden_matches: goldenMatches,
    recoverable_amount: recoverableAmount,
    current_vamp_ratio: currentVampRatio,
    projected_vamp_ratio: projectedVampRatio,
    vamp_penalty_savings: vampPenaltySavings,
    disputes_by_reason_code: disputesByReason,
    eligible_disputes: eligibleDisputes,
  }

  return result
}

// Run if executed directly
if (require.main === module) {
  runShadowPilot()
    .then(async (result) => {
      console.log('\n✅ Shadow Pilot Complete!\n')
      console.log('📋 Results:')
      console.log(JSON.stringify(result, null, 2))
      console.log('\n💰 Summary:')
      console.log(`   Total Disputes: ${result.total_disputes}`)
      console.log(`   CE 3.0 Eligible: ${result.ce_3_0_eligible}`)
      console.log(`   Recoverable Amount: $${(result.recoverable_amount / 100).toFixed(2)}`)
      console.log(`   Current VAMP Ratio: ${(result.current_vamp_ratio * 100).toFixed(2)}%`)
      console.log(`   Projected VAMP Ratio: ${(result.projected_vamp_ratio * 100).toFixed(2)}%`)
      console.log(`   VAMP Penalty Savings: $${result.vamp_penalty_savings.toFixed(2)}`)

      // Generate audit report PDF
      try {
        console.log('\n📄 Generating Audit Report PDF...')
        const pdfBuffer = await generateShadowPilotReport({
          totalDisputes: result.total_disputes,
          ce3Eligible: result.ce_3_0_eligible,
          recoverableAmount: result.recoverable_amount,
          currentVampRatio: result.current_vamp_ratio,
          projectedVampRatio: result.projected_vamp_ratio,
          vampPenaltySavings: result.vamp_penalty_savings,
          disputesByReason: result.disputes_by_reason_code,
          eligibleDisputes: result.eligible_disputes,
        })

        const outputPath = path.join(process.cwd(), `shadow-pilot-audit-${Date.now()}.pdf`)
        fs.writeFileSync(outputPath, pdfBuffer)
        console.log(`\n✅ Audit Report saved to: ${outputPath}`)
        console.log('   Send this PDF to your customer to show recoverable revenue.')
      } catch (error: any) {
        console.warn(`⚠️  Failed to generate PDF: ${error.message}`)
      }
    })
    .catch((error) => {
      console.error('❌ Shadow Pilot failed:', error)
      process.exit(1)
    })
}

export { runShadowPilot }

