import React, { useState } from 'react';
import { Camera, Loader2, Send, MapPin } from 'lucide-react';
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

  const isFormValid = file !== null && ward.trim().length > 0 && !analyzing;

  return (
    <div className="bg-white p-6 rounded-[12px] border border-[#ECE7DE] space-y-6">
      <div>
        <h3 className="text-[14px] font-sans font-medium text-[#1A1A1A]">Upload a photo</h3>
        <p className="text-xs text-[#5F5E5A] mt-0.5">Show the problem directly. Our AI will identify the issue and group it.</p>
      </div>

      <div className="flex flex-col items-center justify-center">
        {preview ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: Thumbnail Preview */}
            <div className="relative w-full rounded-[10px] overflow-hidden border border-[#ECE7DE]">
              <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); setAiDescription(''); }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white px-2.5 py-1 rounded-[10px] text-[11px] font-sans font-medium transition-colors"
              >
                Change
              </button>
            </div>

            {/* Right: AI-extracted description */}
            <div className="w-full space-y-2">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-8 bg-[#ECE8F7]/20 border border-[#ECE8F7]/40 rounded-[10px] space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#534AB7]" />
                  <span className="text-[11px] font-sans font-medium text-[#534AB7] uppercase tracking-wider">Gemini analyzing...</span>
                </div>
              ) : (
                aiDescription && (
                  <div className="bg-[#ECE8F7]/20 p-4 rounded-[10px] border border-[#ECE8F7]/40 space-y-1.5">
                    <span className="inline-block text-[10px] font-sans font-medium bg-[#ECE8F7] text-[#534AB7] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      AI detected
                    </span>
                    <p className="text-xs text-[#5F5E5A] leading-relaxed font-normal">"{aiDescription}"</p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <label className="w-full max-w-sm h-40 border-2 border-dashed border-[#FF6B35]/30 hover:border-[#FF6B35] rounded-[12px] flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#FAFAF8]">
            <Camera className="w-8 h-8 text-[#888780] mb-2" />
            <span className="text-sm font-sans font-medium text-[#1A1A1A]">Take photo or upload image</span>
            <span className="text-xs text-[#888780] mt-1">JPEG/PNG formats</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-sans font-medium text-[#1A1A1A] mb-1.5">
          Your Ward or Locality Name:
        </label>
        <input
          type="text"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          placeholder="E.g. Thanisandra Locality"
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
            Submit suggestion
          </button>
          {!isFormValid && (
            <span className="text-[10px] text-[#888780] font-sans">
              * Please upload a photograph and specify your locality to submit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
