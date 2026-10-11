import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Max has two prices: students pay the regular Max price, teachers pay the teacher
// Max price (it includes the AI Teacher Avatar). Both give the 'max' tier.
export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    tier: 'pro' as const,
  },
  max: {
    priceId: process.env.STRIPE_MAX_PRICE_ID!,
    tier: 'max' as const,
  },
  maxTeacher: {
    priceId: process.env.STRIPE_TEACHER_MAX_PRICE_ID!,
    tier: 'max' as const,
  },
};

export function tierForPriceId(priceId: string | undefined): 'free' | 'pro' | 'max' {
  if (!priceId) return 'free';
  if (priceId === STRIPE_PLANS.max.priceId || priceId === STRIPE_PLANS.maxTeacher.priceId) return 'max';
  if (priceId === STRIPE_PLANS.pro.priceId) return 'pro';
  return 'free';
}

export type BillingPlan = 'pro' | 'max' | 'max_teacher';

/** Which paid plan a Stripe price is: student Max and teacher Max both give the 'max' tier. */
export function billingPlanForPriceId(priceId: string | undefined): BillingPlan | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PLANS.maxTeacher.priceId) return 'max_teacher';
  if (priceId === STRIPE_PLANS.max.priceId) return 'max';
  if (priceId === STRIPE_PLANS.pro.priceId) return 'pro';
  return null;
}
