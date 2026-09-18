// General utility helpers for Movie Wallah

/**
 * Extracts a clean 11-character YouTube video ID from various URL formats or raw ID.
 */
export function extractYouTubeKey(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-character video ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle image URLs mistakenly placed in trailer field
  if (trimmed.includes('image.tmdb.org') || trimmed.includes('.jpg') || trimmed.includes('.png')) {
    return null;
  }

  try {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = trimmed.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Converts a movie title into an SEO-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
