const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /interface Movie \{([\s\S]*?)match_score\?: number;/;
const replacement = `interface Movie {$1match_score?: number;
  notes?: string;
  tmdb_id?: number;
  imdb_id?: string;
  vote_average?: number;
  vote_count?: number;
  runtime_min?: number;
  tagline?: string;
  overview?: string;
  genres?: string[];
  slug?: string;
  is_published?: boolean;`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
