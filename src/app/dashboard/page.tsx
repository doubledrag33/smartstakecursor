import { getUser, getUserProfile } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentBets } from '@/components/dashboard/recent-bets'
import { BankrollSwitcher } from '@/components/dashboard/bankroll-switcher'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - SmartStake',
  description: 'Track your betting performance and manage your bankrolls',
}

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseClient()
  
  // Get user profile
  const profile = await getUserProfile(user.id)
  
  if (!profile) {
    redirect('/login')
  }

  // Get user's bankrolls
  const { data: bankrolls } = await supabase
    .from('bankrolls')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  // Get default bankroll or first bankroll
  const defaultBankroll = bankrolls?.find(b => b.is_default) || bankrolls?.[0]

  if (!defaultBankroll) {
    // Create default bankroll if none exists
    const { data: newBankroll } = await supabase
      .from('bankrolls')
      .insert({
        user_id: user.id,
        name: 'Main Bankroll',
        currency: 'EUR',
        is_default: true
      })
      .select()
      .single()
    
    if (newBankroll) {
      bankrolls?.push(newBankroll)
    }
  }

  // Get recent bets for the default bankroll
  const { data: recentBets } = await supabase
    .from('bets')
    .select(`
      *,
      bet_images (
        id,
        image_url,
        ocr_text
      )
    `)
    .eq('bankroll_id', defaultBankroll?.id)
    .order('placed_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">SmartStake</h1>
              {bankrolls && bankrolls.length > 0 && (
                <BankrollSwitcher 
                  bankrolls={bankrolls} 
                  currentBankroll={defaultBankroll} 
                />
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome back, {profile.display_name || user.email}
              </span>
              
              {/* Trial status */}
              {profile.subscription_status === 'trial' && profile.trial_ends_at && (
                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Trial: {Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Dashboard Stats */}
          {defaultBankroll && (
            <DashboardStats bankrollId={defaultBankroll.id} />
          )}

          {/* Recent Bets */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Bets</h2>
                <a 
                  href="/bets" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </a>
              </div>
            </div>
            
            <RecentBets bets={recentBets || []} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/bets/new"
                className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors"
              >
                <div className="text-center">
                  <div className="text-blue-600 text-2xl mb-2">+</div>
                  <div className="text-blue-600 font-medium">Add New Bet</div>
                </div>
              </a>
              
              <a
                href="/bets/upload"
                className="flex items-center justify-center p-4 bg-green-50 rounded-lg border-2 border-dashed border-green-300 hover:border-green-400 transition-colors"
              >
                <div className="text-center">
                  <div className="text-green-600 text-2xl mb-2">📷</div>
                  <div className="text-green-600 font-medium">Upload Photos</div>
                </div>
              </a>
              
              <a
                href="/bankrolls"
                className="flex items-center justify-center p-4 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors"
              >
                <div className="text-center">
                  <div className="text-purple-600 text-2xl mb-2">💰</div>
                  <div className="text-purple-600 font-medium">Manage Bankrolls</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}