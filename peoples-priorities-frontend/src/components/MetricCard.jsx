import React from 'react';

export default function MetricCard({ icon: Icon, value, label, color }) {
  const colorMap = {
    coral: {
      bg: 'bg-[#FFE8DC]',
      text: 'text-[#FF6B35]',
    },
    purple: {
      bg: 'bg-[#ECE8F7]',
      text: 'text-[#534AB7]',
    },
    teal: {
      bg: 'bg-[#E3F2ED]',
      text: 'text-[#0F6E56]',
    },
    amber: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#854F0B]',
    },
  };

  const selectedColor = colorMap[color] || colorMap.coral;

  return (
    <div className="bg-white border border-[#ECE7DE] p-5 rounded-[12px] flex items-center gap-4 w-full">
      {/* 38x38px, 10px radius icon badge */}
      <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${selectedColor.bg} ${selectedColor.text} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="space-y-0.5">
        <span className="block text-[20px] font-medium text-[#1A1A1A] leading-none">
          {value !== undefined && value !== null ? value : '-'}
        </span>
        <span className="block text-[10px] font-sans font-medium text-[#888780] uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
