export interface Movie {
  id: string;
  tmdb_id?: number;
  imdb_id?: string;
  title: string;
  slug?: string;
  tagline?: string;
  overview?: string;
  runtime_min?: number;
  vote_average?: number;
  vote_count?: number;
  genres?: string[];
  poster_path?: string;
  backdrop_path?: string;
  homepage?: string;
  release_date?: string;
  release_year?: string;
  is_hero?: boolean;
  is_trending?: boolean;
  is_published?: boolean;
  notes?: string;
  views?: number;
  trailerUrl?: string; // YouTube key or full URL
  created_at?: string;
  
  // Legacy fields mapped or temporarily kept for compile
  description?: string;
  category?: string;
  director?: string;
  cast?: string;
  url?: string;
  viewUrl?: string;
  posterUrl?: string;
  bannerUrl?: string;
  downloads?: number;
}

export interface Review {
  id: string;
  movie_id: string;
  user_name: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  movie_title: string;
  timestamp: string;
  details?: string;
}
