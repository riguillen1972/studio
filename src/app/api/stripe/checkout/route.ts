import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PLANS, tierForPriceId, billingPlanForPriceId } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/usage';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    if (plan !== 'pro' && plan !== 'max') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Stripe fields on profiles can only be written by the server (see guard_profile_changes)
    const admin = getAdminClient();

    // Check if user already has a Stripe customer ID
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, role')
      .eq('id', user.id)
      .single();

    // Teachers pay the teacher Max price (includes the AI Teacher Avatar)
    const planConfig = plan === 'max' && profile?.role === 'teacher'
      ? STRIPE_PLANS.maxTeacher
      : STRIPE_PLANS[plan as 'pro' | 'max'];

    if (!planConfig.priceId) {
      console.error(`Missing Stripe price ID for ${plan}${profile?.role === 'teacher' ? ' (teacher)' : ''}`);
      return NextResponse.json({ error: 'This plan is not available yet. Please contact support.' }, { status: 500 });
    }

    let customerId = profile?.stripe_customer_id;

    // Validate the existing customer ID is valid in the current mode
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        // Customer doesn't exist in this mode (e.g. test ID used in live mode) — clear it
        console.log(`Stale customer ID ${customerId} cleared, creating new one.`);
        customerId = null;
        await admin
          .from('profiles')
          .update({ stripe_customer_id: null, stripe_subscription_id: null })
          .eq('id', user.id);
      }
    }

    // Create a Stripe customer if they don't have one (or it was cleared above)
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Store the new customer ID
      await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Already subscribed (e.g. Pro -> Max, or a teacher on student Max -> Teacher Max):
    // change the price on the existing subscription instead of starting a second one.
    if (profile?.stripe_subscription_id) {
      try {
        const existing = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        if (existing.status === 'active' || existing.status === 'trialing') {
          const item = existing.items.data[0];
          if (item?.price?.id === planConfig.priceId) {
            return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 });
          }
          await stripe.subscriptions.update(existing.id, {
            items: [{ id: item.id, price: planConfig.priceId }],
            proration_behavior: 'create_prorations',
            metadata: { user_id: user.id, tier: planConfig.tier },
          });
          await admin
            .from('profiles')
            .update({ tier: tierForPriceId(planConfig.priceId), billing_plan: billingPlanForPriceId(planConfig.priceId) })
            .eq('id', user.id);
          return NextResponse.json({ url: `${request.nextUrl.origin}/profile?upgrade=success` });
        }
      } catch (e) {
        // Missing or stale subscription: fall through to a new checkout
        console.log('Existing subscription not usable, starting a new checkout:', e);
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        tier: planConfig.tier,
        price_id: planConfig.priceId,
      },
      success_url: `${request.nextUrl.origin}/profile?upgrade=success`,
      cancel_url: `${request.nextUrl.origin}/profile?upgrade=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
