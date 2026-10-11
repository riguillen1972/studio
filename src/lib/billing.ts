// Server-only: checks for the Teacher Max plan (the $39.99 price that includes the AI Teacher).
// Student Max gives the same 'max' tier, so the tier alone isn't enough.

import { stripe, billingPlanForPriceId } from '@/lib/stripe';
import { getAdminClient } from '@/lib/usage';

export async function hasTeacherMax(userId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, billing_plan, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.tier !== 'max') return false;
  if (profile.billing_plan) return profile.billing_plan === 'max_teacher';
  if (!profile.stripe_subscription_id) return false;

  // Subscriptions from before billing_plan existed: look the price up once and remember it
  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const plan = billingPlanForPriceId(sub.items.data[0]?.price?.id);
    if (plan) await supabase.from('profiles').update({ billing_plan: plan }).eq('id', userId);
    return plan === 'max_teacher';
  } catch (e) {
    console.error('Could not look up subscription price:', e);
    return false;
  }
}
