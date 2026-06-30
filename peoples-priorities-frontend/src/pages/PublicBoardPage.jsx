import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getPriorities, getDashboardStats, getConstituencies } from '../api/axios';
import PriorityList from '../components/PriorityList';
import StatsRow from '../components/StatsRow';
import Navbar from '../components/Navbar';

export default function PublicBoardPage() {
  const { constituencyId } = useParams();
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState([]);
  const [stats, setStats] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en-IN');

  useEffect(() => {
    getConstituencies()
      .then(setConstituencies)
      .catch((e) => console.error("Failed to load constituencies", e));
  }, []);

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

  const constituencyName = constituencies.find(c => c.id === constituencyId)?.name || 'Constituency';

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans">
      {/* Shared Navbar */}
      <Navbar lang={lang} setLang={setLang} showMpPortal={true} />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-8">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-sans font-medium text-[#5F5E5A] hover:text-[#FF6B35] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-sans font-medium text-[#1A1A1A] leading-tight">
              Development priorities for {constituencyName}
            </h1>
            <p className="text-xs text-[#5F5E5A] font-sans font-normal mt-1">
              Ranked by AI based on volume of citizen requests, population metrics, and infrastructure urgency.
            </p>
          </div>
          
          <button
            onClick={fetchBoardData}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 border border-[#ECE7DE] bg-white text-[#5F5E5A] hover:text-[#1A1A1A] px-4 py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh board
          </button>
        </div>

        {/* Aggregate Stats Row */}
        <StatsRow stats={stats} />

        {/* Priority List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#ECE7DE] rounded-[12px] space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#FF6B35]" />
            <span className="text-xs text-[#5F5E5A]">Refreshing priorities...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <PriorityList priorities={priorities} isDashboard={false} />
          </div>
        )}

        <div className="text-center pt-6 text-[10px] text-[#888780] font-sans font-medium uppercase tracking-wider">
          Powered by Google Cloud Vertex AI + Gemini
        </div>
      </main>

      <footer className="bg-white border-t border-[#ECE7DE] py-6 px-6 text-center text-xs text-[#888780] font-sans font-medium">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}
