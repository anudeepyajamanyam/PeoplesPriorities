import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, RotateCcw, Send, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import LanguageSelector from './LanguageSelector';

export default function VoiceRecorder({ constituencyId, onSubmit, submitting }) {
  const [lang, setLang] = useState('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [ward, setWard] = useState('');
  const [location, setLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const handleFetchLocation = () => {
    setMapLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            const locality = data.address?.suburb || data.address?.neighbourhood || data.address?.village || data.address?.residential || data.address?.city_district || "";
            if (locality) {
              setWard(locality);
              toast.success(`Location pinned! Detected ward: ${locality}`);
            } else {
              setWard("Ward 1");
              toast.success("Location pinned! Selected default ward.");
            }
          } catch (e) {
            console.error("Reverse geocoding failed", e);
            setWard("Vidyaranyapura Ward");
            toast.success("Location pinned!");
          } finally {
            setMapLoading(false);
          }
        },
        () => {
          setLocation({ lat: 13.0400, lng: 77.5800 });
          setWard("Vidyaranyapura Ward 9");
          setMapLoading(false);
          toast.success("Using default demo location.");
        }
      );
    } else {
      setLocation({ lat: 13.0400, lng: 77.5800 });
      setWard("Vidyaranyapura Ward 9");
      setMapLoading(false);
    }
  };

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startRecording = async () => {
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      alert("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    clearInterval(timerRef.current);
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const handleSend = () => {
    if (!audioBlob || !ward.trim()) return;
    
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice-note.wav");
    formData.append("language", lang.split('-')[0]); // code (hi, kn, ta, en)
    formData.append("constituencyId", constituencyId);
    formData.append("ward", ward);
    formData.append("lat", location?.lat || 13.0400);
    formData.append("lng", location?.lng || 77.5800);

    onSubmit(formData);
  };

  const isFormValid = audioBlob !== null && ward.trim().length > 0;

  return (
    <div className="bg-white p-6 rounded-[12px] border border-[#ECE7DE] space-y-6">
      {/* Styles for the pulsing ring animation */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECE7DE]/50 pb-4">
        <div>
          <h3 className="text-[14px] font-sans font-medium text-[#1A1A1A]">Speak your priority</h3>
          <p className="text-xs text-[#5F5E5A] mt-0.5">Your voice note will be translated and clustered automatically by AI.</p>
        </div>
        <LanguageSelector selectedLanguage={lang} onChange={setLang} />
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <div className="absolute w-28 h-28 bg-[#FFE8DC] rounded-full animate-pulse-ring" />
          )}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : 'bg-[#FF6B35] text-white hover:bg-[#B8431D]'
            }`}
          >
            {isRecording ? <Square className="w-6 h-6 fill-white" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>

        <div className="text-center mt-6">
          <span className="text-[20px] font-mono font-medium text-[#1A1A1A]">
            00:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-[#888780] block mt-1">
            {isRecording ? "Recording... Max 60 seconds" : "Tap the mic to start"}
          </span>
        </div>
      </div>

      {audioUrl && (
        <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#ECE7DE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-grow space-y-2">
            <audio src={audioUrl} controls className="w-full h-10" />
            
            {/* Waveform visualization placeholder */}
            <div className="h-6 flex items-end gap-1 px-2 pt-2 justify-center md:justify-start">
              {[35, 60, 45, 80, 50, 70, 30, 90, 40, 65, 55, 75, 45, 85, 30].map((h, i) => (
                <div 
                  key={i} 
                  className="bg-[#0F6E56]/40 w-1 rounded-full transition-all duration-300"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => { setAudioUrl(null); setAudioBlob(null); setSeconds(0); }}
            className="flex items-center justify-center gap-1.5 border border-[#ECE7DE] text-[#5F5E5A] px-3.5 py-2 rounded-[10px] text-xs font-sans font-medium hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-record
          </button>
        </div>
      )}

      <div>
        <label className="block text-[13px] font-sans font-medium text-[#1A1A1A] mb-1.5">
          Your Ward or Locality Name:
        </label>
        <input
          type="text"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          placeholder="E.g. Hebbal Ward 22"
          className="w-full h-[44px] px-3 border border-[#ECE7DE] rounded-[10px] text-sm text-[#1A1A1A] placeholder-[#888780] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FFE8DC] outline-none font-sans font-medium transition-all"
          required
        />
      </div>

      <div className="border-t border-[#ECE7DE]/50 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleFetchLocation}
          className="flex items-center justify-center gap-2 border border-[#ECE7DE] text-[#5F5E5A] hover:bg-slate-50 px-4 py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors"
        >
          {mapLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
          ) : (
            <MapPin className="w-4 h-4 text-[#FF6B35]" />
          )}
          {location ? "Location Pinned ✓" : "Pin My Location"}
        </button>

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={submitting || !isFormValid}
            className={`px-6 py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 ${
              isFormValid 
                ? 'bg-[#FF6B35] hover:bg-[#B8431D] text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit recording
          </button>
          {!isFormValid && (
            <span className="text-[10px] text-[#888780] font-sans">
              * Please record your voice and specify your locality to submit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
