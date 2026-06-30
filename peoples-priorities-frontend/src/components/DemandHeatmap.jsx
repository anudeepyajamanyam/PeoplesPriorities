import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, HeatmapLayer } from '@react-google-maps/api';

const DEFAULT_CENTER = { lat: 13.0400, lng: 77.5800 }; // Bengaluru North center
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

export default function DemandHeatmap({ heatmapPoints }) {
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [points, setPoints] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setGoogleMapsKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  }, []);

  useEffect(() => {
    if (!window.google) return;
    
    // Filter points based on category pills
    const filtered = heatmapPoints.filter(p => {
      if (filter === 'All') return true;
      return p.themeLabel.toLowerCase().includes(filter.toLowerCase());
    });

    const latLngPoints = filtered.map(p => ({
      location: new window.google.maps.LatLng(p.lat, p.lng),
      weight: p.weight
    }));
    
    setPoints(latLngPoints);
  }, [heatmapPoints, filter]);

  const categories = ['All', 'Roads', 'Water', 'Health', 'Education', 'Drainage'];

  return (
    <div className="bg-white rounded-[12px] border border-[#ECE7DE] overflow-hidden flex flex-col h-full min-h-[450px]">
      {/* Filter pills: active pill gets dark fill (#1A1A1A), inactive outline */}
      <div className="p-4 border-b border-[#ECE7DE] flex flex-wrap gap-2 bg-[#FAFAF8]">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all border ${
              filter === cat
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-[#5F5E5A] border-[#ECE7DE] hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Map container: rounded 12px corners matching card style */}
      <div className="flex-grow w-full relative h-[380px]">
        {googleMapsKey ? (
          <LoadScript googleMapsApiKey={googleMapsKey} libraries={['visualization']}>
            <GoogleMap
              mapContainerClassName="w-full h-full"
              center={DEFAULT_CENTER}
              zoom={12}
              options={MAP_OPTIONS}
            >
              {points.length > 0 && (
                <HeatmapLayer
                  data={points}
                  options={{
                    radius: 30,
                    opacity: 0.7
                  }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="absolute inset-0 bg-[#FAFAF8] flex items-center justify-center text-center p-6 text-[#5F5E5A]">
            <div className="space-y-1">
              <p className="font-sans font-medium text-[#1A1A1A] text-sm">Map unavailable — check connection</p>
              <p className="text-xs text-[#888780] max-w-xs mx-auto">Please configure a valid Google Maps API key in your environment settings.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
