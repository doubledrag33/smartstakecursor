import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface BetData {
  stake?: number
  odds?: number
  bookmaker?: string
  sport?: string
  event?: string
  market?: string
  confidence: number
}

/**
 * Extract bet information from OCR text using GPT-4o
 */
async function parseBetWithAI(ocrText: string): Promise<BetData> {
  try {
    const prompt = `
Extract betting information from this betting slip text. Focus on Italian bookmakers like Sisal, GoldBet, Bet365, CPlay.

Text: "${ocrText}"

Return a JSON object with these fields (use null if not found):
- stake: number (betting amount in euros)
- odds: number (decimal odds like 2.50)
- bookmaker: string (name of betting site)
- sport: string (Football, Tennis, Basketball, etc.)
- event: string (team names or player names)
- market: string (1X2, Over/Under, etc.)
- confidence: number (0-100, how confident you are in the extraction)

Rules:
- Convert fractional odds to decimal (e.g., 3/2 = 2.50)
- Normalize team names (e.g., "Juventus FC" -> "Juventus")
- Identify sport from context
- Extract market type from betting options
- Be conservative with confidence if text is unclear

Example response:
{
  "stake": 10.00,
  "odds": 2.50,
  "bookmaker": "Sisal",
  "sport": "Football",
  "event": "Juventus vs Inter",
  "market": "1X2",
  "confidence": 85
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting betting information from Italian betting slips. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const betData = JSON.parse(content) as BetData
    
    // Validate confidence score
    if (typeof betData.confidence !== 'number') {
      betData.confidence = 50
    }

    return betData
  } catch (error) {
    console.error('Error parsing bet with AI:', error)
    return {
      confidence: 0
    }
  }
}

/**
 * POST /api/ocr - Process betting slip image
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has valid subscription or trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check subscription status
    const now = new Date()
    const trialEnded = profile.trial_ends_at && new Date(profile.trial_ends_at) < now
    const hasActiveSubscription = profile.subscription_status === 'active'

    if (trialEnded && !hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Subscription required for OCR feature' },
        { status: 402 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Perform OCR with Tesseract.js
    console.log('Starting OCR processing...')
    const { data: { text } } = await Tesseract.recognize(
      uint8Array,
      'ita+eng', // Italian and English languages
      {
        logger: m => console.log('OCR Progress:', m)
      }
    )

    console.log('OCR Text extracted:', text)

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from image' },
        { status: 400 }
      )
    }

    // Parse betting information with GPT-4o
    console.log('Parsing bet information with AI...')
    const betData = await parseBetWithAI(text)

    // Upload image to Supabase Storage (optional)
    let imageUrl = null
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bet-images')
        .upload(fileName, uint8Array, {
          contentType: file.type,
          upsert: false
        })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('bet-images')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError)
      // Continue without image upload
    }

    return NextResponse.json({
      success: true,
      ocrText: text,
      betData,
      imageUrl,
      message: betData.confidence > 70 
        ? 'Bet information extracted successfully'
        : 'Bet information extracted with low confidence. Please verify the details.'
    })

  } catch (error) {
    console.error('Error in OCR processing:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}