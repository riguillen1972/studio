import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify user is on Max tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.tier !== 'max') {
      return NextResponse.json({ error: 'Overage sessions are only available on the Max tier.' }, { status: 403 });
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found.' }, { status: 400 });
    }

    // 2. Fetch the overage price ID from env
    // (If you haven't created this in Stripe yet, you'll need to create a $2 one-time price product)
    const overagePriceId = process.env.STRIPE_OVERAGE_PRICE_ID;
    
    if (!overagePriceId) {
      console.warn("STRIPE_OVERAGE_PRICE_ID is missing. Overage billing is disabled.");
      return NextResponse.json({ error: 'Overage billing is not configured yet.' }, { status: 501 });
    }

    // 3. Create Stripe Checkout Session (payment mode for one-off $2 charge)
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: overagePriceId,
          quantity: 1, // 1 additional session
        },
      ],
      metadata: {
        user_id: user.id,
        type: 'session_overage'
      },
      // When successful, they return to the dashboard and we can increment their monthly_session_counts in the webhook
      success_url: `${request.nextUrl.origin}/dashboard?overage=success`,
      cancel_url: `${request.nextUrl.origin}/dashboard?overage=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Overage checkout session creation failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
