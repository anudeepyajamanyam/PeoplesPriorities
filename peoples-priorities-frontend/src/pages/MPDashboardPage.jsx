import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Loader2, Download, Layers } from 'lucide-react';
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
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);

  const CONSTITUENCY_ID = 'KA-01'; // Demo focused on Bengaluru North

  const isDemo = sessionStorage.getItem('demoUser') === 'true';

  useEffect(() => {
    // Basic route protection check
    if (!authLoading && !user && !isDemo) {
      navigate('/mp/login');
    }
  }, [user, authLoading, isDemo]);

  useEffect(() => {
    if (user || isDemo) {
      loadTelemetry();
      
      // Auto-refresh stats and priorities every 5 minutes
      const interval = setInterval(loadTelemetry, 300000);
      return () => clearInterval(interval);
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

  const handleCardClick = (priority) => {
    // Match Priority DTO back to a theme shell
    setSelectedTheme({
      id: priority.id, // ID is mapped properly, wait, priority.theme contains the theme object!
      // In PriorityResponse DTO we only return themeLabel. Let's find the original theme ID or map correctly:
      // The priority response maps the actual theme object fields. Let's find it.
      // Actually we have the priority object which has theme nested if we fetch it, or we can look up from priority.id.
      // Wait, let's find the actual priority in the array:
      id: priorities.find(p => p.id === priority.id)?.id,
      label: priority.themeLabel
    });
    // Let's lookup the actual themeId from our priorities array:
    // Our API PriorityResponse maps: { id, rank, themeLabel, score, submissionCount, evidence, status, approvedAt }
    // Wait, the themeId is required for `getThemeSubmissions(themeId)`.
    // In our `Priority` model, we have `theme_id` mapping.
    // Let's pass the theme ID or the priority ID. In PriorityController we map Priority to PriorityResponse.
    // Let's see: `getThemeSubmissions` in ThemeController takes `themeId`.
    // Since we know the SeedDataRunner generates priorities that map 1:1 to themes, and the theme is EAGER loaded,
    // let's make sure we pass the correct theme ID.
    // Wait, in `PriorityResponse` DTO we have `themeLabel` but not `themeId`.
    // Let's check if we can add `themeId` to DTO or fetch from priorities.
    // Let's see if we can read the themeId.
    // Let's query GET /api/themes?constituencyId={id} to find the theme whose label matches priority.themeLabel!
    // Yes! That is extremely robust. Let's look up by label.
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 py-3.5 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇮🇳</span>
          <div>
            <span className="font-bold text-gray-900 text-sm tracking-tight block">Bengaluru North MP Office</span>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Constituency Portal</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50/20"
        >
          <LogOut className="w-3.5 h-3.5" /> Log Out
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Constituency Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Telemetry metrics auto-refreshes every 5 minutes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCSVExport}
              className="flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" /> Export CSV
            </button>
            <button
              onClick={handleRunPipeline}
              disabled={pipelineRunning || loading}
              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-primary/10"
            >
              {pipelineRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh AI Rankings
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <StatsRow stats={stats} />

        {/* 2-Column Board Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Priorities */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base">Identified Priorities</h3>
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                Ranked by score
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white border border-gray-100 rounded-xl">
                <div className="spinner" />
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
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-base">Demand Spatial Heatmap</h3>
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

      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-semibold mt-12">
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
