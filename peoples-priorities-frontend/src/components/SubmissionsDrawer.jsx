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
    if (type === 'voice') return <Mic className="w-4 h-4 text-purple-500" />;
    if (type === 'photo') return <Camera className="w-4 h-4 text-blue-500" />;
    return <MessageSquare className="w-4 h-4 text-teal-500" />;
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
      className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-gray-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div>
          <span className="text-xs font-semibold text-primary block">Citizen Submissions</span>
          <h3 className="font-bold text-gray-800 text-base mt-0.5 truncate max-w-xs">{theme?.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Decision Context & Demographic Alignment */}
        {theme?.evidence && (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                📊 AI Decision Context
              </span>
              <span className="text-xs font-bold text-primary bg-white border border-primary/20 px-2.5 py-0.5 rounded-full">
                Score: {Math.round(theme.score)}%
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {theme.evidence}
            </p>
            <div className="text-[10px] text-gray-400 font-semibold italic">
              *Weighed against ward demographics, public datasets, and infrastructure gaps.
            </div>
          </div>
        )}

        <div className="border-b border-gray-100 pb-2">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider text-gray-400">
            Citizen Feedback Logs ({submissions.length})
          </h4>
        </div>
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                {getTypeIcon(sub.type)}
                <span className="capitalize">{sub.type}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {formatTimeAgo(sub.createdAt)}
              </span>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed font-normal">
              {sub.translatedContent || sub.rawContent}
            </p>

            {sub.type === 'voice' && sub.gcsUri && (
              <div className="flex items-center gap-2 pt-1.5">
                {/* Fallback standard HTML audio for demo */}
                <audio src={`https://storage.googleapis.com/${sub.gcsUri.replace('gs://', '')}`} controls className="h-8 max-w-full" />
              </div>
            )}

            {sub.type === 'photo' && sub.gcsUri && (
              <div className="pt-1.5 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={`https://storage.googleapis.com/${sub.gcsUri.replace('gs://', '')}`}
                  alt="Citizen report"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    // Demo fallback placeholder image if URL signature fails
                    e.target.src = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400";
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold pt-1 border-t border-gray-100">
              <span>{sub.ward || 'Unknown Ward'}</span>
              <span>Ref: #{sub.id.substring(0, 8)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && hasMore && submissions.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full text-center py-2.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors border border-dashed border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 flex items-center justify-center gap-1.5"
          >
            Load More Submissions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {!loading && submissions.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No submissions loaded.
          </div>
        )}
      </div>
    </div>
  );
}
