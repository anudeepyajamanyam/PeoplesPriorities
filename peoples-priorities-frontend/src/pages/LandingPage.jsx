import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic, FileText, Camera, ArrowRight, Loader2, Cpu, Key, Award, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { getConstituencies, getPriorities, getDashboardStats, getHeatmap, upvotePriority } from '../api/axios';
import LanguageSelector from '../components/LanguageSelector';
import StatsRow from '../components/StatsRow';
import PriorityList from '../components/PriorityList';
import DemandHeatmap from '../components/DemandHeatmap';

export default function LandingPage() {
  const [constituencies, setConstituencies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [lang, setLang] = useState('en-IN');
  const [locLoading, setLocLoading] = useState(false);
  
  // Public telemetry states
  const [priorities, setPriorities] = useState([]);
  const [stats, setStats] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [infoTab, setInfoTab] = useState('architecture');

  const navigate = useNavigate();

  useEffect(() => {
    getConstituencies()
      .then(setConstituencies)
      .catch((e) => console.error("Failed to load constituencies", e));
  }, []);

  // Load public telemetry when a constituency is selected
  useEffect(() => {
    if (selectedId) {
      setTelemetryLoading(true);
      Promise.all([
        getPriorities(selectedId),
        getDashboardStats(selectedId),
        getHeatmap(selectedId)
      ])
        .then(([pRes, sRes, hRes]) => {
          setPriorities(pRes);
          setStats(sRes);
          setHeatmapPoints(hRes);
        })
        .catch((e) => console.error("Failed to load public telemetry", e))
        .finally(() => setTelemetryLoading(false));
    } else {
      setPriorities([]);
      setStats(null);
      setHeatmapPoints([]);
    }
  }, [selectedId]);

  const handleUpvote = async (id) => {
    setActioningId(id);
    try {
      await upvotePriority(id);
      toast.success("Thank you! Your support has been registered.");
      const [pRes, sRes] = await Promise.all([
        getPriorities(selectedId),
        getDashboardStats(selectedId)
      ]);
      setPriorities(pRes);
      setStats(sRes);
    } catch (e) {
      console.error("Failed to upvote", e);
      toast.error("Could not register upvote. Please try again.");
    } finally {
      setActioningId(null);
    }
  };

  const handleDetectLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await res.json();
          const state = (data.address?.state || '').toLowerCase();
          const city = (data.address?.city || data.address?.town || data.address?.district || '').toLowerCase();

          let detectedId = 'KA-01'; // default fallback
          if (state.includes('maharashtra') || city.includes('pune')) {
            detectedId = 'MH-01';
            toast.success("Detected Pune! Selected Pune North.");
          } else if (state.includes('delhi') || city.includes('delhi')) {
            detectedId = 'DL-01';
            toast.success("Detected Delhi! Selected New Delhi Central.");
          } else if (state.includes('karnataka') || city.includes('bengaluru') || city.includes('bangalore')) {
            detectedId = 'KA-01';
            toast.success("Detected Bengaluru! Selected Bengaluru North.");
          } else {
            toast.success("Location pinned! Selected default constituency.");
          }
          setSelectedId(detectedId);
        } catch (e) {
          console.error("Reverse geocoding failed", e);
          setSelectedId('KA-01'); // fallback
          toast.success("Location pinned. Selected Bengaluru North.");
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation error", err);
        setLocLoading(false);
        toast.error("Unable to retrieve location. Please select manually.");
      }
    );
  };

  const handleStart = () => {
    if (!selectedId) return;
    navigate(`/submit?constituencyId=${selectedId}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-3.5 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇮🇳</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">People's Priorities</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector selectedLanguage={lang} onChange={setLang} />
          <Link
            to="/mp/login"
            className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
          >
            MP Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center space-y-8">
        <div className="space-y-4 max-w-2xl">
          <span className="inline-block bg-teal-50 text-primary border border-teal-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Hackathon 2025 Demo App
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Your voice shapes your constituency
          </h1>
          <p className="text-base text-gray-600 leading-relaxed font-normal">
            Submit infrastructure and development suggestions directly to your Member of Parliament's office. Speak, write, or snap a photo of local issues.
          </p>
        </div>

        {/* Dropdown Selector Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 w-full max-w-md space-y-4">
          <div className="text-left">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Select Your constituency:</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locLoading}
                className="text-primary hover:text-primary-dark font-bold flex items-center gap-1 text-xs disabled:opacity-50"
              >
                {locLoading ? "Detecting..." : "📍 Auto-Detect"}
              </button>
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-gray-700"
            >
              <option value="">-- Choose constituency --</option>
              {constituencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={!selectedId}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
          >
            Share Suggestion <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Public Transparency Portal */}
        {selectedId && (
          <div className="w-full border-t border-gray-100 pt-12 space-y-8 text-left animate-fade-in">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">📢 Public Transparency Board</h2>
              <p className="text-xs text-gray-500 mt-1">
                Real-time priorities and spatial demand map for the selected constituency.
              </p>
            </div>

            {telemetryLoading ? (
              <div className="flex items-center justify-center py-20 bg-white border border-gray-100 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <StatsRow stats={stats} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-bold text-gray-800 text-base">Identified Priorities</h3>
                    <PriorityList
                      priorities={priorities}
                      isDashboard={false}
                      onUpvote={handleUpvote}
                      actioningId={actioningId}
                    />
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <h3 className="font-bold text-gray-800 text-base">Demand Spatial Heatmap</h3>
                    <DemandHeatmap heatmapPoints={heatmapPoints} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Blueprint & Hackathon Pitch Guide */}
        <div className="w-full border-t border-gray-100 pt-16 space-y-6 text-left max-w-5xl">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🛠️ Project Blueprint & Pitch Strategy</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Explore the system architecture, integration details, and strategic tips to win your competition.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 gap-4">
            <button
              onClick={() => setInfoTab('architecture')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                infoTab === 'architecture'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Architecture & Pipeline
            </button>
            <button
              onClick={() => setInfoTab('keys')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                infoTab === 'keys'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Key className="w-3.5 h-3.5" /> How to Get Keys
            </button>
            <button
              onClick={() => setInfoTab('pitch')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                infoTab === 'pitch'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Hackathon Win Strategy
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-sm leading-relaxed text-gray-600 space-y-4">
            {infoTab === 'architecture' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-primary" /> Multi-modal Async Event Pipeline
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    When a citizen submits voice or photo, the backend saves the metadata instantly and fires a <code>SubmissionCreatedEvent</code>. 
                    A dedicated bounded thread pool handles the heavy lifting asynchronously (Speech-to-Text, translation, and photo description).
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-3.5 rounded-lg border border-gray-200/60 space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Resilient Architecture</span>
                    <p className="text-xs">
                      AI and external API calls are protected by <strong>Resilience4j Circuit Breakers</strong>. 
                      If the GCP Vertex AI quota is reached or credentials are missing, the system gracefully falls back to local NLP keyword clustering and scoring, keeping the app 100% operational.
                    </p>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-gray-200/60 space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Dual-Mode Caching</span>
                    <p className="text-xs">
                      To scale under heavy loads, the app uses a dual-mode cache (<strong>Caffeine</strong> in-memory for local development, and <strong>Redis</strong> for production). 
                      Caches are evicted dynamically on new upvotes or MP approvals.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {infoTab === 'keys' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-gray-800 text-xs">1. Google Cloud (Vertex AI & Storage)</h5>
                    <p className="text-xs text-gray-500">
                      Go to the <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google Cloud Console</a>, create a project, and enable the <strong>Vertex AI API</strong> and <strong>Cloud Storage API</strong>. 
                      Create a Service Account, download the JSON key file, and set your environment variable:
                    </p>
                    <pre className="bg-gray-800 text-gray-200 p-2 rounded text-[11px] mt-1 overflow-x-auto font-mono">
                      $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-gcp-key.json"
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-xs">2. Google Maps JavaScript API (Heatmap)</h5>
                    <p className="text-xs text-gray-500">
                      Enable the <strong>Maps JavaScript API</strong> in your GCP console. Generate an API key and paste it in your frontend environment file:
                    </p>
                    <pre className="bg-gray-800 text-gray-200 p-2 rounded text-[11px] mt-1 overflow-x-auto font-mono">
                      VITE_GOOGLE_MAPS_API_KEY=AIzaSy... (in peoples-priorities-frontend/.env)
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-xs">3. Firebase Authentication</h5>
                    <p className="text-xs text-gray-500">
                      Create a project on the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Firebase Console</a>, enable Email/Password Authentication, and add the config keys to the <code>.env</code> file.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {infoTab === 'pitch' && (
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-gray-150 space-y-2">
                  <h4 className="font-bold text-gray-800 text-sm">💡 How to Pitch This Project to Judges</h4>
                  <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
                    <li>
                      <strong>The Problem:</strong> Traditional civic complaint portals fail because they require writing long essays (digital/literacy divide) and result in thousands of duplicates that overwhelm administrators.
                    </li>
                    <li>
                      <strong>The Innovation:</strong> A <strong>voice-first</strong> and <strong>photo-first</strong> interface. Citizens just speak or snap a photo. AI handles the translation, duplicates clustering, and ranks them by urgency and population impact.
                    </li>
                    <li>
                      <strong>The Tech Highlights:</strong> Emphasize the production-ready architecture—<strong>asynchronous event-driven ingestion</strong>, <strong>caching</strong>, <strong>circuit breakers</strong>, and <strong>rate limiting</strong>. This is not just a mock; it is built to handle millions of requests.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-semibold">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}
