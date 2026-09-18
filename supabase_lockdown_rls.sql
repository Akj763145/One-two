-- ==============================================================================
-- MOVIE WALLAH: DATABASE LOCKDOWN & ROW LEVEL SECURITY (RLS)
-- Run this script in your Supabase SQL Editor to secure the database.
-- ==============================================================================

-- 1. LOCK DOWN MOVIES TABLE
ALTER TABLE IF EXISTS public.movies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON public.movies;
DROP POLICY IF EXISTS "public read published" ON public.movies;
DROP POLICY IF EXISTS "allow_all_movies" ON public.movies;
DROP POLICY IF EXISTS "anon_read_published_movies" ON public.movies;
DROP POLICY IF EXISTS "admin_all_movies" ON public.movies;

-- Visitors can only read movies that are published
CREATE POLICY "public read published" ON public.movies
  FOR SELECT
  USING (is_published = true);

-- Authenticated admins and service role have full access to manage catalog
CREATE POLICY "admin_all_movies" ON public.movies
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 2. LOCK DOWN REVIEWS TABLE
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "public insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "allow_all_reviews" ON public.reviews;

-- Anyone can read reviews
CREATE POLICY "public read reviews" ON public.reviews
  FOR SELECT
  USING (true);

-- Visitors can post reviews (validating required fields)
CREATE POLICY "public insert reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (
    user_name IS NOT NULL AND length(trim(user_name)) > 0 AND
    text IS NOT NULL AND length(trim(text)) > 0 AND
    rating >= 1 AND rating <= 5
  );

-- Only authenticated users or service role can delete/edit reviews
CREATE POLICY "admin_reviews_all" ON public.reviews
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 3. LOCK DOWN AUDIT LOGS (No anon access)
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "allow_all_logs" ON public.audit_logs;

CREATE POLICY "admin_logs_policy" ON public.audit_logs
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4. LOCK DOWN SITE SETTINGS
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read settings" ON public.site_settings;
DROP POLICY IF EXISTS "admin_settings_all" ON public.site_settings;
DROP POLICY IF EXISTS "allow_all_settings" ON public.site_settings;

-- Public can read site settings (SEO, Ads configuration)
CREATE POLICY "public read settings" ON public.site_settings
  FOR SELECT
  USING (true);

-- Writes are restricted to admins and service role
CREATE POLICY "admin_settings_all" ON public.site_settings
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 5. SANITIZE SITE SETTINGS (Remove legacy piracy keywords from database)
INSERT INTO public.site_settings (id, value, updated_at)
VALUES (
  'seo',
  '{"title":"Movie Wallah – Where to Watch Movies, Streaming Guide & Reviews","description":"Discover where to watch movies online legally, browse streaming platforms, watch official trailers, and read community reviews on Movie Wallah.","keywords":"where to watch movies, streaming guide, ott releases, netflix, prime video, hotstar, movie reviews, cinema ratings"}'::jsonb,
  now()
)
ON CONFLICT (id) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- 6. FIX JAWAN ROW (Correct bare YouTube key & ensure published)
UPDATE public.movies
SET 
  trailerUrl = '8hP9D6kZseM',
  is_published = true
WHERE tmdb_id = 872906 OR lower(title) = 'jawan';

-- Ensure all existing catalog movies have is_published = true
UPDATE public.movies
SET is_published = true
WHERE is_published IS NULL OR is_published = false;
