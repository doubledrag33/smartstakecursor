import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_error`)
      }

      // Get user to ensure profile creation
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists, create if not
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create profile if it doesn't exist
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              subscription_status: 'trial'
            })
        }

        // Check if user has a default bankroll, create if not
        const { data: bankrolls } = await supabase
          .from('bankrolls')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_default', true)

        if (!bankrolls || bankrolls.length === 0) {
          // Create default bankroll
          await supabase
            .from('bankrolls')
            .insert({
              user_id: user.id,
              name: 'Main Bankroll',
              currency: 'EUR',
              is_default: true
            })
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    } catch (error) {
      console.error('Error in auth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=server_error`)
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}