import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const CityMap = ({ activities }) => {
  // Mock coordinates logic: In a real app, these would come from your Google Places API data
  const getCoords = (id) => {
    const coords = {
      'act-1': [35.7148, 139.7967], // Senso-ji
      'act-2': [35.7110, 139.7915], // Asakusa area
      'act-3': [35.6636, 139.7822], // TeamLab
    };
    return coords[id] || [35.6762, 139.6503]; // Default to Tokyo Central
  };

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer 
        center={[35.6762, 139.6503]} 
        zoom={12} 
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {activities.map((act) => (
          <Marker key={act.id} position={getCoords(act.id)}>
            <Popup>
              <div className="text-slate-900 font-bold">{act.title}</div>
              <div className="text-slate-500 text-xs">{act.time}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};