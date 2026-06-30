import React from 'react';
import { Layers, Check, Flag, Loader2 } from 'lucide-react';

export default function PriorityList({ priorities, onCardClick, onApprove, onFlag, onUpvote, actioningId, isDashboard = false }) {
  
  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getScoreText = (score) => {
    if (score >= 70) return 'text-emerald-700';
    if (score >= 40) return 'text-amber-700';
    return 'text-rose-700';
  };

  if (priorities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
        <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">No active priorities</p>
        <p className="text-xs text-gray-400 mt-1">Submit suggestions or trigger the AI pipeline to analyze.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {priorities.map((priority) => (
        <div
          key={priority.id}
          className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm transition-all hover:shadow-md ${
            isDashboard ? 'cursor-pointer hover:border-primary/30' : ''
          }`}
          onClick={() => isDashboard && onCardClick(priority)}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-700 text-lg flex-shrink-0">
              {priority.rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-gray-900 truncate text-base">{priority.themeLabel}</h4>
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {priority.submissionCount} citizens submitted
                </span>
                {priority.status !== 'pending' && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    priority.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {priority.status}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreColor(priority.score)}`}
                    style={{ width: `${priority.score}%` }}
                  />
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${getScoreText(priority.score)}`}>
                  {Math.round(priority.score)}% Priority
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{priority.evidence}</p>

              {isDashboard ? (
                <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onApprove(priority.id)}
                    disabled={actioningId === priority.id}
                    className="flex items-center gap-1.5 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-50/50 transition-colors disabled:opacity-50"
                  >
                    {actioningId === priority.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => onFlag(priority.id)}
                    disabled={actioningId === priority.id}
                    className="flex items-center gap-1.5 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-50/50 transition-colors disabled:opacity-50"
                  >
                    {actioningId === priority.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                    Flag
                  </button>
                </div>
              ) : (
                onUpvote && (
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpvote(priority.id)}
                      disabled={actioningId === priority.id}
                      className="flex items-center gap-1.5 border border-primary/20 text-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      {actioningId === priority.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "👍"}
                      I Have This Issue Too
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
