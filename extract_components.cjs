const fs = require('fs');

function extractComponent(code, componentName) {
    const startStr = `const ${componentName}: React.FC`;
    const startStr2 = `const ${componentName} =`;
    
    let startIndex = code.indexOf(startStr);
    if (startIndex === -1) startIndex = code.indexOf(startStr2);
    if (startIndex === -1) return null;

    let bracketCount = 0;
    let inComponent = false;
    let endIndex = -1;

    for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') {
            bracketCount++;
            inComponent = true;
        } else if (code[i] === '}') {
            bracketCount--;
        }

        if (inComponent && bracketCount === 0) {
            endIndex = code.indexOf(';', i);
            if (endIndex !== -1 && (endIndex - i) < 5) {
                endIndex++; // include semicolon
            } else {
                endIndex = i + 1;
            }
            break;
        }
    }

    if (endIndex !== -1) {
        return {
            content: code.substring(startIndex, endIndex),
            startIndex,
            endIndex
        };
    }
    return null;
}

let code = fs.readFileSync('src/App.tsx', 'utf8');

const componentsToExtract = [
    'FeedbackManager',
    'LegalModal',
    'AdminSidebar',
    'AdminMobileNav',
    'WelcomeAnimation'
];

for (const comp of componentsToExtract) {
    const result = extractComponent(code, comp);
    if (result) {
        let imports = `import React, { useState, useEffect } from 'react';\nimport { motion } from 'framer-motion';\nimport { Shield, X, Mail, Lock, AlertTriangle, FileText, Trash2, Star, Film, LogOut, LayoutDashboard, Settings } from 'lucide-react';\nimport { supabase } from '../supabaseClient';\nimport { Movie, Review } from '../types';\n\n`;
        // Quick hack: just export it
        let fileContent = imports + result.content + `\nexport default ${comp};\n`;
        
        fs.mkdirSync('src/components', { recursive: true });
        fs.writeFileSync(`src/components/${comp}.tsx`, fileContent);
        
        code = code.substring(0, result.startIndex) + code.substring(result.endIndex);
        
        console.log(`Extracted ${comp}`);
    } else {
        console.log(`Could not find ${comp}`);
    }
}

// Add lazy imports
const lazyImports = `
const FeedbackManager = React.lazy(() => import('./components/FeedbackManager'));
const LegalModal = React.lazy(() => import('./components/LegalModal'));
const AdminSidebar = React.lazy(() => import('./components/AdminSidebar'));
const AdminMobileNav = React.lazy(() => import('./components/AdminMobileNav'));
const WelcomeAnimation = React.lazy(() => import('./components/WelcomeAnimation'));
`;

const importPoint = code.indexOf("const DriveBrowser = React.lazy(");
code = code.substring(0, importPoint) + lazyImports + code.substring(importPoint);

fs.writeFileSync('src/App.tsx', code);
