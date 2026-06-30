import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RefreshCcw } from 'lucide-react';

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
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Suggestion Submitted!</h2>
          <p className="text-xs font-semibold text-gray-400 bg-gray-50 py-1.5 px-3 rounded-lg inline-block">
            Reference ID: #{truncatedId}
          </p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed font-normal">
          Our AI pipeline is currently analyzing submissions across your constituency. Your suggestion will be reviewed by your Member of Parliament's office.
        </p>

        {themeLabel && (
          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 text-left">
            <span className="text-[10px] font-bold text-teal-800 uppercase block tracking-wider">AI Categorized Theme</span>
            <span className="text-sm font-semibold text-teal-900 block mt-0.5">{themeLabel}</span>
          </div>
        )}

        <div className="border-t border-gray-50 pt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/board/KA-01')}
            className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/10"
          >
            View Priorities <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCcw className="w-4 h-4" /> Submit Another
          </button>
        </div>
      </div>
    </div>
  );
}
