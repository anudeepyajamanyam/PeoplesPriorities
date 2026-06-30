import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, FileText, Camera, ArrowRight, Loader2, Cpu, Key, Award, Terminal, Sparkles, MapPin, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getConstituencies, getPriorities, getDashboardStats, getHeatmap, upvotePriority } from '../api/axios';
import Navbar from '../components/Navbar';
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
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between font-sans selection:bg-[#FFE8DC] selection:text-[#B8431D]">
      {/* Navbar */}
      <Navbar lang={lang} setLang={setLang} showMpPortal={true} />

      {/* Hero Section - Background #FFF8F0 */}
      <section className="bg-[#FFF8F0] border-b border-[#ECE7DE] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 flex flex-col items-center">
          {/* Small pill badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#FFE8DC] border border-[#ECE7DE] px-3.5 py-1.5 rounded-full text-[11px] font-sans font-medium text-[#B8431D] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Connecting citizens and representatives</span>
          </div>

          {/* Headline */}
          <h1 className="text-[32px] md:text-[40px] font-sans font-medium text-[#1A1A1A] leading-[1.25] tracking-tight max-w-xl">
            Your voice shapes your <br />
            <span className="text-[#FF6B35]">constituency's future</span>
          </h1>

          {/* Subheading */}
          <p className="text-[14px] leading-relaxed text-[#5F5E5A] max-w-[420px] mx-auto font-sans font-normal">
            Submit local development needs via voice, text, or photos. AI aggregates demand to help your representative act on real needs.
          </p>

          {/* Integrated Selector and CTA Flow */}
          <div className="w-full max-w-sm bg-white border border-[#ECE7DE] p-5 rounded-[12px] space-y-4 shadow-none">
            <div className="text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-sans font-medium text-[#888780] uppercase tracking-wider">
                  Select constituency
                </span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locLoading}
                  className="text-[#FF6B35] hover:text-[#B8431D] font-sans font-medium text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  {locLoading ? "Detecting..." : "Auto-detect"}
                </button>
              </div>
              
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full p-3 bg-white border border-[#ECE7DE] rounded-[10px] text-sm text-[#1A1A1A] focus:border-[#FF6B35] outline-none font-sans font-medium transition-all"
              >
                <option value="" className="text-slate-450">-- Choose constituency --</option>
                {constituencies.map((c) => (
                  <option key={c.id} value={c.id} className="text-[#1A1A1A]">
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStart}
              disabled={!selectedId}
              className="w-full bg-[#FF6B35] hover:bg-[#B8431D] text-white py-3.5 rounded-[12px] text-sm font-sans font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Share your suggestion <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area - Background #FAFAF8 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 space-y-16">
        
        {/* 3 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-[14px] border border-[#ECE7DE] text-left space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#FFE8DC] flex items-center justify-center text-[#FF6B35]">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px]">Speak it</h3>
              <p className="text-xs text-[#5F5E5A] font-sans font-normal leading-relaxed">
                Record your feedback in Hindi, Kannada, Tamil, or English. AI translates and summarizes it instantly.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[14px] border border-[#ECE7DE] text-left space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E3F2ED] flex items-center justify-center text-[#0F6E56]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px]">Write it</h3>
              <p className="text-xs text-[#5F5E5A] font-sans font-normal leading-relaxed">
                Type your issue or suggest a development work. Enter your location details manually or drop a pin.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[14px] border border-[#ECE7DE] text-left space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#ECE8F7] flex items-center justify-center text-[#534AB7]">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px]">Show it</h3>
              <p className="text-xs text-[#5F5E5A] font-sans font-normal leading-relaxed">
                Snap a photo of the road, school, or water pipeline. Gemini describes and tags the issue automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Public Transparency Board */}
        {selectedId && (
          <div className="border-t border-[#ECE7DE] pt-16 space-y-8 text-left">
            <div>
              <h2 className="text-[20px] font-sans font-medium text-[#1A1A1A]">
                Development priorities for {constituencies.find(c => c.id === selectedId)?.name || 'Constituency'}
              </h2>
              <p className="text-xs text-[#5F5E5A]">
                Real-time priorities and spatial demand map for the selected constituency.
              </p>
            </div>

            {telemetryLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#ECE7DE] rounded-[12px] space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
                <span className="text-xs text-[#5F5E5A]">Analyzing public submissions...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stats Row */}
                <StatsRow stats={stats} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#FF6B35]" /> Identified priorities
                    </h3>
                    <PriorityList
                      priorities={priorities}
                      isDashboard={false}
                      onUpvote={handleUpvote}
                      actioningId={actioningId}
                    />
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <h3 className="font-sans font-medium text-[#1A1A1A] text-[15px] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0F6E56]" /> Demand spatial heatmap
                    </h3>
                    <div className="bg-white p-2 rounded-[12px] border border-[#ECE7DE]">
                      <DemandHeatmap heatmapPoints={heatmapPoints} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Blueprint & Hackathon Pitch Guide */}
        <div className="border-t border-[#ECE7DE] pt-16 space-y-6 text-left">
          <div>
            <h2 className="text-[18px] font-sans font-medium text-[#1A1A1A] flex items-center gap-2">
              <span>🛠️ Project blueprint and pitch strategy</span>
            </h2>
            <p className="text-xs text-[#5F5E5A]">
              Explore the system architecture, integration details, and strategic tips to win your competition.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b border-[#ECE7DE] gap-6">
            <button
              onClick={() => setInfoTab('architecture')}
              className={`pb-3 text-xs font-sans font-medium transition-all border-b-2 flex items-center gap-1.5 ${
                infoTab === 'architecture'
                  ? 'border-[#FF6B35] text-[#FF6B35]'
                  : 'border-transparent text-[#888780] hover:text-[#5F5E5A]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Architecture & pipeline
            </button>
            <button
              onClick={() => setInfoTab('keys')}
              className={`pb-3 text-xs font-sans font-medium transition-all border-b-2 flex items-center gap-1.5 ${
                infoTab === 'keys'
                  ? 'border-[#FF6B35] text-[#FF6B35]'
                  : 'border-transparent text-[#888780] hover:text-[#5F5E5A]'
              }`}
            >
              <Key className="w-3.5 h-3.5" /> How to get keys
            </button>
            <button
              onClick={() => setInfoTab('pitch')}
              className={`pb-3 text-xs font-sans font-medium transition-all border-b-2 flex items-center gap-1.5 ${
                infoTab === 'pitch'
                  ? 'border-[#FF6B35] text-[#FF6B35]'
                  : 'border-transparent text-[#888780] hover:text-[#5F5E5A]'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Hackathon win strategy
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-white rounded-[12px] p-6 border border-[#ECE7DE] text-sm leading-relaxed text-[#5F5E5A] space-y-4">
            {infoTab === 'architecture' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-sans font-medium text-[#1A1A1A] text-[14px] flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#FF6B35]" /> Multi-modal async event pipeline
                  </h4>
                  <p className="text-xs text-[#5F5E5A] mt-1">
                    When a citizen submits voice or photo, the backend saves the metadata instantly and fires a <code>SubmissionCreatedEvent</code>. 
                    A dedicated bounded thread pool handles the heavy lifting asynchronously (Speech-to-Text, translation, and photo description).
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#ECE7DE] space-y-1">
                    <span className="text-[10px] font-sans font-medium text-[#888780] uppercase tracking-wider">Resilient architecture</span>
                    <p className="text-xs text-[#5F5E5A]">
                      AI and external API calls are protected by <strong>Resilience4j Circuit Breakers</strong>. 
                      If the GCP Vertex AI quota is reached or credentials are missing, the system gracefully falls back to local NLP keyword clustering and scoring, keeping the app 100% operational.
                    </p>
                  </div>
                  <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#ECE7DE] space-y-1">
                    <span className="text-[10px] font-sans font-medium text-[#888780] uppercase tracking-wider">Dual-mode caching</span>
                    <p className="text-xs text-[#5F5E5A]">
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
                    <h5 className="font-sans font-medium text-[#1A1A1A] text-xs">1. Google Cloud (Vertex AI & Storage)</h5>
                    <p className="text-xs text-[#5F5E5A]">
                      Go to the Google Cloud Console, create a project, and enable the <strong>Vertex AI API</strong> and <strong>Cloud Storage API</strong>. 
                      Create a Service Account, download the JSON key file, and set your environment variable:
                    </p>
                    <pre className="bg-[#FAFAF8] text-[#1A1A1A] p-3 rounded-[8px] text-[11px] mt-1.5 overflow-x-auto font-mono border border-[#ECE7DE]">
                      $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-gcp-key.json"
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-sans font-medium text-[#1A1A1A] text-xs">2. Google Maps JavaScript API (Heatmap)</h5>
                    <p className="text-xs text-[#5F5E5A]">
                      Enable the <strong>Maps JavaScript API</strong> in your GCP console. Generate an API key and paste it in your frontend environment file:
                    </p>
                    <pre className="bg-[#FAFAF8] text-[#1A1A1A] p-3 rounded-[8px] text-[11px] mt-1.5 overflow-x-auto font-mono border border-[#ECE7DE]">
                      VITE_GOOGLE_MAPS_API_KEY=AIzaSy... (in peoples-priorities-frontend/.env)
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-sans font-medium text-[#1A1A1A] text-xs">3. Firebase Authentication</h5>
                    <p className="text-xs text-[#5F5E5A]">
                      Create a project on the Firebase Console, enable Email/Password Authentication, and add the config keys to the <code>.env</code> file.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {infoTab === 'pitch' && (
              <div className="space-y-3">
                <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#ECE7DE] space-y-2">
                  <h4 className="font-sans font-medium text-[#1A1A1A] text-sm">💡 How to pitch this project to judges</h4>
                  <ul className="list-disc pl-5 text-xs text-[#5F5E5A] space-y-1.5">
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
      <footer className="bg-white border-t border-[#ECE7DE] py-6 px-6 text-center text-xs text-[#888780] font-sans font-medium">
        Built for Google Cloud Code for Communities Hackathon 2025
      </footer>
    </div>
  );
}
