'use client'

import { useState } from 'react'
import { Copy, Share2, Users, Gift, TrendingUp } from 'lucide-react'
import { Referral } from '@/lib/supabase/types'

interface ReferralDashboardProps {
  referralCode: string
  completedReferrals: Referral[]
  pendingReferrals: Referral[]
  userEmail: string
}

export function ReferralDashboard({
  referralCode,
  completedReferrals,
  pendingReferrals,
  userEmail
}: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false)
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const referralUrl = `${baseUrl}/pricing?ref=${referralCode}`
  
  const totalReferrals = completedReferrals.length + pendingReferrals.length
  const completedCount = completedReferrals.length
  const pendingCount = pendingReferrals.length
  const monthsEarned = completedCount // 1 month per completed referral

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferral = async () => {
    const shareData = {
      title: 'SmartStake - Professional Betting Tracker',
      text: 'Track your betting performance like a pro with SmartStake! Get 7 days free trial.',
      url: referralUrl
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying
      copyToClipboard()
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invites</p>
              <p className="text-2xl font-bold text-gray-900">{totalReferrals}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Months Earned</p>
              <p className="text-2xl font-bold text-purple-600">{monthsEarned}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
          </div>
          
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          
          <button
            onClick={shareReferral}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Share this link with friends to invite them to SmartStake. You'll get 1 free month when they subscribe!
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Referrals Work</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Share Your Link</h4>
            <p className="text-sm text-gray-600">
              Send your unique referral link to friends via email, social media, or messaging apps.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Friend Subscribes</h4>
            <p className="text-sm text-gray-600">
              Your friend signs up using your link and completes their subscription after the free trial.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">You Get Rewarded</h4>
            <p className="text-sm text-gray-600">
              Receive 1 free month added to your subscription. No limit on referrals!
            </p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      {(completedReferrals.length > 0 || pendingReferrals.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral History</h3>
          
          <div className="space-y-4">
            {completedReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Gift className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Referral Completed</p>
                    <p className="text-sm text-gray-600">
                      {referral.completed_at ? new Date(referral.completed_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+1 Month</p>
                  <p className="text-xs text-green-600">Reward Granted</p>
                </div>
              </div>
            ))}

            {pendingReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Referral Signed Up</p>
                    <p className="text-sm text-gray-600">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-yellow-600">Pending</p>
                  <p className="text-xs text-yellow-600">Awaiting Subscription</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalReferrals === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Referring Friends</h3>
          <p className="text-gray-600 mb-6">
            Share your referral link to start earning free months. Every successful referral gives you 1 month free!
          </p>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Referral Link
          </button>
        </div>
      )}
    </div>
  )
}