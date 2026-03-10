/**
 * Default Stripe client (single-tenant / fallback).
 * Multi-tenant routes use getMerchantStripe(merchantId) from merchant-stripe.ts instead.
 */
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})












