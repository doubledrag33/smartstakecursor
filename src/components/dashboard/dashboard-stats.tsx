import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BankrollStats } from '@/lib/supabase/types'

interface DashboardStatsProps {
  bankrollId: string
}

/**
 * Calculate betting statistics for a bankroll
 */
async function calculateStats(bankrollId: string): Promise<BankrollStats> {
  const supabase = await createServerSupabaseClient()
  
  const { data: bets } = await supabase
    .from('bets')
    .select('stake, odds, status, actual_win, potential_win')
    .eq('bankroll_id', bankrollId)

  if (!bets || bets.length === 0) {
    return {
      total_bets: 0,
      total_stake: 0,
      total_winnings: 0,
      roi: 0,
      yield: 0,
      profit_loss: 0
    }
  }

  const totalBets = bets.length
  const totalStake = bets.reduce((sum, bet) => sum + Number(bet.stake), 0)
  
  // Calculate winnings (only from won bets)
  const wonBets = bets.filter(bet => bet.status === 'won')
  const totalWinnings = wonBets.reduce((sum, bet) => {
    return sum + (bet.actual_win || bet.potential_win || 0)
  }, 0)

  // Calculate losses (stake from lost bets)
  const lostBets = bets.filter(bet => bet.status === 'lost')
  const totalLosses = lostBets.reduce((sum, bet) => sum + Number(bet.stake), 0)

  const profitLoss = totalWinnings - totalLosses
  const roi = totalStake > 0 ? (profitLoss / totalStake) * 100 : 0
  const yieldValue = totalStake > 0 ? (totalWinnings / totalStake) * 100 : 0

  return {
    total_bets: totalBets,
    total_stake: totalStake,
    total_winnings: totalWinnings,
    roi: roi,
    yield: yieldValue,
    profit_loss: profitLoss
  }
}

export async function DashboardStats({ bankrollId }: DashboardStatsProps) {
  const stats = await calculateStats(bankrollId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Bets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Bets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_bets}</p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xl">📊</span>
          </div>
        </div>
      </div>

      {/* Total Stake */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Stake</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.total_stake)}
            </p>
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 text-xl">💰</span>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">ROI</p>
            <p className={`text-2xl font-bold ${getColorClass(stats.roi)}`}>
              {formatPercentage(stats.roi)}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
            stats.roi > 0 ? 'bg-green-100' : stats.roi < 0 ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <span className={`text-xl ${
              stats.roi > 0 ? 'text-green-600' : stats.roi < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats.roi > 0 ? '📈' : stats.roi < 0 ? '📉' : '➡️'}
            </span>
          </div>
        </div>
      </div>

      {/* Profit/Loss */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
            <p className={`text-2xl font-bold ${getColorClass(stats.profit_loss)}`}>
              {formatCurrency(stats.profit_loss)}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
            stats.profit_loss > 0 ? 'bg-green-100' : stats.profit_loss < 0 ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <span className={`text-xl ${
              stats.profit_loss > 0 ? 'text-green-600' : stats.profit_loss < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats.profit_loss > 0 ? '🟢' : stats.profit_loss < 0 ? '🔴' : '⚪'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}