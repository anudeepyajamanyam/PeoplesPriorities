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
    // Stop microphone tracks
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

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Speak your priority</h3>
          <p className="text-xs text-gray-500 mt-0.5">Your voice note will be translated and clustered automatically by AI.</p>
        </div>
        <LanguageSelector selectedLanguage={lang} onChange={setLang} />
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <div className="absolute w-28 h-28 bg-primary/20 rounded-full animate-pulse-ring" />
          )}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-red-500 text-white' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105'
            }`}
          >
            {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div className="text-center mt-6">
          <span className="text-xl font-bold text-gray-800">
            00:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-400 block mt-1">
            {isRecording ? "Recording... Max 60 seconds" : "Tap the mic to start"}
          </span>
        </div>
      </div>

      {audioUrl && (
        <div className="bg-surface p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <audio src={audioUrl} controls className="w-full md:max-w-xs" />
          <button
            type="button"
            onClick={() => { setAudioUrl(null); setAudioBlob(null); setSeconds(0); }}
            className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-record
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Your Ward or Locality Name:
        </label>
        <input
          type="text"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          placeholder="E.g. Hebbal Ward 22"
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          required
        />
      </div>

      <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleFetchLocation}
          className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {mapLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <MapPin className="w-4 h-4 text-primary" />
          )}
          {location ? "Location Pinned ✓" : "Pin My Location"}
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={submitting || !audioBlob || !ward.trim()}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Submit Recording
        </button>
      </div>
    </div>
  );
}
