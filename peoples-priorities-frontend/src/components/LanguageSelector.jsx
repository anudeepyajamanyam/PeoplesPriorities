import React from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)' }
];

export default function LanguageSelector({ selectedLanguage, onChange }) {
  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-full border border-[#ECE7DE] hover:border-[#FF6B35] transition-colors">
        <Globe className="w-3.5 h-3.5 text-[#5F5E5A]" />
        <select
          value={selectedLanguage}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-[13px] font-sans font-medium text-[#5F5E5A] outline-none cursor-pointer pr-1"
          aria-label="Select Language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-[#1A1A1A]">
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
