import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceType, referralCode } = await request.json()

    // Validate price type
    if (!priceType || !['monthly', 'semiannual'].includes(priceType)) {
      return NextResponse.json({ error: 'Invalid price type' }, { status: 400 })
    }

    const priceId = STRIPE_PRICES[priceType as keyof typeof STRIPE_PRICES]

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user already has active subscription
    if (profile.subscription_status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      priceId,
      successUrl: `${baseUrl}/dashboard?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      couponId: priceType === 'monthly' ? 'TRIAL7D' : undefined, // 7-day trial coupon
      referralCode,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}