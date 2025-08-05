'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bankroll, SportsLeague } from '@/lib/supabase/types'

// Form validation schema
const betFormSchema = z.object({
  bankroll_id: z.string().min(1, 'Please select a bankroll'),
  stake: z.number().positive('Stake must be positive'),
  odds: z.number().min(1.01, 'Odds must be at least 1.01'),
  bookmaker: z.string().min(1, 'Bookmaker is required'),
  sport: z.string().min(1, 'Sport is required'),
  event: z.string().min(1, 'Event is required'),
  market: z.string().min(1, 'Market is required'),
  placed_at: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
})

type BetFormData = z.infer<typeof betFormSchema>

interface BetFormProps {
  bankrolls: Bankroll[]
  sportsLeagues: SportsLeague[]
}

// Predefined bookmakers (Sisal, GoldBet, Bet365, CPlay as priority)
const BOOKMAKERS = [
  'Sisal',
  'GoldBet', 
  'Bet365',
  'CPlay',
  'Pinnacle',
  'Betfair',
  'William Hill',
  'Unibet',
  'Betway',
  'Other'
]

// Common betting markets
const COMMON_MARKETS = [
  '1X2',
  'Over/Under 2.5',
  'Both Teams to Score',
  'Double Chance',
  'Asian Handicap',
  'Correct Score',
  'First Goal Scorer',
  'Match Winner',
  'Set Winner',
  'Game Winner',
  'Other'
]

export function BetForm({ bankrolls, sportsLeagues }: BetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [potentialWin, setPotentialWin] = useState(0)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BetFormData>({
    resolver: zodResolver(betFormSchema),
    defaultValues: {
      bankroll_id: bankrolls.find(b => b.is_default)?.id || bankrolls[0]?.id || '',
      placed_at: new Date().toISOString().split('T')[0],
    }
  })

  const watchedStake = watch('stake')
  const watchedOdds = watch('odds')
  const watchedSport = watch('sport')

  // Calculate potential win when stake or odds change
  useEffect(() => {
    if (watchedStake && watchedOdds) {
      const potential = watchedStake * (watchedOdds - 1)
      setPotentialWin(potential)
    } else {
      setPotentialWin(0)
    }
  }, [watchedStake, watchedOdds])

  // Get leagues for selected sport
  const availableLeagues = sportsLeagues.filter(sl => sl.sport === watchedSport)

  const onSubmit = async (data: BetFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bet')
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating bet:', error)
      alert(error.message || 'Failed to create bet')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Bankroll Selection */}
      <div>
        <label htmlFor="bankroll_id" className="block text-sm font-medium text-gray-700 mb-1">
          Bankroll
        </label>
        <select
          {...register('bankroll_id')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {bankrolls.map((bankroll) => (
            <option key={bankroll.id} value={bankroll.id}>
              {bankroll.name} ({bankroll.currency})
              {bankroll.is_default && ' - Default'}
            </option>
          ))}
        </select>
        {errors.bankroll_id && (
          <p className="mt-1 text-sm text-red-600">{errors.bankroll_id.message}</p>
        )}
      </div>

      {/* Stake and Odds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="stake" className="block text-sm font-medium text-gray-700 mb-1">
            Stake (€)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('stake', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10.00"
          />
          {errors.stake && (
            <p className="mt-1 text-sm text-red-600">{errors.stake.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="odds" className="block text-sm font-medium text-gray-700 mb-1">
            Odds
          </label>
          <input
            type="number"
            step="0.01"
            {...register('odds', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2.00"
          />
          {errors.odds && (
            <p className="mt-1 text-sm text-red-600">{errors.odds.message}</p>
          )}
        </div>
      </div>

      {/* Potential Win Display */}
      {potentialWin > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">
            <span className="font-medium">Potential Win: €{potentialWin.toFixed(2)}</span>
            {watchedStake && (
              <span className="ml-2 text-green-600">
                (Total Return: €{(watchedStake + potentialWin).toFixed(2)})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Bookmaker */}
      <div>
        <label htmlFor="bookmaker" className="block text-sm font-medium text-gray-700 mb-1">
          Bookmaker
        </label>
        <select
          {...register('bookmaker')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select bookmaker</option>
          {BOOKMAKERS.map((bookmaker) => (
            <option key={bookmaker} value={bookmaker}>
              {bookmaker}
            </option>
          ))}
        </select>
        {errors.bookmaker && (
          <p className="mt-1 text-sm text-red-600">{errors.bookmaker.message}</p>
        )}
      </div>

      {/* Sport */}
      <div>
        <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
          Sport
        </label>
        <select
          {...register('sport')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select sport</option>
          {Array.from(new Set(sportsLeagues.map(sl => sl.sport))).map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
        {errors.sport && (
          <p className="mt-1 text-sm text-red-600">{errors.sport.message}</p>
        )}
      </div>

      {/* Event */}
      <div>
        <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
          Event
        </label>
        <input
          type="text"
          {...register('event')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Chelsea vs Arsenal"
        />
        {errors.event && (
          <p className="mt-1 text-sm text-red-600">{errors.event.message}</p>
        )}
      </div>

      {/* Market */}
      <div>
        <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-1">
          Market
        </label>
        <select
          {...register('market')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select market</option>
          {COMMON_MARKETS.map((market) => (
            <option key={market} value={market}>
              {market}
            </option>
          ))}
        </select>
        {errors.market && (
          <p className="mt-1 text-sm text-red-600">{errors.market.message}</p>
        )}
      </div>

      {/* Placed At */}
      <div>
        <label htmlFor="placed_at" className="block text-sm font-medium text-gray-700 mb-1">
          Date Placed
        </label>
        <input
          type="date"
          {...register('placed_at')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.placed_at && (
          <p className="mt-1 text-sm text-red-600">{errors.placed_at.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional notes about this bet..."
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Bet'}
        </button>
      </div>
    </form>
  )
}