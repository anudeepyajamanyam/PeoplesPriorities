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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[450px]">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filter === cat
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full relative">
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
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-center p-6 text-gray-500">
            <div>
              <p className="font-semibold text-gray-600">Google Maps API key not configured</p>
              <p className="text-xs text-gray-400 mt-1">Provide VITE_GOOGLE_MAPS_API_KEY in your env settings.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
