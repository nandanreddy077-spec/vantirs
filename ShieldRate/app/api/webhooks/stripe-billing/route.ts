import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { updateMerchantPlanFromSubscription } from '@/lib/stripe-billing'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/**
 * Stripe Billing Webhook Handler
 * Handles subscription events: created, updated, canceled, etc.
 * 
 * Webhook URL: /api/webhooks/stripe-billing
 * 
 * Events to listen for:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.error({
      event: 'WEBHOOK_SECRET_MISSING',
      endpoint: '/api/webhooks/stripe-billing',
    })
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    logger.error({
      event: 'WEBHOOK_SIGNATURE_VERIFICATION_FAILED',
      error: err.message,
    })
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  logger.info({
    event: 'STRIPE_BILLING_WEBHOOK_RECEIVED',
    type: event.type,
    id: event.id,
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const isCE3Addon = subscription.metadata?.type === 'ce3_addon'
          const merchantId = subscription.metadata?.vantirs_merchant_id || session.client_reference_id as string

          if (isCE3Addon && merchantId) {
            await supabaseAdmin
              .from('merchants')
              .update({ ce3_addon: true })
              .eq('id', merchantId)
            logger.info({ event: 'CE3_ADDON_ENABLED', merchantId, subscriptionId })
          } else {
            await updateMerchantPlanFromSubscription(subscription)
          }
          logger.info({
            event: 'SUBSCRIPTION_CREATED',
            subscriptionId: subscription.id,
            merchantId,
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.metadata?.type === 'ce3_addon') {
          const merchantId = subscription.metadata?.vantirs_merchant_id
          if (merchantId) {
            await supabaseAdmin.from('merchants').update({ ce3_addon: true }).eq('id', merchantId)
          }
        } else {
          await updateMerchantPlanFromSubscription(subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const merchantId = subscription.metadata?.vantirs_merchant_id
        const isCE3Addon = subscription.metadata?.type === 'ce3_addon'

        if (merchantId) {
          if (isCE3Addon) {
            await supabaseAdmin
              .from('merchants')
              .update({ ce3_addon: false })
              .eq('id', merchantId)
            logger.info({ event: 'CE3_ADDON_DISABLED', merchantId, subscriptionId: subscription.id })
          } else {
            await supabaseAdmin
              .from('merchants')
              .update({
                plan: 'free',
                disputes_limit: 5,
                subscription_status: 'canceled',
                subscription_ends_at: new Date().toISOString(),
              })
              .eq('id', merchantId)
            logger.info({
              event: 'SUBSCRIPTION_DELETED',
              subscriptionId: subscription.id,
              merchantId,
            })
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await updateMerchantPlanFromSubscription(subscription)
          
          logger.info({
            event: 'INVOICE_PAYMENT_SUCCEEDED',
            invoiceId: invoice.id,
            subscriptionId,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const merchantId = subscription.metadata?.vantirs_merchant_id
          
          if (merchantId) {
            await supabaseAdmin
              .from('merchants')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', merchantId)

            logger.warn({
              event: 'INVOICE_PAYMENT_FAILED',
              invoiceId: invoice.id,
              subscriptionId,
              merchantId,
            })
          }
        }
        break
      }

      default:
        logger.info({
          event: 'UNHANDLED_WEBHOOK_EVENT',
          type: event.type,
        })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error({
      event: 'WEBHOOK_PROCESSING_ERROR',
      type: event.type,
      error: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    )
  }
}








