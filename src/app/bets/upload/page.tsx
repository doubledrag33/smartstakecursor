import { getUser } from '@/lib/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PhotoUploadForm } from '@/components/bets/photo-upload-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload Betting Slips - SmartStake',
  description: 'Upload photos of your betting slips for automatic data extraction',
}

export default async function UploadBetsPage() {
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

  // Get user profile for subscription check
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  // Check if user can use OCR feature
  const now = new Date()
  const trialEnded = profile?.trial_ends_at && new Date(profile.trial_ends_at) < now
  const hasActiveSubscription = profile?.subscription_status === 'active'
  const canUseOCR = !trialEnded || hasActiveSubscription

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
              <h1 className="text-2xl font-bold text-gray-900">Upload Betting Slips</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!canUseOCR && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Subscription Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your free trial has ended. Subscribe to continue using the photo upload feature.
                  <a href="/pricing" className="font-medium underline hover:no-underline ml-1">
                    View pricing →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📷 Photo Upload & OCR
            </h2>
            <p className="text-sm text-gray-600">
              Upload photos of your betting slips and we'll automatically extract the bet information using AI.
              Supports Sisal, GoldBet, Bet365, CPlay, and other major bookmakers.
            </p>
          </div>

          <PhotoUploadForm 
            bankrolls={bankrolls}
            canUseOCR={canUseOCR}
          />
        </div>

        {/* Features & Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📋 Supported Information
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Stake amount</li>
              <li>• Odds (decimal/fractional)</li>
              <li>• Bookmaker name</li>
              <li>• Sport & event details</li>
              <li>• Market type (1X2, Over/Under, etc.)</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              💡 Tips for Best Results
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• Take clear, well-lit photos</li>
              <li>• Ensure text is readable</li>
              <li>• Crop to show only the bet slip</li>
              <li>• Avoid shadows and glare</li>
              <li>• Upload multiple angles if needed</li>
            </ul>
          </div>
        </div>

        {/* Alternative Method */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Prefer manual entry?
          </h3>
          <p className="text-sm text-gray-600">
            You can always add bets manually for complete control over the data.
            <a href="/bets/new" className="font-medium text-blue-600 hover:text-blue-700 ml-1">
              Add bet manually →
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}