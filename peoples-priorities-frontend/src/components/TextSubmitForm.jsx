import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TextSubmitForm({ constituencyId, onSubmit, submitting }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Roads & transport');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || !ward.trim()) return;

    onSubmit({
      constituencyId,
      content,
      category,
      language: 'en',
      lat: location?.lat || 13.0400,
      lng: location?.lng || 77.5800,
      ward
    });
  };

  const isFormValid = content.trim().length > 0 && ward.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-[12px] border border-[#ECE7DE]">
      <div>
        <label className="block text-[14px] font-sans font-medium text-[#1A1A1A] mb-2">
          Describe what development work is needed in your area:
        </label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.substring(0, 500))}
            placeholder="E.g. The road near Vidyaranyapura school has large potholes causing accidents..."
            className="w-full h-32 p-3 border border-[#ECE7DE] rounded-[10px] text-sm text-[#1A1A1A] placeholder-[#888780] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FFE8DC] outline-none resize-none transition-all font-sans font-normal leading-relaxed"
            required
          />
          <span className="absolute bottom-3 right-3 text-[11px] font-sans font-medium text-[#888780]">
            {content.length}/500
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-sans font-medium text-[#1A1A1A] mb-1.5">
            Category:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-[44px] px-3 border border-[#ECE7DE] rounded-[10px] text-sm bg-white text-[#1A1A1A] focus:border-[#FF6B35] outline-none font-sans font-medium transition-all"
          >
            <option>Roads & transport</option>
            <option>Water supply</option>
            <option>Healthcare</option>
            <option>Education</option>
            <option>Street lighting</option>
            <option>Drainage</option>
            <option>Agriculture</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-sans font-medium text-[#1A1A1A] mb-1.5">
            Your Ward or Locality Name:
          </label>
          <input
            type="text"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="E.g. Vidyaranyapura Ward 9"
            className="w-full h-[44px] px-3 border border-[#ECE7DE] rounded-[10px] text-sm text-[#1A1A1A] placeholder-[#888780] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FFE8DC] outline-none font-sans font-medium transition-all"
            required
          />
        </div>
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
            type="submit"
            disabled={submitting || !isFormValid}
            className={`px-6 py-2.5 rounded-[10px] text-xs font-sans font-medium transition-colors flex items-center justify-center gap-2 ${
              isFormValid 
                ? 'bg-[#FF6B35] hover:bg-[#B8431D] text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit suggestion
          </button>
          {!isFormValid && (
            <span className="text-[10px] text-[#888780] font-sans">
              * Please fill out the description and locality to submit
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
