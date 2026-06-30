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
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
        <Globe className="w-4 h-4 text-gray-500" />
        <select
          value={selectedLanguage}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer pr-1"
          aria-label="Select Language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-gray-800">
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
