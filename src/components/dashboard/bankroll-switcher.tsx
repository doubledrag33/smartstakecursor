'use client'

import { useState } from 'react'
import { Bankroll } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

interface BankrollSwitcherProps {
  bankrolls: Bankroll[]
  currentBankroll: Bankroll | null
}

export function BankrollSwitcher({ bankrolls, currentBankroll }: BankrollSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleBankrollChange = (bankrollId: string) => {
    setIsOpen(false)
    // For now, we'll just refresh the page with the new bankroll
    // In a real app, you'd want to use URL params or state management
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          {currentBankroll?.name || 'Select Bankroll'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {bankrolls.map((bankroll) => (
              <button
                key={bankroll.id}
                onClick={() => handleBankrollChange(bankroll.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                  currentBankroll?.id === bankroll.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <div>
                  <div className="font-medium">{bankroll.name}</div>
                  <div className="text-xs text-gray-500">{bankroll.currency}</div>
                </div>
                {bankroll.is_default && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Default
                  </span>
                )}
                {currentBankroll?.id === bankroll.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
            
            <div className="border-t border-gray-200 mt-1 pt-1">
              <a
                href="/bankrolls"
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Manage Bankrolls
              </a>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}