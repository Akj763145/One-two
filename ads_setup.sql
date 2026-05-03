-- Insert default Ad settings into the site_settings table
-- This initializes the ads configuration with empty placeholders
INSERT INTO site_settings (id, value)
VALUES (
  'ads',
  '{
    "enabled": true,
    "homeTop": "<!-- Paste your Top Banner Ad Code here -->",
    "homeMiddle": "<!-- Paste your Middle Banner Ad Code here -->",
    "homeTrendingAndWatchNext": "<!-- Paste your Trending Banner Ad Code here -->",
    "homeGridInline": "<!-- Paste your Inline Grid Ad Code here -->",
    "homeBottom": "<!-- Paste your Bottom Banner Ad Code here -->",
    "detailsModal": "<!-- Paste your Modal Ad Code here -->"
  }'
)
ON CONFLICT (id) DO NOTHING;
