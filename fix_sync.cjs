const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldStart = code.indexOf('  // Handle URL query parameter to open movie details modal (Initial load only)');
const oldEnd = code.indexOf('  // Handle browser back button to close search');

if (oldStart !== -1 && oldEnd !== -1) {
  const newLogic = `  // Sync modal state with URL parameter (movieSlug)
  useEffect(() => {
    if (movies.length === 0) return;
    
    if (movieSlug) {
      const parts = movieSlug.split('-');
      const id = parts[parts.length - 1];
      const movie = movies.find(m => m.id === id);
      
      if (movie && (!selectedMovieForDetails || selectedMovieForDetails.id !== id)) {
        setSelectedMovieForDetails(movie);
      } else if (!movie) {
        navigate('/', { replace: true });
      }
    } else {
      if (selectedMovieForDetails) {
        setSelectedMovieForDetails(null);
      }
    }
  }, [movieSlug, movies, selectedMovieForDetails, navigate]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMovieForDetails) {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMovieForDetails, navigate]);
  
`;
  code = code.substring(0, oldStart) + newLogic + code.substring(oldEnd);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed logic block');
} else {
  console.log('Block not found');
}
