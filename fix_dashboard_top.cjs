const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
    "}> = ({ movies, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery, setActiveTab, loadingActions = {} }) => {",
    "}> = ({ movies, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery, setActiveTab, loadingActions = {} }) => {\\n  const stats = useMemo(() => {\\n    const totalMovies = movies.length;"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
