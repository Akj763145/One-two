const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('onClick={() => setShowDMCA(true)}', "onClick={() => setLegalModalType('dmca')}");
code = code.replace('{showDMCA && (', "{legalModalType && (");

// Also add Privacy Policy and Terms of Service to the footer
const oldFooterLinks = `<button onClick={() => setLegalModalType('dmca')} className="hover:text-red-600 transition-colors uppercase">DMCA Policy</button>
            <a href="#" className="hover:text-red-600 transition-colors">Contact Us</a>`;
const newFooterLinks = `<button onClick={() => setLegalModalType('dmca')} className="hover:text-red-600 transition-colors uppercase">DMCA Policy</button>
            <button onClick={() => setLegalModalType('privacy')} className="hover:text-red-600 transition-colors uppercase">Privacy Policy</button>
            <button onClick={() => setLegalModalType('terms')} className="hover:text-red-600 transition-colors uppercase">Terms of Service</button>
            <button onClick={() => setLegalModalType('disclaimer')} className="hover:text-red-600 transition-colors uppercase">Disclaimer</button>
            <a href="#" className="hover:text-red-600 transition-colors uppercase">Contact Us</a>`;

code = code.replace(oldFooterLinks, newFooterLinks);

fs.writeFileSync('src/App.tsx', code);
