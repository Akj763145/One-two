// Cloudflare Worker for moviewallah.online/api/tmdb/*
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/tmdb/')) {
      return new Response('Not found', { status: 404 });
    }
    const target = 'https://api.themoviedb.org/3' + url.pathname.replace('/api/tmdb', '') + url.search;
    const token = env.TMDB_TOKEN || env.VITE_TMDB_API_KEY;
    const headers = { 'accept': 'application/json' };
    let fetchUrl = target;

    if (token) {
      if (token.length > 50) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        const u = new URL(target);
        u.searchParams.set('api_key', token);
        fetchUrl = u.toString();
      }
    }

    const r = await fetch(fetchUrl, { headers });
    return new Response(r.body, {
      status: r.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': r.ok ? 'public, s-maxage=21600' : 'no-store',
        'access-control-allow-origin': 'https://moviewallah.online',
      }
    });
  }
};
