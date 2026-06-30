import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Navbar({ lang, setLang, showMpPortal = true, isMpDashboard = false, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-[#ECE7DE] py-4 px-6 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-sans font-medium text-sm tracking-tight select-none">
            PP
          </div>
          <span className="font-sans font-medium text-[16px] text-[#1A1A1A] tracking-tight transition-colors group-hover:text-[#FF6B35]">
            People's priorities
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <LanguageSelector selectedLanguage={lang} onChange={setLang} />
          </div>

          {showMpPortal && (
            isMpDashboard ? (
              <button
                onClick={onLogout}
                className="font-sans font-medium text-[13px] text-[#5F5E5A] hover:text-[#1A1A1A] border border-[#ECE7DE] px-4 py-2 rounded-full bg-white transition-all hover:bg-slate-50"
              >
                Log out
              </button>
            ) : (
              <Link
                to="/mp/login"
                className="font-sans font-medium text-[13px] text-[#5F5E5A] hover:text-[#FF6B35] border border-[#ECE7DE] px-4 py-2 rounded-full bg-white transition-all hover:bg-slate-55 hover:border-[#FF6B35]"
              >
                MP login
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
