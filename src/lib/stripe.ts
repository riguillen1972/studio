import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    tier: 'pro' as const,
  },
  max: {
    priceId: process.env.STRIPE_MAX_PRICE_ID!,
    tier: 'max' as const,
  },
};
