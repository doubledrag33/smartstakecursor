/**
 * Results feed integration for automatic bet verification
 * Primary: SofaScore API
 * Fallback: SportdataAPI
 */

interface MatchResult {
  eventId: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  startTime: string
  sport: string
  league: string
}

interface BetVerificationResult {
  status: 'won' | 'lost' | 'void' | 'pending'
  confidence: number
  actualWin?: number
  resultDetails?: string
}

/**
 * Normalize team names for better matching
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/fc|ac|sc|cf/g, '')
    .replace(/\b(united|city|town|rovers|wanderers)\b/g, '')
    .trim()
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength
}

/**
 * Match bet event with API result
 */
function matchBetToResult(betEvent: string, apiResults: MatchResult[]): MatchResult | null {
  const normalizedBetEvent = normalizeTeamName(betEvent)
  let bestMatch: MatchResult | null = null
  let bestScore = 0

  for (const result of apiResults) {
    const normalizedApiEvent = normalizeTeamName(`${result.homeTeam} ${result.awayTeam}`)
    const similarity = calculateSimilarity(normalizedBetEvent, normalizedApiEvent)

    if (similarity > bestScore && similarity > 0.7) {
      bestMatch = result
      bestScore = similarity
    }
  }

  return bestMatch
}

/**
 * Verify bet result based on market type
 */
function verifyBetResult(
  bet: {
    market: string
    odds: number
    stake: number
  },
  matchResult: MatchResult
): BetVerificationResult {
  if (matchResult.status !== 'finished') {
    return { status: 'pending', confidence: 100 }
  }

  const { homeScore = 0, awayScore = 0 } = matchResult
  const market = bet.market.toLowerCase()

  // 1X2 Market
  if (market.includes('1x2') || market.includes('match winner')) {
    if (homeScore > awayScore) {
      return {
        status: market.includes('1') ? 'won' : 'lost',
        confidence: 95,
        actualWin: market.includes('1') ? bet.stake * bet.odds : 0,
        resultDetails: `Final Score: ${homeScore}-${awayScore} (Home Win)`
      }
    } else if (awayScore > homeScore) {
      return {
        status: market.includes('2') ? 'won' : 'lost',
        confidence: 95,
        actualWin: market.includes('2') ? bet.stake * bet.odds : 0,
        resultDetails: `Final Score: ${homeScore}-${awayScore} (Away Win)`
      }
    } else {
      return {
        status: market.includes('x') ? 'won' : 'lost',
        confidence: 95,
        actualWin: market.includes('x') ? bet.stake * bet.odds : 0,
        resultDetails: `Final Score: ${homeScore}-${awayScore} (Draw)`
      }
    }
  }

  // Over/Under 2.5 Goals
  if (market.includes('over') || market.includes('under')) {
    const totalGoals = homeScore + awayScore
    const isOver = totalGoals > 2.5
    
    if (market.includes('over')) {
      return {
        status: isOver ? 'won' : 'lost',
        confidence: 90,
        actualWin: isOver ? bet.stake * bet.odds : 0,
        resultDetails: `Total Goals: ${totalGoals} (${isOver ? 'Over' : 'Under'} 2.5)`
      }
    } else {
      return {
        status: !isOver ? 'won' : 'lost',
        confidence: 90,
        actualWin: !isOver ? bet.stake * bet.odds : 0,
        resultDetails: `Total Goals: ${totalGoals} (${isOver ? 'Over' : 'Under'} 2.5)`
      }
    }
  }

  // Both Teams to Score
  if (market.includes('both') && market.includes('score')) {
    const bothScored = homeScore > 0 && awayScore > 0
    return {
      status: bothScored ? 'won' : 'lost',
      confidence: 85,
      actualWin: bothScored ? bet.stake * bet.odds : 0,
      resultDetails: `Final Score: ${homeScore}-${awayScore} (Both Teams ${bothScored ? 'Scored' : 'Did Not Score'})`
    }
  }

  // Default: unable to verify
  return {
    status: 'pending',
    confidence: 0,
    resultDetails: 'Unable to automatically verify this market type'
  }
}

/**
 * Fetch results from SofaScore API (mock implementation)
 */
async function fetchSofaScoreResults(sport: string, date: string): Promise<MatchResult[]> {
  try {
    // Note: This is a mock implementation
    // In production, you would integrate with actual SofaScore API
    
    const response = await fetch(`https://api.sofascore.com/api/v1/sport/${sport}/scheduled-events/${date}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SOFASCORE_API_KEY}`,
        'User-Agent': 'SmartStake/1.0'
      }
    })

    if (!response.ok) {
      throw new Error('SofaScore API error')
    }

    const data = await response.json()
    
    // Transform SofaScore data to our format
    return data.events?.map((event: any) => ({
      eventId: event.id,
      homeTeam: event.homeTeam.name,
      awayTeam: event.awayTeam.name,
      homeScore: event.homeScore?.current,
      awayScore: event.awayScore?.current,
      status: event.status.type,
      startTime: event.startTimestamp,
      sport: event.tournament.category.sport.name,
      league: event.tournament.name
    })) || []
  } catch (error) {
    console.error('SofaScore API error:', error)
    throw error
  }
}

/**
 * Fetch results from SportdataAPI (fallback)
 */
async function fetchSportdataResults(sport: string, date: string): Promise<MatchResult[]> {
  try {
    const response = await fetch(`https://api.sportdataapi.com/v1/${sport}/matches`, {
      headers: {
        'apikey': process.env.SPORTDATA_API_KEY!
      }
    })

    if (!response.ok) {
      throw new Error('SportdataAPI error')
    }

    const data = await response.json()
    
    return data.data?.map((match: any) => ({
      eventId: match.match_id,
      homeTeam: match.home_team.name,
      awayTeam: match.away_team.name,
      homeScore: match.stats?.home_score,
      awayScore: match.stats?.away_score,
      status: match.match_status,
      startTime: match.match_start,
      sport: match.league.sport,
      league: match.league.name
    })) || []
  } catch (error) {
    console.error('SportdataAPI error:', error)
    throw error
  }
}

/**
 * Main function to verify bet results
 */
export async function verifyBetResults(bets: Array<{
  id: string
  event: string
  sport: string
  market: string
  odds: number
  stake: number
  placed_at: string
}>): Promise<Map<string, BetVerificationResult>> {
  const results = new Map<string, BetVerificationResult>()
  
  // Group bets by sport and date for efficient API calls
  const betsByDate = new Map<string, typeof bets>()
  
  for (const bet of bets) {
    const date = new Date(bet.placed_at).toISOString().split('T')[0]
    const key = `${bet.sport.toLowerCase()}-${date}`
    
    if (!betsByDate.has(key)) {
      betsByDate.set(key, [])
    }
    betsByDate.get(key)!.push(bet)
  }

  // Process each date/sport combination
  for (const [key, dateBets] of betsByDate) {
    const [sport, date] = key.split('-')
    
    try {
      // Try SofaScore first
      let matchResults: MatchResult[]
      
      try {
        matchResults = await fetchSofaScoreResults(sport, date)
      } catch (error) {
        console.log('SofaScore failed, trying SportdataAPI fallback')
        matchResults = await fetchSportdataResults(sport, date)
      }

      // Verify each bet
      for (const bet of dateBets) {
        const matchResult = matchBetToResult(bet.event, matchResults)
        
        if (matchResult) {
          const verification = verifyBetResult(bet, matchResult)
          results.set(bet.id, verification)
        } else {
          results.set(bet.id, {
            status: 'pending',
            confidence: 0,
            resultDetails: 'No matching event found'
          })
        }
      }
    } catch (error) {
      console.error(`Error verifying bets for ${key}:`, error)
      
      // Set all bets for this date as pending
      for (const bet of dateBets) {
        results.set(bet.id, {
          status: 'pending',
          confidence: 0,
          resultDetails: 'API error - verification failed'
        })
      }
    }
  }

  return results
}

/**
 * Verify a single bet (used for real-time verification)
 */
export async function verifySingleBet(bet: {
  id: string
  event: string
  sport: string
  market: string
  odds: number
  stake: number
  placed_at: string
}): Promise<BetVerificationResult> {
  const results = await verifyBetResults([bet])
  return results.get(bet.id) || { status: 'pending', confidence: 0 }
}