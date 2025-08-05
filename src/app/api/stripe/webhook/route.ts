import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const referralCode = session.metadata?.referralCode

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // Get the subscription from the session
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Update user profile with subscription info
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        // Handle referral if present
        if (referralCode) {
          // Find the referral record
          const { data: referral } = await supabase
            .from('referrals')
            .select('*')
            .eq('referral_code', referralCode)
            .eq('status', 'pending')
            .single()

          if (referral) {
            // Update referral status and grant reward
            await supabase
              .from('referrals')
              .update({
                referee_id: userId,
                status: 'completed',
                completed_at: new Date().toISOString(),
                reward_granted: true,
              })
              .eq('id', referral.id)

            // Extend referrer's subscription by 1 month
            const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('stripe_subscription_id')
              .eq('id', referral.referrer_id)
              .single()

            if (referrerProfile?.stripe_subscription_id) {
              try {
                // Add 1 month credit to referrer's subscription
                await stripe.subscriptions.update(
                  referrerProfile.stripe_subscription_id,
                  {
                    metadata: {
                      referral_credit: 'true',
                      referral_from: userId,
                    },
                  }
                )
              } catch (error) {
                console.error('Error adding referral credit:', error)
              }
            }
          }
        }

        console.log('Subscription activated for user:', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('No userId in subscription metadata')
          break
        }

        let subscriptionStatus: 'active' | 'cancelled' | 'expired' = 'active'

        if (subscription.status === 'canceled') {
          subscriptionStatus = 'cancelled'
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          subscriptionStatus = 'expired'
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: subscriptionStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log('Subscription updated for user:', userId, 'Status:', subscriptionStatus)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('No userId in subscription metadata')
          break
        }

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log('Subscription canceled for user:', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('No userId in subscription metadata')
          break
        }

        // Mark subscription as expired after payment failure
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log('Payment failed for user:', userId)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}