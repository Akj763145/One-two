const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetBlock = /<AnimatePresence>\s*\{selectedMovieForDetails && \(\s*<MovieDetailModal[\s\S]*?onClose=\{[\s\S]*?\}\s*\/>\s*\)\}\s*<\/AnimatePresence>/;

const newBlock = `<AnimatePresence>
          {selectedMovieForDetails && (
              <MovieDetailModal 
              key={selectedMovieForDetails.id} 
              movie={selectedMovieForDetails} 
              allMovies={movies}
              onClose={() => navigate('/')}
            />
          )}
        </AnimatePresence>`;

code = code.replace(targetBlock, newBlock);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed modal close');
