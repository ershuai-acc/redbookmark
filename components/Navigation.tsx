
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isLibrary = location.pathname === '/' || location.pathname === '/library';
  const isProfile = location.pathname === '/profile';

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-paper h-[70px] border-t border-primary border-x border-primary/5 flex items-stretch z-50 overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <Link 
        to="/" 
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-r border-primary transition-all duration-300 ${isLibrary ? 'opacity-100' : 'opacity-30'}`}
      >
        <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>folder</span>
        <span className="text-[7.5px] uppercase tracking-[0.2em] font-mono font-bold text-primary">LIBRARY</span>
      </Link>
      <Link 
        to="/profile" 
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${isProfile ? 'opacity-100' : 'opacity-30'}`}
      >
        <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
        <span className="text-[7.5px] uppercase tracking-[0.2em] font-mono font-bold text-primary">PROFILE</span>
      </Link>
    </nav>
  );
};

export default Navigation;
