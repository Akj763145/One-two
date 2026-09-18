const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix idx in SwiperSlide mapping
code = code.replace(/<SwiperSlide key=\{`\$\{movie\.id\}-\$\{idx\}`\}/g, "<SwiperSlide key={`${movie.id}-${index}`}");

// Fix DriveBrowser
code = code.replace(/<DriveBrowser\s*onImport=\{handleDriveImport\}\s*onLogin=\{handleGoogleSignIn\}\s*accessToken=\{googleUser \? \(window as any\)\.googleAccessToken : null\}\s*\/>/m, "<DriveBrowser onSelect={() => {}} onClose={() => {}} type='video' />");

// Fix MovieDetailModal inside <AnimatePresence>
const oldModal = `<MovieDetailModal 
                  key="detail-modal" 
                  movie={selectedMovieForDetails} 
                  allMovies={movies}
                  onClose={() => {
                    setSelectedMovieForDetails(null);
                    window.history.pushState({}, '', '/');
                  }} 
                />`;
const newModal = `<MovieDetailModal 
                  key="detail-modal" 
                  movie={selectedMovieForDetails} 
                  allMovies={movies}
                  onClose={() => {
                    setSelectedMovieForDetails(null);
                    window.history.pushState({}, '', '/');
                  }} 
                  onMovieClick={handleShowDetails}
                  onDownload={handleDownload}
                  onView={handleView}
                  adSettings={adSettings}
                  loadingActions={loadingActions}
                />`;
code = code.replace(oldModal, newModal);

fs.writeFileSync('src/App.tsx', code);
