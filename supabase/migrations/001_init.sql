-- Parent accounts (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child profiles (multiple per parent)
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_years INTEGER NOT NULL CHECK (age_years BETWEEN 0 AND 10),
  age_tier TEXT NOT NULL CHECK (age_tier IN ('infant','preschool','schoolage')),
  active_companion TEXT DEFAULT 'cat',
  companion_name TEXT,
  coin_balance INTEGER DEFAULT 0,
  garden_health FLOAT DEFAULT 0.5,
  weekly_bank_ms BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent owns profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "parent owns child profiles" ON child_profiles
  FOR ALL USING (auth.uid() = parent_id);
