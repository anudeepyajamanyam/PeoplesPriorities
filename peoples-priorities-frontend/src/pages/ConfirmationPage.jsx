import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, RotateCcw } from 'lucide-react';

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Destructure confirmation state or fallback to defaults
  const { submissionId, type, themeLabel } = location.state || {
    submissionId: "demo-uuid-ref-code",
    type: "text",
    themeLabel: null
  };

  const truncatedId = submissionId.substring(0, 8);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6 font-sans">
      {/* Pulse dot style */}
      <style>{`
        @keyframes pulse-dot {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-white p-8 rounded-[14px] border border-[#ECE7DE] max-w-md w-full text-center space-y-6">
        {/* Large success state: green checkmark in a circle */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E3F2ED] text-[#1D9E75] border border-[#ECE7DE]">
          <Check className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-[24px] font-sans font-medium text-[#1A1A1A]">Suggestion submitted</h2>
          <div className="inline-block bg-[#FAFAF8] text-[#5F5E5A] border border-[#ECE7DE] rounded-full px-3 py-1 text-xs font-mono">
            Reference ID: #{truncatedId}
          </div>
        </div>

        <p className="text-[14px] text-[#5F5E5A] leading-relaxed font-normal">
          Thank you for sharing your feedback. Our AI pipeline is analyzing submissions across your constituency to rank development priorities for your Member of Parliament's office.
        </p>

        {themeLabel ? (
          <div className="bg-[#E3F2ED]/40 p-4 rounded-[10px] border border-[#ECE7DE] text-left space-y-1">
            <span className="text-[10px] font-sans font-medium text-[#0F6E56] uppercase tracking-wider block">AI categorized theme</span>
            <span className="text-sm font-sans font-medium text-[#1A1A1A] block">{themeLabel}</span>
          </div>
        ) : (
          <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#ECE7DE] flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse-dot" />
            <span className="text-xs font-sans font-medium text-[#5F5E5A]">Your suggestion is being reviewed</span>
          </div>
        )}

        <div className="border-t border-[#ECE7DE]/50 pt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/board/KA-01')}
            className="flex-grow bg-[#FF6B35] hover:bg-[#B8431D] text-white py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            View constituency priorities <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-grow border border-[#ECE7DE] text-[#5F5E5A] py-2.5 rounded-[10px] text-xs font-sans font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Submit another
          </button>
        </div>
      </div>
    </div>
  );
}
