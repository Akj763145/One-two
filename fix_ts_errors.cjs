const fs = require('fs');

// Fix TmdbImporter.tsx
let importer = fs.readFileSync('src/components/TmdbImporter.tsx', 'utf8');
importer = importer.replace('newMovie.id = Date.now().toString();', '(newMovie as any).id = Date.now().toString();');
fs.writeFileSync('src/components/TmdbImporter.tsx', importer);

// Fix App.tsx emptyForm reference
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace('setFormData({ ...emptyForm, ...newMovie });', 'setFormData(newMovie);');
fs.writeFileSync('src/App.tsx', app);
