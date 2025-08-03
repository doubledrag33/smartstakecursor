export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          trial_ends_at: string | null
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          trial_ends_at?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          trial_ends_at?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
      bankrolls: {
        Row: {
          id: string
          user_id: string
          name: string
          currency: string
          public_uuid: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          currency?: string
          public_uuid?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          currency?: string
          public_uuid?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          bankroll_id: string
          stake: number
          odds: number
          bookmaker: string
          sport: string
          event: string
          market: string
          status: 'pending' | 'won' | 'lost' | 'void'
          potential_win: number
          actual_win: number | null
          notes: string | null
          placed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bankroll_id: string
          stake: number
          odds: number
          bookmaker: string
          sport: string
          event: string
          market: string
          status?: 'pending' | 'won' | 'lost' | 'void'
          potential_win: number
          actual_win?: number | null
          notes?: string | null
          placed_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bankroll_id?: string
          stake?: number
          odds?: number
          bookmaker?: string
          sport?: string
          event?: string
          market?: string
          status?: 'pending' | 'won' | 'lost' | 'void'
          potential_win?: number
          actual_win?: number | null
          notes?: string | null
          placed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      bet_images: {
        Row: {
          id: string
          bet_id: string
          image_url: string
          ocr_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bet_id: string
          image_url: string
          ocr_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bet_id?: string
          image_url?: string
          ocr_text?: string | null
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string | null
          referral_code: string
          status: 'pending' | 'completed' | 'expired'
          reward_granted: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id?: string | null
          referral_code: string
          status?: 'pending' | 'completed' | 'expired'
          reward_granted?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string | null
          referral_code?: string
          status?: 'pending' | 'completed' | 'expired'
          reward_granted?: boolean
          created_at?: string
          completed_at?: string | null
        }
      }
      sports_leagues: {
        Row: {
          id: string
          sport: string
          league: string
          normalized_name: string
          created_at: string
        }
        Insert: {
          id?: string
          sport: string
          league: string
          normalized_name: string
          created_at?: string
        }
        Update: {
          id?: string
          sport?: string
          league?: string
          normalized_name?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Bankroll = Database['public']['Tables']['bankrolls']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type BetImage = Database['public']['Tables']['bet_images']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']
export type SportsLeague = Database['public']['Tables']['sports_leagues']['Row']

// Insert types
export type BetInsert = Database['public']['Tables']['bets']['Insert']
export type BankrollInsert = Database['public']['Tables']['bankrolls']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// Enums
export type BetStatus = 'pending' | 'won' | 'lost' | 'void'
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired'
export type ReferralStatus = 'pending' | 'completed' | 'expired'

// Extended types with relationships
export interface BetWithImages extends Bet {
  bet_images: BetImage[]
}

export interface BankrollWithBets extends Bankroll {
  bets: Bet[]
}

export interface BankrollStats {
  total_bets: number
  total_stake: number
  total_winnings: number
  roi: number
  yield: number
  profit_loss: number
}