import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react';
import { getPriorities, getDashboardStats } from '../api/axios';
import PriorityList from '../components/PriorityList';
import StatsRow from '../components/StatsRow';

export default function PublicBoardPage() {
  const { constituencyId } = useParams();
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBoardData();
  }, [constituencyId]);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        getPriorities(constituencyId),
        getDashboardStats(constituencyId)
      ]);
      setPriorities(pRes);
      setStats(sRes);
    } catch (e) {
      console.error("Failed to load board telemetry", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-3.5 px-6 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" /> Constituency Priorities
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Bengaluru North Development Priorities
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Ranked by AI based on volume of citizen requests, population metrics, and infrastructure urgency.
            </p>
          </div>
          <button
            onClick={fetchBoardData}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Board
          </button>
        </div>

        {/* Aggregate Stats Row */}
        <StatsRow stats={stats} />

        {/* Priority List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <PriorityList priorities={priorities} isDashboard={false} />
        )}

        <div className="text-center pt-6 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
          Powered by Google Cloud Vertex AI + Gemini
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-semibold">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}
