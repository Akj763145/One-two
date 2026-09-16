const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const additionalImports = `import { motion } from 'framer-motion';
import { BarChart3, Edit, Trash2 } from 'lucide-react';
const sharedTransition = { type: "spring", stiffness: 260, damping: 32, mass: 1 } as any;
`;

code = code.replace("import MovieCard from './MovieCard';", additionalImports);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
