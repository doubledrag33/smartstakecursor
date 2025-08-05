'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Bankroll } from '@/lib/supabase/types'
import { Loader2, Upload, X, Check, AlertCircle } from 'lucide-react'

interface PhotoUploadFormProps {
  bankrolls: Bankroll[]
  canUseOCR: boolean
}

interface UploadedFile extends File {
  preview: string
  id: string
}

interface OCRResult {
  success: boolean
  ocrText?: string
  betData?: {
    stake?: number
    odds?: number
    bookmaker?: string
    sport?: string
    event?: string
    market?: string
    confidence: number
  }
  imageUrl?: string
  message?: string
  error?: string
}

export function PhotoUploadForm({ bankrolls, canUseOCR }: PhotoUploadFormProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [processing, setProcessing] = useState<string[]>([])
  const [results, setResults] = useState<Record<string, OCRResult>>({})
  const [selectedBankroll, setSelectedBankroll] = useState(
    bankrolls.find(b => b.is_default)?.id || bankrolls[0]?.id || ''
  )
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!canUseOCR) {
      alert('Subscription required for photo upload feature')
      return
    }

    const newFiles = acceptedFiles.map(file => ({
      ...file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [canUseOCR])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: !canUseOCR
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setResults(prev => {
      const newResults = { ...prev }
      delete newResults[fileId]
      return newResults
    })
  }

  const processFile = async (file: UploadedFile) => {
    if (!canUseOCR) return

    setProcessing(prev => [...prev, file.id])

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })

      const result: OCRResult = await response.json()

      setResults(prev => ({
        ...prev,
        [file.id]: result
      }))

    } catch (error) {
      console.error('Error processing file:', error)
      setResults(prev => ({
        ...prev,
        [file.id]: {
          success: false,
          error: 'Failed to process image'
        }
      }))
    } finally {
      setProcessing(prev => prev.filter(id => id !== file.id))
    }
  }

  const createBetFromResult = async (fileId: string) => {
    const result = results[fileId]
    if (!result?.success || !result.betData) return

    const { betData } = result

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankroll_id: selectedBankroll,
          stake: betData.stake || 0,
          odds: betData.odds || 1.01,
          bookmaker: betData.bookmaker || 'Unknown',
          sport: betData.sport || 'Other',
          event: betData.event || 'Unknown Event',
          market: betData.market || 'Other',
          placed_at: new Date().toISOString().split('T')[0],
          notes: `Extracted from image (${betData.confidence}% confidence)`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create bet')
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating bet:', error)
      alert('Failed to create bet. Please try again.')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Bankroll Selection */}
      <div>
        <label htmlFor="bankroll" className="block text-sm font-medium text-gray-700 mb-2">
          Target Bankroll
        </label>
        <select
          id="bankroll"
          value={selectedBankroll}
          onChange={(e) => setSelectedBankroll(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {bankrolls.map((bankroll) => (
            <option key={bankroll.id} value={bankroll.id}>
              {bankroll.name} ({bankroll.currency})
              {bankroll.is_default && ' - Default'}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : canUseOCR
            ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-12 w-12 mb-4 ${canUseOCR ? 'text-gray-400' : 'text-gray-300'}`} />
        
        {canUseOCR ? (
          <>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop images here' : 'Upload betting slip photos'}
            </p>
            <p className="text-sm text-gray-600">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports JPEG, PNG, WebP up to 10MB each
            </p>
          </>
        ) : (
          <p className="text-gray-500">
            Photo upload requires an active subscription
          </p>
        )}
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Images</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => {
              const isProcessing = processing.includes(file.id)
              const result = results[file.id]
              
              return (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="mb-3">
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>

                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="flex items-center space-x-2 text-blue-600 mb-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processing with AI...</span>
                    </div>
                  )}

                  {/* Results */}
                  {result && (
                    <div className="space-y-3">
                      {result.success && result.betData ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Information Extracted
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceBadge(result.betData.confidence)}`}>
                              {result.betData.confidence}% confidence
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                            {result.betData.stake && (
                              <div>Stake: €{result.betData.stake}</div>
                            )}
                            {result.betData.odds && (
                              <div>Odds: {result.betData.odds}</div>
                            )}
                            {result.betData.bookmaker && (
                              <div>Bookmaker: {result.betData.bookmaker}</div>
                            )}
                            {result.betData.sport && (
                              <div>Sport: {result.betData.sport}</div>
                            )}
                            {result.betData.event && (
                              <div className="col-span-2">Event: {result.betData.event}</div>
                            )}
                            {result.betData.market && (
                              <div>Market: {result.betData.market}</div>
                            )}
                          </div>

                          <button
                            onClick={() => createBetFromResult(file.id)}
                            className="mt-3 w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            Create Bet from This Data
                          </button>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">
                              Extraction Failed
                            </span>
                          </div>
                          <p className="text-xs text-red-700">
                            {result.error || 'Could not extract bet information from this image'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Process Button */}
                  {!isProcessing && !result && (
                    <button
                      onClick={() => processFile(file)}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Process Image
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}