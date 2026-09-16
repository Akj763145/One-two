const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add useParams to imports
code = code.replace("import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';", "import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';");

// 2. Add movieSlug to MainApp
code = code.replace("const MainApp = () => {", "const MainApp = () => {\n  const navigate = useNavigate();\n  const { movieSlug } = useParams();");

// 3. Remove old URL sync block
const oldUrlSyncStart = code.indexOf('  // Check URL parameter to open movie details modal (Initial load only)');
const oldUrlSyncEnd = code.indexOf('  // Handle browser back button to close search');
if (oldUrlSyncStart !== -1 && oldUrlSyncEnd !== -1) {
  code = code.substring(0, oldUrlSyncStart) + code.substring(oldUrlSyncEnd);
}

// 4. Insert new URL sync logic based on react-router
const newUrlSyncLogic = `  // Sync modal state with URL parameter (movieSlug)
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
  
  // Body scroll lock logic is handled lower down
`;
code = code.substring(0, oldUrlSyncStart) + newUrlSyncLogic + code.substring(oldUrlSyncStart);

// 5. Update onShowDetails calls
const createSlugFunc = `  const getMovieSlug = (movie: Movie) => {
    const titleSlug = movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return \`\${titleSlug}-\${movie.id}\`;
  };
`;
code = code.replace("const fetchMovies = async () => {", createSlugFunc + "\n  const fetchMovies = async () => {");

code = code.replace(/onShowDetails=\{\(movie\) => \{\n\s*setSelectedMovieForDetails\(movie\);\n\s*setShowMenu\(false\);\n\s*\}\}/g, 
  "onShowDetails={(movie) => { navigate(`/movie/${getMovieSlug(movie)}`); setShowMenu(false); }}");

code = code.replace(/onShowDetails=\{\(movie\) => setSelectedMovieForDetails\(movie\)\}/g, 
  "onShowDetails={(movie) => navigate(`/movie/${getMovieSlug(movie)}`)}");

// Also update the onClose callback in MovieDetailModal
code = code.replace(/onClose=\{.*?\}/, "onClose={() => navigate('/')}");

// Let's make sure all onClose props for MovieDetailModal are updated.
code = code.replace(/<MovieDetailModal[\s\S]*?onClose=\{.*?\}[\s\S]*?\/>/g, (match) => {
    return match.replace(/onClose=\{.*?\}/, "onClose={() => navigate('/')}");
});

// 6. Update App component routes
const oldRoutes = `<Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>`;

const newRoutes = `<Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/movie/:movieSlug" element={<MainApp />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>`;

code = code.replace(oldRoutes, newRoutes);

fs.writeFileSync('src/App.tsx', code);
console.log('Done routing update');
