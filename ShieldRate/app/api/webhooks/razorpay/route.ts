import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { updateMerchantPlanFromRazorpaySubscription } from '@/lib/razorpay-billing'
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

/**
 * Razorpay Webhook Handler
 * Handles subscription events: created, activated, charged, cancelled, etc.
 * 
 * Webhook URL: /api/webhooks/razorpay
 * 
 * Events to listen for:
 * - subscription.created
 * - subscription.activated
 * - subscription.charged
 * - subscription.cancelled
 * - payment.captured
 * - payment.failed
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.error({
      event: 'RAZORPAY_WEBHOOK_SECRET_MISSING',
      endpoint: '/api/webhooks/razorpay',
    })
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const body = await req.text()
  const razorpaySignature = req.headers.get('x-razorpay-signature')

  if (!razorpaySignature) {
    return NextResponse.json(
      { error: 'Missing x-razorpay-signature header' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  if (razorpaySignature !== expectedSignature) {
    logger.error({
      event: 'RAZORPAY_WEBHOOK_SIGNATURE_VERIFICATION_FAILED',
      received: razorpaySignature.substring(0, 20) + '...',
    })
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  let event: any
  try {
    event = JSON.parse(body)
  } catch (err: any) {
    logger.error({
      event: 'RAZORPAY_WEBHOOK_JSON_PARSE_FAILED',
      error: err.message,
    })
    return NextResponse.json(
      { error: 'Invalid JSON in webhook body' },
      { status: 400 }
    )
  }

  logger.info({
    event: 'RAZORPAY_WEBHOOK_RECEIVED',
    type: event.event,
    id: event.payload?.subscription?.id || event.payload?.payment?.id,
  })

  try {
    switch (event.event) {
      case 'subscription.created':
      case 'subscription.activated': {
        const subscription = event.payload.subscription.entity
        await updateMerchantPlanFromRazorpaySubscription(
          subscription.id,
          subscription.status
        )
        
        logger.info({
          event: 'RAZORPAY_SUBSCRIPTION_ACTIVATED',
          subscriptionId: subscription.id,
          merchantId: subscription.notes?.vantirs_merchant_id,
        })
        break
      }

      case 'subscription.charged': {
        const subscription = event.payload.subscription.entity
        const payment = event.payload.payment.entity
        
        // Update merchant plan if needed
        await updateMerchantPlanFromRazorpaySubscription(
          subscription.id,
          subscription.status
        )
        
        logger.info({
          event: 'RAZORPAY_SUBSCRIPTION_CHARGED',
          subscriptionId: subscription.id,
          paymentId: payment.id,
          amount: payment.amount,
        })
        break
      }

      case 'subscription.cancelled': {
        const subscription = event.payload.subscription.entity
        const merchantId = subscription.notes?.vantirs_merchant_id
        
        if (merchantId) {
          // Downgrade to free plan
          await supabaseAdmin
            .from('merchants')
            .update({
              plan: 'free',
              disputes_limit: 2,
              subscription_status: 'canceled',
              subscription_ends_at: subscription.ended_at
                ? new Date(subscription.ended_at * 1000).toISOString()
                : new Date().toISOString(),
            })
            .eq('id', merchantId)

          logger.info({
            event: 'RAZORPAY_SUBSCRIPTION_CANCELLED',
            subscriptionId: subscription.id,
            merchantId,
          })
        }
        break
      }

      case 'payment.captured': {
        const payment = event.payload.payment.entity
        
        // If payment is for a subscription, update subscription status
        if (payment.subscription_id) {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          })
          
          const subscription = await razorpay.subscriptions.fetch(payment.subscription_id)
          await updateMerchantPlanFromRazorpaySubscription(
            subscription.id,
            subscription.status
          )
          
          logger.info({
            event: 'RAZORPAY_PAYMENT_CAPTURED',
            paymentId: payment.id,
            subscriptionId: payment.subscription_id,
            amount: payment.amount,
          })
        }
        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity
        
        if (payment.subscription_id) {
          const merchantId = payment.notes?.vantirs_merchant_id
          
          if (merchantId) {
            await supabaseAdmin
              .from('merchants')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', merchantId)

            logger.warn({
              event: 'RAZORPAY_PAYMENT_FAILED',
              paymentId: payment.id,
              subscriptionId: payment.subscription_id,
              merchantId,
            })
          }
        }
        break
      }

      default:
        logger.info({
          event: 'RAZORPAY_WEBHOOK_UNHANDLED',
          type: event.event,
        })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error({
      event: 'RAZORPAY_WEBHOOK_PROCESSING_ERROR',
      type: event.event,
      error: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    )
  }
}






