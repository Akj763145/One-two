const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the last "};" which is the end of DMCAModal.
// Wait, the end of DMCAModal is:
//       </motion.div>
//     </motion.div>
//   );
// };

const startDelete = code.indexOf('            {loading ? <Loader size={18} className="animate-spin" /> : \'Authenticate\'}');
if (startDelete > -1) {
    code = code.substring(0, startDelete).trimEnd();
    
    code += `

const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));

export default function App() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </React.Suspense>
  );
}
`;
    fs.writeFileSync('src/App.tsx', code);
    console.log("Fixed App.tsx");
} else {
    console.log("Could not find startDelete");
}
