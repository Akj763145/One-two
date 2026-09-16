const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('onDMCAClick: () => void,', 'onOpenLegal: (type: string) => void,');
code = code.replace('onDMCAClick,', 'onOpenLegal,');
code = code.replace(
  '<Shield size={18} /> DMCA Policy\n                    </button>',
  `<Shield size={18} /> DMCA Policy
                    </button>
                    <button 
                      onClick={() => { onOpenLegal('privacy'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/70 hover:text-white"
                    >
                      <Lock size={18} /> Privacy Policy
                    </button>
                    <button 
                      onClick={() => { onOpenLegal('disclaimer'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/70 hover:text-white"
                    >
                      <AlertTriangle size={18} /> Disclaimer
                    </button>
                    <button 
                      onClick={() => { onOpenLegal('terms'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/70 hover:text-white"
                    >
                      <FileText size={18} /> Terms of Service
                    </button>`
);
code = code.replace('onDMCAClick();', "onOpenLegal('dmca');");

fs.writeFileSync('src/App.tsx', code);
console.log('Updated Navbar');
