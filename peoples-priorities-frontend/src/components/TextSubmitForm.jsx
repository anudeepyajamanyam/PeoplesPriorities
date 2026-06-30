import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getConstituencies } from '../api/axios';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Describe what development work is needed in your area:
        </label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.substring(0, 500))}
            placeholder="E.g. The road near Vidyaranyapura school has large potholes causing accidents..."
            className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            required
          />
          <span className="absolute bottom-2.5 right-2.5 text-xs text-gray-400">
            {content.length}/500
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Category:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
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
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Your Ward or Locality Name:
          </label>
          <input
            type="text"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="E.g. Vidyaranyapura Ward 9"
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            required
          />
        </div>
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
          type="submit"
          disabled={submitting || !content.trim() || !ward.trim()}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Suggestion
        </button>
      </div>
    </form>
  );
}
