const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We need to import TmdbImporter
if (!code.includes('TmdbImporter')) {
  code = code.replace("import { supabase } from './supabaseClient';", "import { supabase } from './supabaseClient';\nimport { TmdbImporter } from './components/TmdbImporter';");
}

// Add state for TmdbImporter
if (!code.includes('showTmdbImporter')) {
  code = code.replace("const [showAddEditModal, setShowAddEditModal] = useState(false);", "const [showAddEditModal, setShowAddEditModal] = useState(false);\n  const [showTmdbImporter, setShowTmdbImporter] = useState(false);");
}

// Intercept Add Movie clicks to open TmdbImporter
// Currently it is `onAddClick={() => { setEditingMovie(null); setFormData(emptyForm); setShowAddEditModal(true); }}`
code = code.replace(/setShowAddEditModal\(true\)/g, "setShowTmdbImporter(true)");
// BUT we want edit to still work.
// Wait, when editing, `handleEdit` does `setEditingMovie(movie); setFormData(movie); setShowAddEditModal(true);`
// So we should just manually change `handleEdit` back to `setShowAddEditModal(true)`.

code = code.replace(/setFormData\([^)]+\);\s*setShowTmdbImporter\(true\);/g, (match) => {
  if (match.includes('setEditingMovie(movie)')) {
    return match.replace("setShowTmdbImporter(true)", "setShowAddEditModal(true)");
  }
  return match;
});

// Actually, let's just find the `handleEdit` function:
const handleEditRegex = /const handleEdit = \(movie: Movie\) => \{[\s\S]*?\};/;
const match = handleEditRegex.exec(code);
if (match) {
  let newHandleEdit = match[0].replace("setShowTmdbImporter(true)", "setShowAddEditModal(true)");
  code = code.substring(0, match.index) + newHandleEdit + code.substring(match.index + match[0].length);
}

// Now add the <TmdbImporter /> component right before the AnimatePresence that handles showAddEditModal
const insertPoint = code.indexOf("{showAddEditModal && (");
if (insertPoint !== -1) {
  const importerJsx = `
        {showTmdbImporter && (
          <TmdbImporter 
            onClose={() => setShowTmdbImporter(false)}
            onImported={(newMovie) => {
              setMovies([newMovie, ...movies]);
              setShowTmdbImporter(false);
              // optionally open the edit modal to let them write notes:
              setEditingMovie(newMovie);
              setFormData(newMovie);
              setShowAddEditModal(true);
            }}
          />
        )}
  `;
  code = code.substring(0, insertPoint) + importerJsx + code.substring(insertPoint);
}

// Update empty form for new db shape
const newEmptyForm = `const emptyForm = {
    title: '', description: '', category: '', overview: '', tagline: '',
    director: '', cast: '', posterUrl: '', bannerUrl: '',
    release_year: '', duration: '', maturity_rating: '', trailerUrl: '',
    is_hero: false, is_trending: false, is_published: false, notes: ''
  };`;
code = code.replace(/const emptyForm = \{[\s\S]*?\};/, newEmptyForm);

// Remove the url and viewUrl inputs from the form, and add notes, is_published.
const urlInputsRegex = /<div>\s*<label[^>]*>Streaming URL \(\.m3u8\).*?<\/div>|<div>\s*<label[^>]*>Direct View URL.*?<\/div>/gs;
code = code.replace(urlInputsRegex, "");

// Replace Poster URL with something that handles both
const notesField = `
                      <div>
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Editorial Notes (Why watch it?)</label>
                        <textarea value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all resize-none" placeholder="2-4 sentences about the movie..."></textarea>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="is_published" checked={formData.is_published || false} onChange={e => setFormData({...formData, is_published: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-black/40" />
                        <label htmlFor="is_published" className="text-sm font-bold">Publish to Public Site</label>
                      </div>
`;

// Inject notesField
code = code.replace(/(<div>\s*<label[^>]*>Trailer YouTube URL.*?<\/div>)/, "$1\n" + notesField);

fs.writeFileSync('src/App.tsx', code);
