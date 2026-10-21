// Single source of truth for subscription plans: prices, token limits, and
// the marketing copy shown on the home page and the Profile page.
// Keep the prices here in sync with the Stripe prices
// (STRIPE_PRO_PRICE_ID / STRIPE_MAX_PRICE_ID / STRIPE_TEACHER_MAX_PRICE_ID).

import toolsData from '@/lib/tools.json';

export type SubscriptionTier = 'free' | 'pro' | 'max';
export type UsageModel = 'gemma3' | 'flash' | 'pro' | 'haiku';

// Monthly token limits per tier and model. 0 means the model is not available on that tier.
// Free runs on Gemini 2.5 Flash-Lite; Pro and Max run on Claude Haiku 5.5 only.
// ('flash' and 'pro' are kept as usage buckets for older records.)
export const TOKEN_LIMITS: Record<SubscriptionTier, Record<UsageModel, number>> = {
  free: { gemma3: 250_000, flash: 0, pro: 0, haiku: 0 },
  pro: { gemma3: 500_000, flash: 0, pro: 0, haiku: 1_500_000 },
  max: { gemma3: 500_000, flash: 0, pro: 0, haiku: 4_000_000 },
};

// Column in the token_usage table that tracks each model.
export const USAGE_COLUMNS: Record<UsageModel, 'flash_lite_used' | 'flash_used' | 'pro_used' | 'haiku_used'> = {
  gemma3: 'flash_lite_used',
  flash: 'flash_used',
  pro: 'pro_used',
  haiku: 'haiku_used',
};

export const MODEL_LABELS: Record<UsageModel, string> = {
  gemma3: 'Gemini 2.5 Flash-Lite',
  flash: 'Gemini 2.5 Flash',
  pro: 'Gemini 2.5 Pro',
  haiku: 'Claude Haiku 5.5',
};

export function defaultModelForTier(tier: SubscriptionTier): UsageModel {
  return tier === 'free' ? 'gemma3' : 'haiku';
}

/**
 * The model a request actually runs on: the requested one if the plan includes it, otherwise
 * the plan's default. Decided on the server, so a client can't pick a pricier model.
 */
export function resolveModel(tier: SubscriptionTier, requested: string | null | undefined): UsageModel {
  if (!requested) return defaultModelForTier(tier);
  const model = toUsageModel(requested);
  return model && TOKEN_LIMITS[tier][model] > 0 ? model : defaultModelForTier(tier);
}

/**
 * Maps any model identifier the app or the mobile client may send
 * ('gemma3', 'free', 'gemini-2.5-flash-lite', 'googleai/gemini-2.5-pro', ...)
 * to the model bucket used for usage tracking. Undefined means the flow default (Flash-Lite).
 */
export function toUsageModel(model: string | null | undefined): UsageModel | null {
  if (!model) return 'gemma3';
  const m = model.toLowerCase();
  if (m === 'gemma3' || m === 'free' || m.includes('flash-lite')) return 'gemma3';
  if (m === 'haiku' || m.includes('haiku') || m.includes('claude')) return 'haiku';
  if (m === 'pro' || m.includes('gemini-2.5-pro')) return 'pro';
  if (m === 'flash' || m.includes('flash')) return 'flash';
  return null;
}

// Paid plans are advertised by their Claude allowance (the Flash-Lite fallback isn't counted).
const premiumTokens = (tier: SubscriptionTier) => TOKEN_LIMITS[tier].haiku;

const formatTokens = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1_000}k`);

export const AI_TOOL_COUNT = toolsData.categories.reduce((sum, c) => sum + c.tools.length, 0);

export interface PlanInfo {
  name: string;
  price: number;
  priceLabel: string;
  tokenSummary: string;
}

export const PLANS: Record<SubscriptionTier, PlanInfo> = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    tokenSummary: `${formatTokens(TOKEN_LIMITS.free.gemma3)} tokens/month`,
  },
  pro: {
    name: 'Pro',
    price: 15,
    priceLabel: '$15',
    tokenSummary: `${formatTokens(premiumTokens('pro'))} tokens/month`,
  },
  max: {
    name: 'Max',
    price: 24.99,
    priceLabel: '$24.99',
    tokenSummary: `${formatTokens(premiumTokens('max'))} tokens/month`,
  },
};

// Teachers pay more for Max because it includes the Live AI Teacher Avatar. Same 'max' tier and limits.
export const TEACHER_MAX: PlanInfo = {
  ...PLANS.max,
  price: 39.99,
  priceLabel: '$39.99',
};

export const TEACHER_AVATAR_FEATURE = 'Live AI Teacher Avatar (20 sessions/mo)';

// Students in these grades are likely under 13. Under COPPA they may only sign up
// through a teacher's class code (school consent), never on their own.
export const UNDER_13_MAX_GRADE = 7;

export function requiresSchoolConsent(role: string | null | undefined, gradeLevel: string | null | undefined): boolean {
  if (role !== 'k12') return false;
  const grade = parseInt(gradeLevel ?? '', 10);
  // A K-12 student with no grade is treated as under 13 to be safe.
  return Number.isNaN(grade) || grade <= UNDER_13_MAX_GRADE;
}
