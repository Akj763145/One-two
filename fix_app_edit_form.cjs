const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The emptyForm object should be updated
const oldEmptyForm = `const emptyForm = {
    title: '', description: '', category: '',
    director: '', cast: '', url: '', viewUrl: '', posterUrl: '', bannerUrl: '',
    release_year: '', duration: '', maturity_rating: '', trailerUrl: '',
    is_hero: false, is_trending: false
  };`;

const newEmptyForm = `const emptyForm = {
    title: '', description: '', category: '', overview: '', tagline: '',
    director: '', cast: '', posterUrl: '', bannerUrl: '',
    release_year: '', duration: '', maturity_rating: '', trailerUrl: '',
    is_hero: false, is_trending: false, is_published: false, notes: ''
  };`;
code = code.replace(/const emptyForm = \{[\s\S]*?\};/, newEmptyForm);

// Also we should remove the url and viewUrl inputs from the form, and add notes, is_published.
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

// Find where "Banner Image URL" or "Cast" is and inject notesField
code = code.replace(/(<div>\s*<label[^>]*>Trailer YouTube URL.*?<\/div>)/, "$1\n" + notesField);

// Fix TS errors related to missing fields by updating types which we already did, but let's check npm lint
fs.writeFileSync('src/App.tsx', code);
