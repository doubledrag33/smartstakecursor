import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyBetResults } from '@/lib/results-feed'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all pending bets for the user
    const { data: userBankrolls } = await supabase
      .from('bankrolls')
      .select('id')
      .eq('user_id', user.id)

    if (!userBankrolls || userBankrolls.length === 0) {
      return NextResponse.json({ message: 'No bankrolls found', updated: 0 })
    }

    const bankrollIds = userBankrolls.map(b => b.id)

    const { data: pendingBets } = await supabase
      .from('bets')
      .select('id, event, sport, market, odds, stake, placed_at')
      .in('bankroll_id', bankrollIds)
      .eq('status', 'pending')

    if (!pendingBets || pendingBets.length === 0) {
      return NextResponse.json({ message: 'No pending bets to verify', updated: 0 })
    }

    // Verify bet results
    const verificationResults = await verifyBetResults(pendingBets)
    
    let updatedCount = 0

    // Update bet statuses in database
    for (const [betId, result] of verificationResults) {
      if (result.status !== 'pending' && result.confidence > 70) {
        const { error } = await supabase
          .from('bets')
          .update({
            status: result.status,
            actual_win: result.actualWin || null,
            notes: result.resultDetails ? `Auto-verified: ${result.resultDetails}` : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', betId)

        if (!error) {
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      message: `Verification complete. Updated ${updatedCount} bets.`,
      updated: updatedCount,
      total: pendingBets.length
    })

  } catch (error) {
    console.error('Error verifying bets:', error)
    return NextResponse.json(
      { error: 'Failed to verify bets' },
      { status: 500 }
    )
  }
}