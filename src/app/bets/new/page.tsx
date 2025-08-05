import { getUser } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BetForm } from '@/components/bets/bet-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add New Bet - SmartStake',
  description: 'Add a new bet to track your betting performance',
}

export default async function NewBetPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseClient()
  
  // Get user's bankrolls
  const { data: bankrolls } = await supabase
    .from('bankrolls')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  if (!bankrolls || bankrolls.length === 0) {
    redirect('/bankrolls?create=true')
  }

  // Get sports and leagues for dropdown
  const { data: sportsLeagues } = await supabase
    .from('sports_leagues')
    .select('*')
    .order('sport')

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
              <h1 className="text-2xl font-bold text-gray-900">Add New Bet</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Bet Details</h2>
            <p className="text-sm text-gray-600">
              Enter the details of your bet to track its performance.
            </p>
          </div>

          <BetForm 
            bankrolls={bankrolls}
            sportsLeagues={sportsLeagues || []}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tip</h3>
          <p className="text-sm text-blue-800">
            You can also upload photos of your betting slips for automatic data extraction. 
            <a href="/bets/upload" className="font-medium underline hover:no-underline ml-1">
              Try photo upload →
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}