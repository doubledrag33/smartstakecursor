'use client'

import { BetWithImages } from '@/lib/supabase/types'
import { formatDistanceToNow } from 'date-fns'

interface RecentBetsProps {
  bets: BetWithImages[]
}

export function RecentBets({ bets }: RecentBetsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Won
          </span>
        )
      case 'lost':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Lost
          </span>
        )
      case 'void':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Void
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
    }
  }

  const getSportEmoji = (sport: string) => {
    const sportLower = sport.toLowerCase()
    if (sportLower.includes('football') || sportLower.includes('soccer')) return '⚽'
    if (sportLower.includes('tennis')) return '🎾'
    if (sportLower.includes('basketball')) return '🏀'
    if (sportLower.includes('baseball')) return '⚾'
    if (sportLower.includes('hockey')) return '🏒'
    return '🏆'
  }

  if (bets.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bets yet</h3>
        <p className="text-gray-600 mb-4">
          Start tracking your betting performance by adding your first bet.
        </p>
        <a
          href="/bets/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Your First Bet
        </a>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="divide-y divide-gray-200">
        {bets.map((bet) => (
          <div key={bet.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {getSportEmoji(bet.sport)}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {bet.event}
                    </h3>
                    {getStatusBadge(bet.status)}
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                    <span>{bet.sport}</span>
                    <span>•</span>
                    <span>{bet.bookmaker}</span>
                    <span>•</span>
                    <span>{bet.market}</span>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(bet.placed_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-right">
                  <div className="text-gray-600">Stake</div>
                  <div className="font-medium">{formatCurrency(bet.stake)}</div>
                </div>
                
                <div className="text-right">
                  <div className="text-gray-600">Odds</div>
                  <div className="font-medium">{bet.odds}</div>
                </div>
                
                <div className="text-right">
                  <div className="text-gray-600">
                    {bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : 'Potential'}
                  </div>
                  <div className={`font-medium ${
                    bet.status === 'won' ? 'text-green-600' : 
                    bet.status === 'lost' ? 'text-red-600' : 
                    'text-gray-900'
                  }`}>
                    {bet.status === 'won' ? 
                      formatCurrency(bet.actual_win || bet.potential_win) :
                      bet.status === 'lost' ? 
                      `-${formatCurrency(bet.stake)}` :
                      formatCurrency(bet.potential_win)
                    }
                  </div>
                </div>
                
                {bet.bet_images && bet.bet_images.length > 0 && (
                  <div className="text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {bet.notes && (
              <div className="mt-3 text-sm text-gray-600 pl-10">
                "{bet.notes}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}