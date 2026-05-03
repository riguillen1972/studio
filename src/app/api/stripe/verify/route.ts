import { NextResponse } from 'next/server';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Admin client for updating profiles (bypasses RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to find their Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, tier')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ tier: profile?.tier || 'free', synced: false, reason: 'no_customer_id' });
    }

    // List the customer's active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription — ensure they're on free
      if (profile.tier !== 'free') {
        await supabaseAdmin
          .from('profiles')
          .update({ tier: 'free' })
          .eq('id', user.id);
      }
      return NextResponse.json({ tier: 'free', synced: true });
    }

    // Determine tier from the subscription's price ID
    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price?.id;
    let correctTier = 'free';
    if (priceId === STRIPE_PLANS.max.priceId) correctTier = 'max';
    else if (priceId === STRIPE_PLANS.pro.priceId) correctTier = 'pro';

    // Update if different
    if (profile.tier !== correctTier) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          tier: correctTier,
          stripe_subscription_id: sub.id,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update tier:', error);
        return NextResponse.json({ error: 'Failed to update tier', details: error.message }, { status: 500 });
      }

      console.log(`✅ Verified & synced user ${user.id} to ${correctTier}`);
    }

    return NextResponse.json({ tier: correctTier, synced: true });
  } catch (error) {
    console.error('Verify failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
