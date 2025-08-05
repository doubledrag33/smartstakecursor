-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bankrolls table
CREATE TABLE IF NOT EXISTS bankrolls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  public_uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bankroll_id UUID REFERENCES bankrolls(id) ON DELETE CASCADE NOT NULL,
  stake DECIMAL(10,2) NOT NULL CHECK (stake > 0),
  odds DECIMAL(10,3) NOT NULL CHECK (odds > 1),
  bookmaker TEXT NOT NULL,
  sport TEXT NOT NULL,
  event TEXT NOT NULL,
  market TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  potential_win DECIMAL(10,2) NOT NULL,
  actual_win DECIMAL(10,2),
  notes TEXT,
  placed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bet_images table
CREATE TABLE IF NOT EXISTS bet_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create sports_leagues table
CREATE TABLE IF NOT EXISTS sports_leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sport, league)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bankrolls_user_id ON bankrolls(user_id);
CREATE INDEX IF NOT EXISTS idx_bankrolls_public_uuid ON bankrolls(public_uuid);
CREATE INDEX IF NOT EXISTS idx_bets_bankroll_id ON bets(bankroll_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_placed_at ON bets(placed_at);
CREATE INDEX IF NOT EXISTS idx_bets_sport ON bets(sport);
CREATE INDEX IF NOT EXISTS idx_bets_bookmaker ON bets(bookmaker);
CREATE INDEX IF NOT EXISTS idx_bet_images_bet_id ON bet_images(bet_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_sports_leagues_sport ON sports_leagues(sport);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_leagues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for bankrolls
CREATE POLICY "Users can read own bankrolls" ON bankrolls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bankrolls" ON bankrolls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bankrolls" ON bankrolls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bankrolls" ON bankrolls
  FOR DELETE USING (auth.uid() = user_id);

-- Public read policy for bankrolls (for public sharing)
CREATE POLICY "Public read access via public_uuid" ON bankrolls
  FOR SELECT USING (true);

-- RLS Policies for bets
CREATE POLICY "Users can read own bets" ON bets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b WHERE b.id = bets.bankroll_id
    )
  );

CREATE POLICY "Users can insert own bets" ON bets
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b WHERE b.id = bets.bankroll_id
    )
  );

CREATE POLICY "Users can update own bets" ON bets
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b WHERE b.id = bets.bankroll_id
    )
  );

CREATE POLICY "Users can delete own bets" ON bets
  FOR DELETE USING (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b WHERE b.id = bets.bankroll_id
    )
  );

-- Public read policy for bets (for public bankroll sharing)
CREATE POLICY "Public read access for shared bankrolls" ON bets
  FOR SELECT USING (true);

-- RLS Policies for bet_images
CREATE POLICY "Users can read own bet images" ON bet_images
  FOR SELECT USING (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b 
      JOIN bets bt ON bt.bankroll_id = b.id 
      WHERE bt.id = bet_images.bet_id
    )
  );

CREATE POLICY "Users can insert own bet images" ON bet_images
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b 
      JOIN bets bt ON bt.bankroll_id = b.id 
      WHERE bt.id = bet_images.bet_id
    )
  );

CREATE POLICY "Users can delete own bet images" ON bet_images
  FOR DELETE USING (
    auth.uid() IN (
      SELECT b.user_id FROM bankrolls b 
      JOIN bets bt ON bt.bankroll_id = b.id 
      WHERE bt.id = bet_images.bet_id
    )
  );

-- RLS Policies for referrals
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can insert own referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals" ON referrals
  FOR UPDATE USING (auth.uid() = referrer_id);

-- RLS Policies for sports_leagues (public read)
CREATE POLICY "Public read access for sports leagues" ON sports_leagues
  FOR SELECT USING (true);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bankrolls_updated_at BEFORE UPDATE ON bankrolls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW() + INTERVAL '7 days'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to ensure only one default bankroll per user
CREATE OR REPLACE FUNCTION ensure_single_default_bankroll()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE bankrolls 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_bankroll_trigger
  BEFORE INSERT OR UPDATE ON bankrolls
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_bankroll();

-- Create function to calculate potential win
CREATE OR REPLACE FUNCTION calculate_potential_win()
RETURNS TRIGGER AS $$
BEGIN
  NEW.potential_win = NEW.stake * (NEW.odds - 1);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_potential_win_trigger
  BEFORE INSERT OR UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION calculate_potential_win();

-- Insert initial sports and leagues data
INSERT INTO sports_leagues (sport, league, normalized_name) VALUES
  ('Football', 'Serie A', 'serie_a_italy'),
  ('Football', 'Premier League', 'premier_league_england'),
  ('Football', 'La Liga', 'la_liga_spain'),
  ('Football', 'Bundesliga', 'bundesliga_germany'),
  ('Football', 'Ligue 1', 'ligue_1_france'),
  ('Football', 'Champions League', 'champions_league'),
  ('Football', 'Europa League', 'europa_league'),
  ('Tennis', 'ATP', 'atp_tour'),
  ('Tennis', 'WTA', 'wta_tour'),
  ('Tennis', 'Grand Slam', 'grand_slam'),
  ('Basketball', 'NBA', 'nba_usa'),
  ('Basketball', 'EuroLeague', 'euroleague'),
  ('Basketball', 'Serie A', 'serie_a_basketball_italy')
ON CONFLICT (sport, league) DO NOTHING;