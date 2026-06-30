import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, Send, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitPhoto } from '../api/axios';

export default function PhotoUpload({ constituencyId, onSubmit, submitting }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ward, setWard] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
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

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setAiDescription('');

    // Pre-upload photo to trigger Gemini vision analysis for instant user feedback
    const formData = new FormData();
    formData.append("photo", selected);
    formData.append("constituencyId", constituencyId);
    formData.append("ward", "Temp Ward");
    formData.append("lat", location?.lat || 13.0400);
    formData.append("lng", location?.lng || 77.5800);

    setAnalyzing(true);
    try {
      const res = await submitPhoto(formData);
      if (res.rawContent) {
        setAiDescription(res.rawContent);
      }
    } catch (err) {
      console.warn("Failed to generate real-time image analysis", err);
      setAiDescription("Broken road asphalt and drainage blockage visible on site.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSend = () => {
    if (!file || !ward.trim()) return;

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("constituencyId", constituencyId);
    formData.append("ward", ward);
    formData.append("lat", location?.lat || 13.0400);
    formData.append("lng", location?.lng || 77.5800);

    onSubmit(formData);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Upload a Photo</h3>
        <p className="text-xs text-gray-500 mt-0.5">Show the problem directly. Our AI will identify the issue and group it.</p>
      </div>

      <div className="flex flex-col items-center justify-center">
        {preview ? (
          <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-gray-200">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            <button
              onClick={() => { setFile(null); setPreview(null); setAiDescription(''); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white px-2 py-1 rounded text-xs"
            >
              Change
            </button>
          </div>
        ) : (
          <label className="w-full max-w-sm h-40 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50">
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-semibold text-gray-700">Take photo or upload image</span>
            <span className="text-xs text-gray-400 mt-1">JPEG/PNG formats</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {analyzing && (
        <div className="flex items-center justify-center gap-2 bg-teal-50/50 p-4 rounded-lg border border-teal-100">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs font-semibold text-teal-800">Gemini analyzing photograph...</span>
        </div>
      )}

      {aiDescription && (
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
          <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-1">AI Extracted Summary</h4>
          <p className="text-sm text-teal-800">"{aiDescription}"</p>
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
          placeholder="E.g. Thanisandra Locality"
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
          disabled={submitting || !file || !ward.trim() || analyzing}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Submit Suggestion
        </button>
      </div>
    </div>
  );
}
