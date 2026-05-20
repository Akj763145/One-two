-- 1. Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create movies table if it doesn't exist (ensuring columns match App.tsx)
CREATE TABLE IF NOT EXISTS movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  viewUrl TEXT,
  trailerUrl TEXT,
  posterUrl TEXT,
  description TEXT,
  category TEXT DEFAULT 'Other',
  director TEXT,
  cast TEXT,
  release_year TEXT,
  maturity_rating TEXT DEFAULT '18+',
  duration TEXT,
  quality TEXT DEFAULT 'HD',
  match_score INTEGER DEFAULT 98,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_hero BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  auto_play_video BOOLEAN DEFAULT false,
  auto_play_video_url TEXT,
  player_type TEXT DEFAULT 'iframe' CHECK (player_type IN ('iframe', 'vidstack', 'plyr')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure the constraint is updated if table already exists
ALTER TABLE movies DROP CONSTRAINT IF EXISTS check_player_type;
ALTER TABLE movies ADD CONSTRAINT check_player_type CHECK (player_type IN ('iframe', 'vidstack', 'plyr'));

-- 3. Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT,
  entity TEXT,
  details TEXT,
  admin_email TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.1 Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  user_name TEXT,
  rating INTEGER,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies to allow public (anon) access
CREATE POLICY "Allow public read access on movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on movies" ON movies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on movies" ON movies FOR DELETE USING (true);

CREATE POLICY "Allow public read access on site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on site_settings" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on site_settings" ON site_settings FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on feedback" ON feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access on reviews" ON reviews FOR DELETE USING (true);

-- 7. Insert default settings
INSERT INTO site_settings (id, value)
VALUES (
  'seo',
  '{
    "title": "Movie Wallah - Download any movie Here",
    "description": "Welcome to Movie Wallah. Discover the latest movie reviews, in-depth analysis, and updates on your favorite cinema.",
    "keywords": "movies, download movies, movie reviews, cinema, movie wallah, movie wallah online"
  }'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO site_settings (id, value)
VALUES (
  'ads',
  '{
    "enabled": true,
    "homeTop": "",
    "homeMiddle": "",
    "homeBottom": "",
    "detailsModal": ""
  }'
)
ON CONFLICT (id) DO NOTHING;
