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

code = code.replace(/setFormData\({[^}]*}\);\s*setShowTmdbImporter\(true\);/g, (match) => {
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
              setFormData({ ...emptyForm, ...newMovie });
              setShowAddEditModal(true);
            }}
          />
        )}
  `;
  code = code.substring(0, insertPoint) + importerJsx + code.substring(insertPoint);
}

fs.writeFileSync('src/App.tsx', code);
