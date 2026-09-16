-- 1) Add Model A columns to the existing table
alter table public.movies
  add column if not exists tmdb_id      bigint,
  add column if not exists imdb_id      text,
  add column if not exists tagline      text,
  add column if not exists overview     text,
  add column if not exists runtime_min  integer,
  add column if not exists vote_average numeric(3,1),
  add column if not exists vote_count   integer,
  add column if not exists genres       text[],
  add column if not exists poster_path  text,
  add column if not exists backdrop_path text,
  add column if not exists homepage     text,
  add column if not exists release_date date,
  add column if not exists slug         text unique,
  add column if not exists is_published boolean default false,
  add column if not exists notes        text;

-- 2) Drop pirated / old columns safely
alter table public.movies drop column if exists url;
alter table public.movies drop column if exists "viewUrl";
alter table public.movies drop column if exists player_type;
alter table public.movies drop column if exists auto_play_video;
alter table public.movies drop column if exists auto_play_video_url;
alter table public.movies drop column if exists quality;
alter table public.movies drop column if exists match_score;
alter table public.movies drop column if exists downloads;
alter table public.movies drop column if exists "posterUrl";

-- 3) Ensure unique tmdb_id
create unique index if not exists movies_tmdb_id_uq on public.movies (tmdb_id);

-- 4) Lock down access
alter table public.movies enable row level security;
drop policy if exists "public read" on public.movies;
create policy "public read" on public.movies
  for select using (is_published = true);

