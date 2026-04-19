import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (webhook runs without user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          // Update the user's tier and store stripe customer ID
          await supabaseAdmin
            .from('profiles')
            .update({
              tier,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId);

          console.log(`✅ User ${userId} upgraded to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Determine tier from the price ID
          const priceId = subscription.items.data[0]?.price?.id;
          let newTier = 'free';
          if (priceId === STRIPE_PLANS.max.priceId) newTier = 'max';
          else if (priceId === STRIPE_PLANS.pro.priceId) newTier = 'pro';

          // If subscription is active or trialing, set the tier; otherwise downgrade
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await supabaseAdmin
              .from('profiles')
              .update({ tier: newTier })
              .eq('id', profile.id);
            console.log(`✅ User ${profile.id} subscription updated to ${newTier}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user and downgrade to free
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({ tier: 'free', stripe_subscription_id: null })
            .eq('id', profile.id);
          console.log(`✅ User ${profile.id} downgraded to free (subscription cancelled)`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
