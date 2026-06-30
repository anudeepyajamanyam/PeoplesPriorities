import React, { useState, useEffect } from 'react';
import { X, Play, MessageSquare, Mic, Camera, Loader2, ArrowRight } from 'lucide-react';
import { getThemeSubmissions } from '../api/axios';

export default function SubmissionsDrawer({ theme, isOpen, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen && theme?.id) {
      setSubmissions([]);
      setPage(0);
      setHasMore(true);
      fetchSubmissions(theme.id, 0);
    }
  }, [isOpen, theme]);

  const fetchSubmissions = async (themeId, pageNum) => {
    setLoading(true);
    try {
      const res = await getThemeSubmissions(themeId, pageNum, 10);
      setSubmissions(prev => pageNum === 0 ? res.content : [...prev, ...res.content]);
      setHasMore(!res.last);
    } catch (e) {
      console.error("Failed to fetch submissions for theme", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchSubmissions(theme.id, next);
  };

  const getTypeIcon = (type) => {
    if (type === 'voice') return <Mic className="w-3.5 h-3.5 text-[#534AB7]" />;
    if (type === 'photo') return <Camera className="w-3.5 h-3.5 text-[#0F6E56]" />;
    return <MessageSquare className="w-3.5 h-3.5 text-[#FF6B35]" />;
  };

  const getTypeBadgeStyle = (type) => {
    if (type === 'voice') return 'bg-[#ECE8F7] border-[#ECE8F7]/60 text-[#534AB7]';
    if (type === 'photo') return 'bg-[#E3F2ED] border-[#E3F2ED]/60 text-[#0F6E56]';
    return 'bg-[#FFE8DC] border-[#FFE8DC]/60 text-[#FF6B35]';
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, sec] of Object.entries(intervals)) {
      const counter = Math.floor(seconds / sec);
      if (counter > 0) {
        return `${counter} ${unit}${counter > 1 ? 's' : ''} ago`;
      }
    }
    return "just now";
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#ECE7DE] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 border-b border-[#ECE7DE] flex items-center justify-between bg-[#FAFAF8]">
        <div>
          <span className="text-[10px] font-sans font-medium text-[#888780] uppercase tracking-wider block">Citizen Submissions</span>
          <h3 className="font-sans font-medium text-[#1A1A1A] text-base mt-0.5 truncate max-w-xs">{theme?.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-full text-[#5F5E5A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Decision Context & Demographic Alignment */}
        {theme?.evidence && (
          <div className="bg-[#ECE8F7]/20 rounded-[10px] p-4 border border-[#ECE8F7]/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-medium text-[#534AB7] uppercase tracking-wider">
                📊 AI decision context
              </span>
              <span className="text-xs font-sans font-medium text-[#534AB7] bg-[#ECE8F7] px-2.5 py-0.5 rounded-full">
                Score: {Math.round(theme.score)}%
              </span>
            </div>
            <p className="text-xs text-[#5F5E5A] leading-relaxed font-normal">
              {theme.evidence}
            </p>
            <div className="text-[10px] text-[#888780] font-sans font-medium italic">
              *Weighed against ward demographics, public datasets, and infrastructure gaps.
            </div>
          </div>
        )}

        <div className="border-b border-[#ECE7DE] pb-2">
          <h4 className="font-sans font-medium text-[11px] uppercase tracking-wider text-[#888780]">
            Citizen feedback logs ({submissions.length})
          </h4>
        </div>
        
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-[#FAFAF8] rounded-[10px] p-4 border border-[#ECE7DE] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-xs font-sans font-medium ${getTypeBadgeStyle(sub.type)}`}>
                {getTypeIcon(sub.type)}
                <span className="capitalize">{sub.type}</span>
              </div>
              <span className="text-[10px] text-[#888780] font-sans font-medium">
                {formatTimeAgo(sub.createdAt)}
              </span>
            </div>

            <p className="text-xs text-[#1A1A1A] leading-relaxed font-normal">
              {sub.translatedContent || sub.rawContent}
            </p>

            {sub.type === 'voice' && sub.gcsUri && (
              <div className="flex items-center gap-2 pt-1.5">
                <audio src={`https://storage.googleapis.com/${sub.gcsUri.replace('gs://', '')}`} controls className="h-8 max-w-full" />
              </div>
            )}

            {sub.type === 'photo' && sub.gcsUri && (
              <div className="pt-1.5 rounded-[10px] overflow-hidden border border-[#ECE7DE]">
                <img
                  src={`https://storage.googleapis.com/${sub.gcsUri.replace('gs://', '')}`}
                  alt="Citizen report"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400";
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-[#888780] font-sans font-medium pt-2 border-t border-[#ECE7DE]/50">
              <span>{sub.ward || 'Unknown Ward'}</span>
              <span>Ref: #{sub.id.substring(0, 8)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
          </div>
        )}

        {!loading && hasMore && submissions.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full text-center py-2.5 text-xs font-sans font-medium text-[#FF6B35] hover:text-[#B8431D] transition-colors border border-dashed border-[#ECE7DE] rounded-[10px] bg-[#FAFAF8] hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            Load more submissions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {!loading && submissions.length === 0 && (
          <div className="text-center py-12 text-[#888780] text-xs">
            No submissions loaded.
          </div>
        )}
      </div>
    </div>
  );
}
