import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Film } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black shadow-lg shadow-red-600/30">
              <Film size={20} />
            </div>
            <span className="text-xl font-black tracking-tight group-hover:text-red-500 transition-colors">
              MOVIE<span className="text-red-600">WALLAH</span>
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{title}</h1>
          <p className="text-white/60 text-base">{subtitle}</p>
        </div>
        <div className="prose prose-invert max-w-none text-white/80 space-y-6 leading-relaxed">
          {children}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-xs text-white/40">
        <p>© {new Date().getFullYear()} Movie Wallah. All rights reserved. Providing legal OTT streaming guides and reviews.</p>
      </footer>
    </div>
  );
};
