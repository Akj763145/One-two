ALTER TABLE movies ADD COLUMN category TEXT DEFAULT 'Other';
ALTER TABLE movies ADD COLUMN is_trending BOOLEAN DEFAULT false;

-- Create site_settings table for SEO and other configurations
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default SEO settings if they don't exist
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

-- Insert default Ad settings if they don't exist
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
