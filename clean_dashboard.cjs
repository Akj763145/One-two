const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const lines = appCode.split('\n');

const orphanedBody = lines.slice(213, 450).join('\n'); // 0-indexed, so 213 is line 214, 450 is line 450.
// Wait, index 213 is line 214. The slice is [213, 450), which gives exactly 237 lines (214 to 450).

const imports = `import React, { useMemo } from 'react';
import { Activity, Star, Eye, Download, Film, Shield, TrendingUp, Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { Movie } from '../types';
import MovieCard from './MovieCard'; // Wait, does Dashboard use MovieCard? No, it doesn't. Wait, it might.
// Let's check if it uses MovieCard.
`;

const typeDef = `
const Dashboard: React.FC<{
  movies: Movie[],
  onEdit: (m: Movie) => void,
  onDelete: (id: string) => void,
  onDownload: (id: string) => void,
  onView: (id: string) => void,
  onShowDetails: (m: Movie) => void,
  searchQuery: string,
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive') => void,
  loadingActions?: Record<string, boolean>
}> = ({ movies, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery, setActiveTab, loadingActions = {} }) => {
`;

fs.writeFileSync('src/components/AdminDashboard.tsx', imports + typeDef + orphanedBody + '\\nexport default Dashboard;\\n');

// Now remove lines 213 to 449 (which is lines 214 to 450)
lines.splice(213, 237);

fs.writeFileSync('src/App.tsx', lines.join('\n'));
