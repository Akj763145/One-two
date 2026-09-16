const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert states
const stateInsertPoint = code.indexOf('const observer = useRef<IntersectionObserver | null>(null);');
if (stateInsertPoint > -1) {
  const states = `const observer = useRef<IntersectionObserver | null>(null);
  
  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartPoint(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartPoint === 0) return;
    const y = e.touches[0].clientY;
    const distance = y - pullStartPoint;
    if (window.scrollY === 0 && distance > 0) {
      // Add resistance
      setPullDistance(Math.min(distance * 0.4, 100));
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await fetchMovies();
      setIsRefreshing(false);
    }
    setPullStartPoint(0);
    setPullDistance(0);
  };`;
  code = code.substring(0, stateInsertPoint) + states + code.substring(stateInsertPoint + 'const observer = useRef<IntersectionObserver | null>(null);'.length);
}

// Modify main
const mainReplace = `        <>
          <main className="pt-20 md:pt-24 pb-24">`;
const newMain = `        <>
          <main 
            className="pt-20 md:pt-24 pb-24 relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ transform: \`translateY(\${pullDistance}px)\`, transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none' }}
          >
            {/* Pull to refresh indicator */}
            <div 
              className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-opacity duration-200"
              style={{ 
                top: '20px', 
                opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
                transform: \`translateY(\${Math.min(pullDistance - 40, 0)}px)\` 
              }}
            >
              <div className="bg-zinc-900/90 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-xl flex items-center justify-center">
                <Loader size={24} className={\`text-red-500 \${isRefreshing ? 'animate-spin' : ''}\`} style={{ transform: \`rotate(\${pullDistance * 3}deg)\` }} />
              </div>
            </div>`;

code = code.replace(mainReplace, newMain);
fs.writeFileSync('src/App.tsx', code);
console.log('Done');
