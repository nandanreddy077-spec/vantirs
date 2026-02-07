import { supabaseAdmin } from './supabase'
import { logger, LogEvents } from './logger'

/**
 * Send notification when validation fails or manual attention needed
 * Production-ready with graceful fallbacks
 */
export async function sendValidationFailureNotification(
  disputeId: string,
  stripeDisputeId: string,
  errors: string[]
): Promise<void> {
  // Fetch dispute details for notification
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('amount, evidence_due_by, customer_id, merchant_id')
    .eq('id', disputeId)
    .single()

  if (!dispute) {
    logger.warn({
      event: 'NOTIFICATION_SKIPPED',
      disputeId,
      reason: 'dispute_not_found',
    })
    return
  }

  // Fetch merchant email if available
  let merchantEmail: string | null = null
  if (dispute.merchant_id) {
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('email')
      .eq('id', dispute.merchant_id)
      .single()
    
    merchantEmail = merchant?.email || null
  }

  const notification = {
    type: 'VALIDATION_FAILED',
    disputeId,
    stripeDisputeId,
    amount: dispute.amount,
    evidenceDueBy: dispute.evidence_due_by,
    errors,
    priority: 'HIGH',
    timestamp: new Date().toISOString(),
  }

  // Log notification (structured logging)
  logger.warn({
    event: 'VALIDATION_FAILURE_NOTIFICATION',
    disputeId,
    stripeDisputeId,
    amount: dispute.amount,
    errors,
    merchantId: dispute.merchant_id,
    action: 'merchant_notification_required',
  })

  // Store notification in dispute metadata for dashboard alerts
  try {
    await supabaseAdmin
      .from('disputes')
      .update({
        notification_metadata: {
          last_notification: notification,
          notification_sent_at: new Date().toISOString(),
        }
      })
      .eq('id', disputeId)
  } catch (error: any) {
    logger.error({
      event: 'NOTIFICATION_STORAGE_FAILED',
      disputeId,
      error: error.message,
    })
    // Continue - dashboard alerts are secondary
  }

  // Send email notification if configured and merchant email available
  if (merchantEmail && process.env.RESEND_API_KEY) {
    try {
      await sendEmailNotification(notification, merchantEmail)
    } catch (error: any) {
      logger.error({
        event: 'EMAIL_NOTIFICATION_FAILED',
        disputeId,
        error: error.message,
        action: 'fallback_to_dashboard',
      })
      // Continue - dashboard alerts are the fallback
    }
  }

  // Send Slack notification if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await sendSlackNotification(notification)
    } catch (error: any) {
      logger.error({
        event: 'SLACK_NOTIFICATION_FAILED',
        disputeId,
        error: error.message,
        action: 'fallback_to_dashboard',
      })
      // Continue - dashboard alerts are the fallback
    }
  }

  // Dashboard alerts are always available as fallback
  // The dispute status 'needs_attention' will show in the UI
}

/**
 * Send email notification (implemented with Resend)
 * Gracefully fails if service unavailable
 */
async function sendEmailNotification(notification: any, merchantEmail: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return // Silently skip if not configured
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'alerts@vantirs.com',
        to: merchantEmail,
        subject: `🚨 Vantirs Alert: Dispute ${notification.stripeDisputeId} Needs Attention`,
        html: `
          <h2>PDF Validation Failed</h2>
          <p>Dispute <strong>${notification.stripeDisputeId}</strong> requires manual attention.</p>
          <ul>
            <li><strong>Amount:</strong> $${(notification.amount / 100).toFixed(2)}</li>
            <li><strong>Evidence Due:</strong> ${new Date(notification.evidenceDueBy).toLocaleDateString()}</li>
            <li><strong>Errors:</strong> ${notification.errors.join(', ')}</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    logger.info({
      event: 'EMAIL_NOTIFICATION_SENT',
      disputeId: notification.disputeId,
      recipient: merchantEmail,
    })
  } catch (error: any) {
    logger.error({
      event: 'EMAIL_NOTIFICATION_ERROR',
      disputeId: notification.disputeId,
      error: error.message,
    })
    throw error // Re-throw to trigger fallback
  }
}

/**
 * Send Slack notification (implemented with Slack webhook)
 * Gracefully fails if service unavailable
 */
async function sendSlackNotification(notification: any): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!slackWebhookUrl) {
    return // Silently skip if not configured
  }

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `🚨 Vantirs Alert: Dispute ${notification.stripeDisputeId} validation failed`,
        attachments: [{
          color: 'warning',
          fields: [
            { title: 'Dispute ID', value: notification.stripeDisputeId, short: true },
            { title: 'Amount', value: `$${(notification.amount / 100).toFixed(2)}`, short: true },
            { title: 'Evidence Due', value: new Date(notification.evidenceDueBy).toLocaleDateString(), short: true },
            { title: 'Errors', value: notification.errors.join(', '), short: false },
          ],
          actions: [{
            type: 'button',
            text: 'View Dashboard',
            url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          }]
        }]
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Slack webhook error: ${error}`)
    }

    logger.info({
      event: 'SLACK_NOTIFICATION_SENT',
      disputeId: notification.disputeId,
    })
  } catch (error: any) {
    logger.error({
      event: 'SLACK_NOTIFICATION_ERROR',
      disputeId: notification.disputeId,
      error: error.message,
    })
    throw error // Re-throw to trigger fallback
  }
}



