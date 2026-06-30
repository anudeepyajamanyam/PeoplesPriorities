import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Download, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { auth, signOut } from '../firebase';
import {
  getPriorities,
  getDashboardStats,
  getHeatmap,
  approvePriority,
  flagPriority,
  triggerPipeline
} from '../api/axios';
import Navbar from '../components/Navbar';
import StatsRow from '../components/StatsRow';
import PriorityList from '../components/PriorityList';
import DemandHeatmap from '../components/DemandHeatmap';
import SubmissionsDrawer from '../components/SubmissionsDrawer';

export default function MPDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [priorities, setPriorities] = useState([]);
  const [stats, setStats] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [lang, setLang] = useState('en-IN');
  const [lastUpdatedMin, setLastUpdatedMin] = useState(0);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);

  const CONSTITUENCY_ID = 'KA-01'; // Demo focused on Bengaluru North

  const isDemo = sessionStorage.getItem('demoUser') === 'true';

  useEffect(() => {
    if (!authLoading && !user && !isDemo) {
      navigate('/mp/login');
    }
  }, [user, authLoading, isDemo]);

  useEffect(() => {
    if (user || isDemo) {
      loadTelemetry();
      
      // Auto-refresh stats and priorities every 5 minutes
      const interval = setInterval(loadTelemetry, 300000);
      
      // Increment last updated timer every minute
      const timerInterval = setInterval(() => {
        setLastUpdatedMin(prev => prev + 1);
      }, 60000);

      return () => {
        clearInterval(interval);
        clearInterval(timerInterval);
      };
    }
  }, [user, isDemo]);

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, hRes] = await Promise.all([
        getPriorities(CONSTITUENCY_ID),
        getDashboardStats(CONSTITUENCY_ID),
        getHeatmap(CONSTITUENCY_ID)
      ]);
      setPriorities(pRes);
      setStats(sRes);
      setHeatmapPoints(hRes);
      setLastUpdatedMin(0); // Reset timer on successful fetch
    } catch (e) {
      console.error("Dashboard reload failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await approvePriority(id);
      toast.success("Priority approved!");
      loadTelemetry();
    } catch (e) {
      toast.error("Failed to approve priority.");
    } finally {
      setActioningId(null);
    }
  };

  const handleFlag = async (id) => {
    setActioningId(id);
    try {
      await flagPriority(id);
      toast.success("Priority flagged.");
      loadTelemetry();
    } catch (e) {
      toast.error("Failed to flag priority.");
    } finally {
      setActioningId(null);
    }
  };

  const handleRunPipeline = async () => {
    setPipelineRunning(true);
    try {
      await triggerPipeline(CONSTITUENCY_ID);
      toast.success("AI pipeline recalculation complete!");
      loadTelemetry();
    } catch (e) {
      toast.error("Pipeline failure: check pending submissions.");
    } finally {
      setPipelineRunning(false);
    }
  };

  const handleCSVExport = () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    window.open(`${baseURL}/api/priorities/export?constituencyId=${CONSTITUENCY_ID}`, '_blank');
  };

  const handleDrawerTrigger = async (priority) => {
    try {
      const themes = await getThemes(CONSTITUENCY_ID);
      const match = themes.find(t => t.label === priority.themeLabel);
      if (match) {
        setSelectedTheme(match);
        setDrawerOpen(true);
      } else {
        toast.error("Could not find matching theme details.");
      }
    } catch (e) {
      toast.error("Failed to load drawer data.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('demoUser');
    signOut(auth).then(() => navigate('/')).catch(() => navigate('/'));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <Navbar
        lang={lang}
        setLang={setLang}
        showMpPortal={true}
        isMpDashboard={true}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-sans font-medium text-[#1A1A1A]">Bengaluru North</h1>
            <p className="text-xs text-[#5F5E5A] mt-0.5">
              Constituency dashboard • updated {lastUpdatedMin === 0 ? 'just' : `${lastUpdatedMin}`} {lastUpdatedMin <= 1 ? 'minute' : 'minutes'} ago
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCSVExport}
              className="flex items-center justify-center gap-1.5 border border-[#ECE7DE] bg-white text-[#5F5E5A] hover:text-[#1A1A1A] px-4 py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={handleRunPipeline}
              disabled={pipelineRunning || loading}
              className="flex items-center justify-center gap-1.5 bg-[#1A1A1A] hover:bg-black text-white px-4 py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors disabled:opacity-50"
            >
              {pipelineRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh AI rankings
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <StatsRow stats={stats} />

        {/* 2-Column Board Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: Priorities */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px]">Identified priorities</h3>
              <span className="text-[10px] bg-[#FAFAF8] border border-[#ECE7DE] text-[#5F5E5A] font-sans font-medium px-2.5 py-1 rounded-full uppercase tracking-wider">
                Ranked by score
              </span>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#ECE7DE] rounded-[12px] space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
                <span className="text-xs text-[#5F5E5A]">Refreshing dashboard priorities...</span>
              </div>
            ) : (
              <PriorityList
                priorities={priorities}
                onCardClick={handleDrawerTrigger}
                onApprove={handleApprove}
                onFlag={handleFlag}
                actioningId={actioningId}
                isDashboard={true}
              />
            )}
          </div>

          {/* Right panel: Heatmap */}
          <div className="lg:col-span-5 space-y-6">
            {/* MP Representative Profile Card */}
            <div className="bg-white p-5 rounded-[12px] border border-[#ECE7DE] space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFE8DC] text-[#FF6B35] flex items-center justify-center font-sans font-medium text-lg shrink-0 select-none">
                  AY
                </div>
                <div>
                  <h4 className="font-sans font-medium text-[#1A1A1A] text-[15px]">Hon. Anudeep Yajamanyam</h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium bg-[#E3F2ED] text-[#0F6E56] px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                    ✓ Lok Sabha Member
                  </span>
                </div>
              </div>
              
              <div className="border-t border-[#ECE7DE]/50 pt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#888780] block text-[10px] uppercase tracking-wider">Constituency</span>
                  <span className="text-[#1A1A1A] font-sans font-medium">Bengaluru North (KA)</span>
                </div>
                <div>
                  <span className="text-[#888780] block text-[10px] uppercase tracking-wider">Official Term</span>
                  <span className="text-[#1A1A1A] font-sans font-medium">2024 - 2029</span>
                </div>
              </div>
            </div>

            <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px]">Demand spatial heatmap</h3>
            <DemandHeatmap heatmapPoints={heatmapPoints} />
          </div>
        </div>
      </main>

      {/* Slide-in drawer */}
      <SubmissionsDrawer
        theme={selectedTheme}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <footer className="bg-white border-t border-[#ECE7DE] py-6 px-6 text-center text-xs text-[#888780] font-sans font-medium mt-12">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}

// Inline fallback since getThemes isn't imported from axios
async function getThemes(constituencyId) {
  const res = await fetch(`/api/themes?constituencyId=${constituencyId}`);
  return res.json();
}
