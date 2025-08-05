'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface PricingCardProps {
  title: string
  price: string
  originalPrice?: string
  period: string
  description: string
  features: string[]
  priceType: 'monthly' | 'semiannual'
  isPopular?: boolean
  trialText?: string
  badge?: string
}

export function PricingCard({
  title,
  price,
  originalPrice,
  period,
  description,
  features,
  priceType,
  isPopular = false,
  trialText,
  badge
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceType,
          referralCode: new URLSearchParams(window.location.search).get('ref')
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Failed to start checkout process')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
      isPopular ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : 'border-gray-200'
    }`}>
      {badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            {badge}
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="flex items-center justify-center mb-2">
          {originalPrice && (
            <span className="text-lg text-gray-400 line-through mr-2">
              €{originalPrice}
            </span>
          )}
          <span className="text-4xl font-bold text-gray-900">€{price}</span>
          <span className="text-gray-600 ml-1">/{period}</span>
        </div>

        {priceType === 'semiannual' && (
          <p className="text-sm text-green-600 font-medium">
            Billed €{(parseFloat(price) * 6).toFixed(2)} every 6 months
          </p>
        )}

        {trialText && (
          <p className="text-sm text-blue-600 font-medium mt-2">
            {trialText}
          </p>
        )}
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
        } disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Loading...' : 'Start Free Trial'}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        No credit card required for trial
      </p>
    </div>
  )
}