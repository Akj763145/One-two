const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace ANY instance of <MovieDetailModal ... /> that lacks adSettings to have it.
code = code.replace(/<MovieDetailModal\s*\n\s*key="detail-modal"\s*\n\s*movie=\{selectedMovieForDetails\}\s*\n\s*allMovies=\{movies\}\s*\n\s*onClose=\{([\s\S]*?)\}\s*\n\s*\/>/gm,
`<MovieDetailModal 
  key="detail-modal" 
  movie={selectedMovieForDetails} 
  allMovies={movies}
  onClose={$1}
  onMovieClick={handleShowDetails}
  onDownload={handleDownload}
  onView={handleView}
  adSettings={adSettings}
  loadingActions={loadingActions}
/>`);

code = code.replace(/key=\{`\$\{movie\.id\}-\$\{index\}`\}/g, "key={movie.id}");
code = code.replace(/key=\{`\$\{movie\.id\}-\$\{idx\}`\}/g, "key={movie.id}");
code = code.replace(/key=\{movie\.id \+ Math\.random\(\)\.toString\(\)\}/g, "key={movie.id}");

fs.writeFileSync('src/App.tsx', code);
