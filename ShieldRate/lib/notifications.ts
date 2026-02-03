import { supabaseAdmin } from './supabase'
import { logger, LogEvents } from './logger'

/**
 * Send notification when validation fails or manual attention needed
 */
export async function sendValidationFailureNotification(
  disputeId: string,
  stripeDisputeId: string,
  errors: string[]
): Promise<void> {
  // Fetch dispute details for notification
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('amount, evidence_due_by, customer_id')
    .eq('id', disputeId)
    .single()

  if (!dispute) return

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
    action: 'merchant_notification_required',
  })

  // Store notification in dispute metadata for dashboard alerts
  await supabaseAdmin
    .from('disputes')
    .update({
      notification_metadata: {
        last_notification: notification,
        notification_sent_at: new Date().toISOString(),
      }
    })
    .eq('id', disputeId)

  // TODO: Implement actual notification channels
  // Option 1: Email notification
  // await sendEmailNotification(notification)
  
  // Option 2: Slack webhook
  // await sendSlackNotification(notification)
  
  // For now, we'll rely on dashboard alerts
  // The dispute status 'needs_attention' will show in the UI
}

/**
 * Send email notification (implement with your email service)
 * Example: SendGrid, Resend, AWS SES, etc.
 */
async function sendEmailNotification(notification: any): Promise<void> {
  // Implement with your email service
  // Example with Resend:
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'alerts@shieldrate.com',
  //     to: merchantEmail,
  //     subject: `🚨 ShieldRate Alert: Dispute ${notification.stripeDisputeId} Needs Attention`,
  //     html: `
  //       <h2>PDF Validation Failed</h2>
  //       <p>Dispute ${notification.stripeDisputeId} requires manual attention.</p>
  //       <ul>
  //         <li>Amount: $${(notification.amount / 100).toFixed(2)}</li>
  //         <li>Evidence Due: ${new Date(notification.evidenceDueBy).toLocaleDateString()}</li>
  //         <li>Errors: ${notification.errors.join(', ')}</li>
  //       </ul>
  //       <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/disputes/${notification.disputeId}">View Dispute</a></p>
  //     `,
  //   })
  // })
}

/**
 * Send Slack notification (implement with Slack webhook)
 */
async function sendSlackNotification(notification: any): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!slackWebhookUrl) return

  // Implement with Slack webhook
  // await fetch(slackWebhookUrl, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     text: `🚨 ShieldRate Alert: Dispute ${notification.stripeDisputeId} validation failed`,
  //     attachments: [{
  //       color: 'warning',
  //       fields: [
  //         { title: 'Dispute ID', value: notification.stripeDisputeId, short: true },
  //         { title: 'Amount', value: `$${(notification.amount / 100).toFixed(2)}`, short: true },
  //         { title: 'Evidence Due', value: new Date(notification.evidenceDueBy).toLocaleDateString(), short: true },
  //         { title: 'Errors', value: notification.errors.join(', '), short: false },
  //       ],
  //       actions: [{
  //         type: 'button',
  //         text: 'View Dispute',
  //         url: `${process.env.NEXT_PUBLIC_APP_URL}/disputes/${notification.disputeId}`,
  //       }]
  //     }]
  //   })
  // })
}

