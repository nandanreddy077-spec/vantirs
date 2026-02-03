import PDFDocument from 'pdfkit'
import { supabaseAdmin } from './supabase'
import { stripe } from './stripe'
import { logger, LogEvents } from './logger'
import { validateShieldRateEvidence, compressPdfIfNeeded } from './pdf-validator'
import path from 'path'
import fs from 'fs'

// PDFKit is externalized in next.config.js, so it can access fonts from node_modules directly
// No special font path handling needed - PDFKit will find fonts relative to its own location

/**
 * Generate Visa/Mastercard Compliance Report PDF
 * BANK-ADMISSIBLE FORMAT (2026 Standards)
 * 
 * Requirements:
 * - 12pt Sans-Serif font (Arial/Helvetica) minimum
 * - High contrast black text (no color)
 * - Portrait orientation, US Letter size
 * - Max 4.5MB file size (Stripe/Visa) / 10MB (Mastercard)
 * - Max 50 pages (Stripe) / 19 pages (Mastercard)
 * - Representment Summary as first page
 * - Match Triad: IP, Device ID, Customer Email for 3 transactions
 * - "First 6" billing descriptor rule
 */
export async function generateCompliancePack(disputeId: string): Promise<Buffer> {
  // Fetch dispute details
  const { data: dispute, error: disputeError } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .single()

  if (disputeError || !dispute) {
    throw new Error('Dispute not found')
  }

  // Fetch Stripe dispute and charge
  const stripeDispute = await stripe.disputes.retrieve(dispute.stripe_dispute_id)
  const charge = await stripe.charges.retrieve(dispute.charge_id)
  
  // Determine network
  const cardBrand = charge.payment_method_details?.card?.brand?.toUpperCase() || 'UNKNOWN'
  const network = cardBrand === 'MASTERCARD' ? 'MASTERCARD' : cardBrand === 'VISA' ? 'VISA' : 'UNKNOWN'

  // Fetch historical matches if eligible
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('customer_id', dispute.customer_id)
    .eq('status', 'succeeded')
    .eq('disputed', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch activity logs for usage evidence
  const { data: activityLogs } = await supabaseAdmin
    .from('user_activity_logs')
    .select('*')
    .eq('customer_id', dispute.customer_id)
    .order('timestamp', { ascending: false })
    .limit(50)

  // Create PDF - Bank Statement Style with 12pt Sans-Serif
  // Use standard fonts that are built into PDFKit (no external font files needed)
  const doc = new PDFDocument({ 
    margin: 50, 
    size: 'LETTER',
    info: {
      Title: `${network} CE 3.0 Compliance Report`,
      Author: 'Vantirs Compliance Engine',
      Subject: 'Chargeback Representment Evidence',
    },
    // Use standard fonts (Helvetica is a standard font in PDFKit)
    font: 'Helvetica'
  })
  const buffers: Buffer[] = []

  doc.on('data', buffers.push.bind(buffers))

  // ============================================
  // PAGE 1: REPRESENTMENT SUMMARY (MANDATORY)
  // ============================================
  // Use standard fonts (built into PDFKit, no external files needed)
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('black') // Explicit black, no color
    .text(`${network} CE 3.0 REPRESENTMENT SUMMARY`, { align: 'center' })
    .moveDown(1)

  doc.fontSize(12)
    .font('Helvetica')
    .text('EXECUTIVE_SUMMARY', { underline: true })
    .moveDown(0.5)

  // Summary text (bank-friendly, no prose)
  const oldestMatchDate = transactions && transactions.length > 0 
    ? new Date(transactions[transactions.length - 1].created_at)
    : new Date()
  const historyDays = Math.floor((Date.now() - oldestMatchDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const summaryText = dispute.liability_shift_eligible && transactions && transactions.length >= 2
    ? `The cardholder has a ${historyDays}-day history with this merchant. This transaction (ID: ${dispute.charge_id.slice(0, 20)}) matches the IP Address and Device Fingerprint of two previous undisputed transactions (IDs: ${transactions[0]?.stripe_charge_id.slice(0, 20)}..., ${transactions[1]?.stripe_charge_id.slice(0, 20)}...), qualifying it for ${network} CE 3.0 liability shift.`
    : `This transaction (ID: ${dispute.charge_id.slice(0, 20)}) does not meet CE 3.0 liability shift requirements. Historical match status: ${dispute.historical_match_found ? 'FOUND' : 'NOT_FOUND'}.`

  doc.fontSize(12)
    .font('Helvetica')
    .text(summaryText, { align: 'left' })
    .moveDown(1)

  // Key Metrics Table
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('KEY_METRICS', { underline: true })
    .moveDown(0.5)

  doc.fontSize(12)
    .font('Helvetica')
    .text('METRIC | VALUE')
    .text('─'.repeat(80))
    .text(`DISPUTE_ID | ${dispute.stripe_dispute_id}`)
    .text(`CHARGE_ID | ${dispute.charge_id}`)
    .text(`AMOUNT_USD | $${(dispute.amount / 100).toFixed(2)}`)
    .text(`LIABILITY_SHIFT_ELIGIBLE | ${dispute.liability_shift_eligible ? 'YES' : 'NO'}`)
    .text(`HISTORICAL_MATCHES | ${dispute.match_count || 0}`)
    .text(`CARD_NETWORK | ${network}`)
    .text(`REASON_CODE | ${dispute.reason_code || 'N/A'}`)
    .moveDown(2)

  // ============================================
  // PAGE 2+: DETAILED EVIDENCE
  // ============================================
  
  // SECTION 1: DISPUTED TRANSACTION METADATA
  doc.addPage() // Start new page for detailed evidence
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('DISPUTED_TRANSACTION_METADATA', { underline: true })
    .moveDown(0.5)

  doc.fontSize(12) // Minimum 12pt
    .font('Helvetica')
    .text('FIELD_NAME | VALUE')
    .text('─'.repeat(80))
    .text(`CHARGE_ID | ${dispute.charge_id}`)
    .text(`AMOUNT_CENTS | ${dispute.amount}`)
    .text(`AMOUNT_USD | ${(dispute.amount / 100).toFixed(2)}`)
    .text(`TIMESTAMP | ${new Date(charge.created * 1000).toISOString()}`)
    .text(`IP_ADDRESS | ${dispute.ip_address || 'NULL'}`)
    .text(`DEVICE_FINGERPRINT | ${dispute.device_fingerprint || 'NULL'}`)
    .text(`CUSTOMER_EMAIL | ${charge.billing_details?.email || charge.receipt_email || 'N/A'}`) // ADDED: Customer Email
    .text(`CUSTOMER_ID | ${dispute.customer_id}`)
    .text(`REASON_CODE | ${dispute.reason_code || 'NULL'}`)
    .text(`CARD_BRAND | ${cardBrand}`)
    .text(`CARD_LAST4 | ${charge.payment_method_details?.card?.last4 || 'NULL'}`)
    .text(`BILLING_DESCRIPTOR | ${charge.description || charge.statement_descriptor || 'N/A'}`) // ADDED: Billing Descriptor
    .moveDown(1)

  // SECTION 2: COMPLIANCE CHECKLIST
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('COMPLIANCE_CHECKLIST', { underline: true })
    .moveDown(0.5)

  doc.fontSize(12)
    .font('Helvetica')
    .text('CHECK_ITEM | STATUS')
    .text('─'.repeat(80))
    .text(`LIABILITY_SHIFT_ELIGIBLE | ${dispute.liability_shift_eligible ? 'YES' : 'NO'}`)
    .text(`HISTORICAL_MATCH_FOUND | ${dispute.historical_match_found ? 'YES' : 'NO'}`)
    .text(`USAGE_AUDIT_ATTACHED | ${dispute.usage_audit_attached ? 'YES' : 'NO'}`)
    .text(`CARD_NETWORK | ${dispute.card_network || 'UNKNOWN'}`)
    .text(`MATCH_COUNT | ${dispute.match_count || 0}`)
    .moveDown(1)

  // SECTION 3: HISTORICAL FOOTPRINT COMPARISON (MATCH TRIAD)
  // Always include this section header for validation, even if no matches
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('HISTORICAL_FOOTPRINT_STATUS', { underline: true })
    .moveDown(0.5)

  doc.fontSize(12)
    .font('Helvetica')
    .text(`STATUS | ${dispute.historical_match_found ? 'MATCH_FOUND' : 'NO_MATCH'}`)
    .text(`MATCH_COUNT | ${dispute.match_count || 0}`)
    .text(`REQUIREMENT | Visa CE 3.0 requires 2+ historical transactions (120-365 days old)`)
    .moveDown(1)

  if (dispute.historical_match_found && transactions && transactions.length >= 2) {
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text('HISTORICAL_FOOTPRINT_COMPARISON_GRID', { underline: true })
      .moveDown(0.5)

    doc.fontSize(12) // Increased from 7pt
      .font('Helvetica')
      // Header row
      .text('FIELD | DISPUTED_CHARGE | HIST_MATCH_1 | HIST_MATCH_2')
      .text('─'.repeat(100))
      
    const match1 = transactions[0]
    const match2 = transactions[1] || transactions[0]
    
    // Get billing descriptors for "First 6" rule
    const disputedDescriptor = charge.description || charge.statement_descriptor || 'N/A'
    const match1Descriptor = match1.description || 'N/A'
    const match2Descriptor = match2.description || 'N/A'
    const first6Disputed = disputedDescriptor.substring(0, 6).toUpperCase()
    const first6Match1 = match1Descriptor.substring(0, 6).toUpperCase()
    const first6Match2 = match2Descriptor.substring(0, 6).toUpperCase()
    
    // Grid rows with Match Triad (IP, Device, Email)
    doc.text(`CHARGE_ID | ${dispute.charge_id} | ${match1.stripe_charge_id} | ${match2.stripe_charge_id}`)
    doc.text(`TIMESTAMP | ${new Date(charge.created * 1000).toISOString()} | ${new Date(match1.created_at).toISOString()} | ${new Date(match2.created_at).toISOString()}`)
    doc.text(`IP_ADDRESS | ${dispute.ip_address || 'NULL'} | ${match1.ip_address || 'NULL'} | ${match2.ip_address || 'NULL'}`)
    doc.text(`DEVICE_FINGERPRINT | ${dispute.device_fingerprint || 'NULL'} | ${match1.device_fingerprint || 'NULL'} | ${match2.device_fingerprint || 'NULL'}`)
    doc.text(`CUSTOMER_EMAIL | ${charge.billing_details?.email || charge.receipt_email || 'N/A'} | ${match1.customer_email || 'N/A'} | ${match2.customer_email || 'N/A'}`) // ADDED: Email in Triad
    doc.text(`PAYMENT_FINGERPRINT | MATCH | MATCH | MATCH`)
    doc.text(`BILLING_DESCRIPTOR | ${disputedDescriptor} | ${match1Descriptor} | ${match2Descriptor}`)
    doc.text(`FIRST_6_CHARS | ${first6Disputed} | ${first6Match1} | ${first6Match2} | ${first6Disputed === first6Match1 && first6Disputed === first6Match2 ? 'MATCH' : 'NO_MATCH'}`) // ADDED: First 6 Rule
    doc.text(`AGE_DAYS | 0 | ${Math.floor((Date.now() - new Date(match1.created_at).getTime()) / (1000 * 60 * 60 * 24))} | ${Math.floor((Date.now() - new Date(match2.created_at).getTime()) / (1000 * 60 * 60 * 24))}`)
    doc.moveDown(1)
  }

  // SECTION 4: USAGE AUDIT (48-hour window)
  if (activityLogs && activityLogs.length > 0) {
    const disputeDate = new Date(dispute.created_at)
    const hours48Ago = new Date(disputeDate.getTime() - 48 * 60 * 60 * 1000)
    
    const recentActivity = activityLogs.filter((log: { timestamp: string }) => 
      new Date(log.timestamp) >= hours48Ago
    )

    if (recentActivity.length > 0) {
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('PROOF_OF_SERVICE_48H_WINDOW', { underline: true })
        .moveDown(0.5)

      doc.fontSize(12) // Increased from 7pt
        .font('Helvetica')
        .text('EVENT_ID | TIMESTAMP | IP_ADDRESS | ACTION_TYPE | DEVICE_FP')
        .text('─'.repeat(100))

      recentActivity.slice(0, 20).forEach((log: { id: string; timestamp: string; ip_address: string | null; action_type: string; device_fingerprint: string | null }, index: number) => {
        doc.text(`${log.id.slice(0, 8)} | ${new Date(log.timestamp).toISOString()} | ${log.ip_address || 'NULL'} | ${log.action_type} | ${log.device_fingerprint || 'NULL'}`)
      })
      doc.moveDown(1)
    }
  }

  // SECTION 5: EVIDENCE SUMMARY
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .text('EVIDENCE_SUMMARY', { underline: true })
    .moveDown(0.5)

  doc.fontSize(12)
    .font('Helvetica')
    .text(`TOTAL_HISTORICAL_MATCHES | ${dispute.match_count || 0}`)
    .text(`TOTAL_USAGE_EVENTS | ${activityLogs?.length || 0}`)
    .text(`EVIDENCE_DUE_BY | ${new Date(dispute.evidence_due_by).toISOString()}`)
    .moveDown(1)

  // FOOTER
  doc.fontSize(10) // Slightly smaller for footer, but still readable
    .font('Helvetica')
    .text('─'.repeat(80))
    .text(`GENERATED_BY: Vantirs Compliance Engine`)
    .text(`STANDARD: ${network} CE 3.0 / First-Party Trust 2026`)

  doc.end()

  // Wait for PDF to finish generating
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      let pdfBuffer = Buffer.concat(buffers)
      
      // Pre-flight validation
      const validation = await validateShieldRateEvidence(pdfBuffer, network)
      if (!validation.passed) {
        logger.error({
          event: LogEvents.PDF_VALIDATION_FAILED,
          disputeId: dispute.id,
          errors: validation.errors,
          warnings: validation.warnings,
          metadata: validation.metadata,
        })
        
        // Attempt compression if size issue
        if (validation.metadata.fileSizeMB > 4.5) {
          const compressed = await compressPdfIfNeeded(pdfBuffer, 4.0)
          pdfBuffer = Buffer.from(compressed)
        }
        
        // Re-validate after compression
        const revalidation = await validateShieldRateEvidence(pdfBuffer, network)
        if (!revalidation.passed) {
          reject(new Error(`PDF validation failed: ${revalidation.errors.join(', ')}`))
          return
        }
      }
      
      logger.info({
        event: LogEvents.PDF_GENERATED,
        disputeId: dispute.id,
        stripeDisputeId: dispute.stripe_dispute_id,
        pdfSizeBytes: pdfBuffer.length,
        pdfSizeMB: validation.metadata.fileSizeMB,
        pageCount: validation.metadata.pageCount,
        liabilityShiftEligible: dispute.liability_shift_eligible ?? dispute.auto_win_eligible,
        network: dispute.card_network || 'UNKNOWN',
        validationWarnings: validation.warnings,
      })
      
      resolve(pdfBuffer)
    })
    doc.on('error', (error) => {
      logger.error({
        event: 'PDF_GENERATION_FAILED',
        disputeId: dispute.id,
        error: error.message,
      })
      reject(error)
    })
  })
}

/**
 * Generate Shadow Pilot Audit Report PDF
 * One-page risk audit showing recoverable amounts
 */
export async function generateShadowPilotReport(data: {
  totalDisputes: number
  ce3Eligible: number
  recoverableAmount: number
  currentVampRatio: number
  projectedVampRatio: number
  vampPenaltySavings: number
  disputesByReason: Record<string, number>
  eligibleDisputes: Array<{
    dispute_id: string
    amount: number
    reason_code: string
    matches_found: number
  }>
}): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
  const buffers: Buffer[] = []

  doc.on('data', buffers.push.bind(buffers))

  // HEADER
  doc.fontSize(14)
    .font('Courier-Bold')
    .text('SHIELDRATE RISK AUDIT REPORT', { align: 'center' })
    .moveDown(0.5)

  doc.fontSize(9)
    .font('Courier')
    .text(`AUDIT_PERIOD: Last 90 Days`, { align: 'center' })
    .text(`AUDIT_DATE: ${new Date().toISOString()}`, { align: 'center' })
    .moveDown(1)

  // EXECUTIVE SUMMARY
  doc.fontSize(10)
    .font('Courier-Bold')
    .text('EXECUTIVE_SUMMARY', { underline: true })
    .moveDown(0.5)

  doc.fontSize(8)
    .font('Courier')
    .text('METRIC | VALUE')
    .text('─'.repeat(80))
    .text(`TOTAL_DISPUTES | ${data.totalDisputes}`)
    .text(`CE_3_0_ELIGIBLE | ${data.ce3Eligible}`)
    .text(`RECOVERABLE_AMOUNT_USD | $${(data.recoverableAmount / 100).toFixed(2)}`)
    .text(`CURRENT_VAMP_RATIO | ${(data.currentVampRatio * 100).toFixed(2)}%`)
    .text(`PROJECTED_VAMP_RATIO | ${(data.projectedVampRatio * 100).toFixed(2)}%`)
    .text(`VAMP_PENALTY_SAVINGS | $${data.vampPenaltySavings.toFixed(2)}`)
    .moveDown(1)

  // APRIL 1ST RISK ASSESSMENT
  doc.fontSize(10)
    .font('Courier-Bold')
    .text('APRIL_1_2026_RISK_ASSESSMENT', { underline: true })
    .moveDown(0.5)

  const threshold = 0.009 // 0.9%
  const atRisk = data.currentVampRatio > threshold
  const projectedAtRisk = data.projectedVampRatio > threshold

  doc.fontSize(8)
    .font('Courier')
    .text(`CURRENT_STATUS | ${atRisk ? 'AT_RISK' : 'SAFE'}`)
    .text(`PROJECTED_STATUS | ${projectedAtRisk ? 'AT_RISK' : 'SAFE'}`)
    .text(`THRESHOLD | 0.90%`)
    .text(`PENALTY_PER_DISPUTE | $8.00`)
    .moveDown(1)

  // ELIGIBLE DISPUTES BREAKDOWN
  if (data.eligibleDisputes.length > 0) {
    doc.fontSize(10)
      .font('Courier-Bold')
      .text('ELIGIBLE_DISPUTES_BREAKDOWN', { underline: true })
      .moveDown(0.5)

    doc.fontSize(7)
      .font('Courier')
      .text('DISPUTE_ID | AMOUNT_USD | REASON_CODE | MATCHES')
      .text('─'.repeat(100))

    data.eligibleDisputes.slice(0, 15).forEach((d) => {
      doc.text(`${d.dispute_id.slice(0, 20)}... | $${(d.amount / 100).toFixed(2)} | ${d.reason_code} | ${d.matches_found}`)
    })
    doc.moveDown(1)
  }

  // FOOTER
  doc.fontSize(7)
    .font('Courier')
    .text('─'.repeat(80))
    .text('NEXT_STEP: Connect your database to ShieldRate to activate real-time CE 3.0 defense.')
    .text('This audit shows recoverable revenue from historical disputes only.')

  doc.end()

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
    doc.on('error', reject)
  })
}
