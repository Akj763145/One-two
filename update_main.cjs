const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('const [showDMCA, setShowDMCA] = useState(false);', "const [legalModalType, setLegalModalType] = useState<string | null>(null);");

code = code.replace(
  'onDMCAClick={() => setShowDMCA(true)}',
  "onOpenLegal={(type) => setLegalModalType(type)}"
);

code = code.replace('showDMCA', 'legalModalType');
code = code.replace('showDMCA', 'legalModalType');

// Replace DMCAModal with LegalModal
code = code.replace(
  '{legalModalType && (\\n          <DMCAModal onClose={() => setLegalModalType(null)} />\\n        )}',
  '{legalModalType && (\\n          <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />\\n        )}'
);

code = code.replace(
  '{legalModalType && (',
  '{legalModalType && ('
); // just a check, wait, let's use regex

fs.writeFileSync('src/App.tsx', code);
