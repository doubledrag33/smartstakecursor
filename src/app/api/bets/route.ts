import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for bet creation
const createBetSchema = z.object({
  bankroll_id: z.string().uuid(),
  stake: z.number().positive(),
  odds: z.number().min(1.01),
  bookmaker: z.string().min(1),
  sport: z.string().min(1),
  event: z.string().min(1),
  market: z.string().min(1),
  placed_at: z.string(),
  notes: z.string().optional(),
})

/**
 * GET /api/bets - Get user's bets
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bankrollId = searchParams.get('bankroll_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('bets')
      .select(`
        *,
        bet_images (
          id,
          image_url,
          ocr_text
        )
      `)
      .order('placed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (bankrollId) {
      // Verify user owns this bankroll
      const { data: bankroll } = await supabase
        .from('bankrolls')
        .select('id')
        .eq('id', bankrollId)
        .eq('user_id', user.id)
        .single()

      if (!bankroll) {
        return NextResponse.json({ error: 'Bankroll not found' }, { status: 404 })
      }

      query = query.eq('bankroll_id', bankrollId)
    } else {
      // Get bets from all user's bankrolls
      const { data: userBankrolls } = await supabase
        .from('bankrolls')
        .select('id')
        .eq('user_id', user.id)

      if (!userBankrolls || userBankrolls.length === 0) {
        return NextResponse.json({ bets: [], total: 0 })
      }

      const bankrollIds = userBankrolls.map(b => b.id)
      query = query.in('bankroll_id', bankrollIds)
    }

    const { data: bets, error } = await query

    if (error) {
      console.error('Error fetching bets:', error)
      return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
    }

    return NextResponse.json({ bets: bets || [] })
  } catch (error) {
    console.error('Error in GET /api/bets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/bets - Create a new bet
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = createBetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const betData = validationResult.data

    // Verify user owns the bankroll
    const { data: bankroll } = await supabase
      .from('bankrolls')
      .select('id, user_id')
      .eq('id', betData.bankroll_id)
      .eq('user_id', user.id)
      .single()

    if (!bankroll) {
      return NextResponse.json({ error: 'Bankroll not found' }, { status: 404 })
    }

    // Create the bet
    const { data: bet, error } = await supabase
      .from('bets')
      .insert([betData])
      .select(`
        *,
        bet_images (
          id,
          image_url,
          ocr_text
        )
      `)
      .single()

    if (error) {
      console.error('Error creating bet:', error)
      return NextResponse.json({ error: 'Failed to create bet' }, { status: 500 })
    }

    return NextResponse.json({ bet }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}