const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleShowDetails = (movie: Movie) => {
    setSelectedMovieForDetails(movie);
  };`;

const replacement = `  const handleShowDetails = (movie: Movie) => {
    navigate(\`/movie/\${getMovieSlug(movie)}\`);
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed handleShowDetails');
