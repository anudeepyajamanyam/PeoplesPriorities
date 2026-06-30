import React from 'react';
import { Layers, Check, Flag, Loader2, MessageSquare } from 'lucide-react';

export default function PriorityList({ priorities, onCardClick, onApprove, onFlag, onUpvote, actioningId, isDashboard = false }) {
  
  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-[#1D9E75]'; // green
    if (score >= 40) return 'bg-[#854F0B]'; // amber
    return 'bg-[#FF6B35]'; // coral/red
  };

  const getScoreText = (score) => {
    if (score >= 70) return 'text-[#1D9E75]';
    if (score >= 40) return 'text-[#854F0B]';
    return 'text-[#FF6B35]';
  };

  if (priorities.length === 0) {
    return (
      <div className="bg-white rounded-[12px] border border-[#ECE7DE] p-8 text-center text-[#5F5E5A]">
        <Layers className="w-10 h-10 mx-auto text-[#888780] mb-3" />
        <p className="font-sans font-medium text-[#1A1A1A] text-sm">No suggestions yet for this constituency.</p>
        <p className="text-xs text-[#888780] mt-1">Once citizens start submitting, AI-ranked priorities will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {priorities.map((priority) => (
        <div
          key={priority.id}
          className={`bg-white rounded-[12px] border border-[#ECE7DE] p-5 transition-all hover:bg-slate-50/40 ${
            isDashboard ? 'cursor-pointer' : ''
          }`}
          onClick={() => isDashboard && onCardClick && onCardClick(priority)}
        >
          <div className="flex items-start gap-4">
            {/* Rank badge: circular, light coral background, coral-dark number, 26px */}
            <div className="w-[26px] h-[26px] rounded-full bg-[#FFE8DC] flex items-center justify-center font-sans font-medium text-[#B8431D] text-xs shrink-0 select-none">
              {priority.rank}
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-sans font-medium text-[#1A1A1A] text-[15px] leading-snug">{priority.themeLabel}</h4>
                  
                  {/* Evidence text: 11-12px, muted gray, full sentence, not truncated */}
                  <p className="text-[12px] text-[#5F5E5A] leading-relaxed font-normal">{priority.evidence}</p>
                </div>
                
                {/* Report count badge: small pill, top-right of card, muted background, "X reports" */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-sans font-medium bg-[#FAFAF8] border border-[#ECE7DE] text-[#5F5E5A] px-2.5 py-1 rounded-full whitespace-nowrap">
                    {priority.submissionCount} {priority.submissionCount === 1 ? 'report' : 'reports'}
                  </span>
                  {priority.status && priority.status !== 'pending' && (
                    <span className={`text-[10px] font-sans font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      priority.status === 'approved' 
                        ? 'bg-[#E3F2ED] text-[#0F6E56]' 
                        : 'bg-[#FEF3C7] text-[#854F0B]'
                    }`}>
                      {priority.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Score bar: thin (6px), rounded, color-coded */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#FAFAF8] border border-[#ECE7DE] h-[6px] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreColor(priority.score)}`}
                    style={{ width: `${priority.score}%` }}
                  />
                </div>
                <span className={`text-[12px] font-sans font-medium shrink-0 ${getScoreText(priority.score)}`}>
                  {Math.round(priority.score)}% Priority
                </span>
              </div>

              {/* Action row */}
              {isDashboard ? (
                <div className="flex items-center gap-2 pt-2 border-t border-[#ECE7DE]/45" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onApprove && onApprove(priority.id)}
                    disabled={actioningId === priority.id}
                    className="flex items-center gap-1.5 border border-[#ECE7DE] text-[#0F6E56] hover:bg-[#E3F2ED]/40 px-3 py-1.5 rounded-[10px] text-xs font-sans font-medium transition-colors disabled:opacity-50"
                  >
                    {actioningId === priority.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => onFlag && onFlag(priority.id)}
                    disabled={actioningId === priority.id}
                    className="flex items-center gap-1.5 border border-[#ECE7DE] text-[#854F0B] hover:bg-[#FEF3C7]/40 px-3 py-1.5 rounded-[10px] text-xs font-sans font-medium transition-colors disabled:opacity-50"
                  >
                    {actioningId === priority.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                    Flag
                  </button>
                  <button
                    onClick={() => onCardClick && onCardClick(priority)}
                    className="flex items-center gap-1.5 border border-[#ECE7DE] text-[#5F5E5A] hover:bg-slate-50 px-3 py-1.5 rounded-[10px] text-xs font-sans font-medium transition-colors ml-auto"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    View {priority.submissionCount} {priority.submissionCount === 1 ? 'report' : 'reports'}
                  </button>
                </div>
              ) : (
                onUpvote && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#ECE7DE]/45" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpvote(priority.id)}
                      disabled={actioningId === priority.id}
                      className="flex items-center gap-1.5 border border-[#FF6B35] text-[#FF6B35] hover:bg-[#FFE8DC]/35 px-4 py-1.5 rounded-[10px] text-xs font-sans font-medium transition-all disabled:opacity-50"
                    >
                      {actioningId === priority.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "👍"}
                      I have this issue too
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
