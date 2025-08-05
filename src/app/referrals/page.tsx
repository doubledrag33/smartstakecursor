import { getUser } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReferralDashboard } from '@/components/referrals/referral-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Referrals - SmartStake',
  description: 'Invite friends and earn free months when they subscribe',
}

export default async function ReferralsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseClient()
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Get or create user's referral code
  let { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)

  let referralCode = ''
  
  if (!referrals || referrals.length === 0) {
    // Generate unique referral code
    referralCode = `${user.email?.split('@')[0]?.toUpperCase() || 'USER'}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Create referral record
    const { data: newReferral } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.id,
        referral_code: referralCode,
        status: 'pending'
      })
      .select()
      .single()

    if (newReferral) {
      referrals = [newReferral]
    }
  } else {
    referralCode = referrals[0].referral_code
  }

  // Get referral statistics
  const { data: completedReferrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .eq('status', 'completed')

  const { data: pendingReferrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .eq('status', 'pending')
    .not('referee_id', 'is', null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              {profile.display_name || user.email}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🎁 Invite Friends, Get Rewarded
          </h2>
          <p className="text-gray-600">
            Share SmartStake with your friends and get 1 free month when they subscribe. 
            They'll also get their 7-day free trial!
          </p>
        </div>

        <ReferralDashboard
          referralCode={referralCode}
          completedReferrals={completedReferrals || []}
          pendingReferrals={pendingReferrals || []}
          userEmail={user.email || ''}
        />
      </main>
    </div>
  )
}