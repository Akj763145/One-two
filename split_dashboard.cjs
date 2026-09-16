const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const startRegex = /const Dashboard: React\.FC<[\s\S]*?> = \(\{[\s\S]*?\}\) => \{/;
const match = startRegex.exec(code);

if (match) {
    let startIndex = match.index;
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
            endIndex = code.indexOf(';', i) + 1;
            break;
        }
    }

    if (endIndex !== -1) {
        let compCode = code.substring(startIndex, endIndex);
        
        let imports = `import React, { useMemo } from 'react';
import { Activity, Star, Eye, Download, Film, Shield, TrendingUp, Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { Movie } from '../types';

`;
        
        // Ensure MovieCard is imported if used, but let's just assume we need to import it.
        // Wait, does Dashboard use MovieCard? No, it just shows stats.
        // Let's write it out to src/components/AdminDashboard.tsx
        fs.writeFileSync('src/components/AdminDashboard.tsx', imports + compCode + '\\nexport default Dashboard;\\n');
        console.log('Extracted Dashboard');
        
        // Remove from App.tsx
        code = code.substring(0, startIndex) + code.substring(endIndex);
        
        // Add lazy import to App.tsx
        const lazyImport = `const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));\\n`;
        const importPoint = code.indexOf("const DriveBrowser = React.lazy(");
        code = code.substring(0, importPoint) + lazyImport + code.substring(importPoint);
        
        // Replace <Dashboard ... /> with <AdminDashboard ... />
        code = code.replace(/<Dashboard /g, '<AdminDashboard ');
        
        // Remove recharts imports from App.tsx
        code = code.replace(/import\s*\{\s*(?:ResponsiveContainer|AreaChart|Area|XAxis|YAxis|CartesianGrid|Tooltip as RechartsTooltip)[^}]*\}\s*from\s*'recharts';/g, '');
        
        fs.writeFileSync('src/App.tsx', code);
    }
} else {
    console.log('Dashboard component not found');
}
