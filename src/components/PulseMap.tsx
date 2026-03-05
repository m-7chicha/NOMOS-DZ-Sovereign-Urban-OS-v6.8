import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface NodeData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  traffic_level: 'Low' | 'Medium' | 'High';
}

interface PulseMapProps {
  nodes: NodeData[];
  activeRoute: [number, number][] | null;
}

const createPulseIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pulse-icon',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border-radius: 50%;
        box-shadow: 0 0 15px ${color}, 0 0 30px ${color};
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const getColorForTraffic = (level: 'Low' | 'Medium' | 'High') => {
  switch (level) {
    case 'Low': return '#10B981'; // Green
    case 'Medium': return '#F59E0B'; // Amber
    case 'High': return '#EF4444'; // Red
    default: return '#10B981';
  }
};

// Component to handle map center updates
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const PulseMap: React.FC<PulseMapProps> = ({ nodes, activeRoute }) => {
  const defaultCenter: [number, number] = [36.752887, 3.042048]; // Algiers center

  return (
    <motion.div 
      className="relative w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(var(--pulse-color), 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0); }
          }
          .leaflet-container {
            background-color: #0A0E1A;
          }
          .leaflet-tile-pane {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
          }
        `}
      </style>
      
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {nodes.map((node) => (
          <Marker 
            key={node.id} 
            position={[node.lat, node.lon]}
            icon={createPulseIcon(getColorForTraffic(node.traffic_level))}
          >
            <Popup className="glass-popup">
              <div className="p-2 bg-[#0A0E1A] text-white rounded-lg border border-[#00E5FF]/30">
                <h3 className="font-bold text-[#00E5FF]">{node.name}</h3>
                <p className="text-sm text-gray-300">Traffic: <span style={{ color: getColorForTraffic(node.traffic_level) }}>{node.traffic_level}</span></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {activeRoute && (
          <Polyline 
            positions={activeRoute} 
            pathOptions={{ 
              color: '#EF4444', // Red for contagion
              weight: 6, 
              opacity: 0.8,
              className: 'contagion-shockwave'
            }} 
          />
        )}
      </MapContainer>

      <style>
        {`
          .contagion-shockwave {
            stroke-dasharray: 10, 10;
            animation: dash 1s linear infinite, glow-red 2s infinite;
          }
          @keyframes dash {
            to { stroke-dashoffset: -20; }
          }
          @keyframes glow-red {
            0%, 100% { filter: drop-shadow(0 0 5px #EF4444); }
            50% { filter: drop-shadow(0 0 15px #EF4444); }
          }
        `}
      </style>

      {/* Glassmorphic Overlay Panel */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-[1000] p-3 md:p-4 bg-[#0A0E1A]/80 backdrop-blur-md border border-[#00E5FF]/30 rounded-xl text-white shadow-lg max-w-[150px] md:max-w-none">
        <h2 className="text-sm md:text-xl font-bold text-[#00E5FF] mb-1 md:mb-2 tracking-wider">NOMOS-DZ</h2>
        <p className="text-[8px] md:text-xs text-gray-400 uppercase tracking-widest mb-2 md:mb-4">Live Pulse Map</p>
        
        <div className="flex flex-col gap-1 md:gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></div>
            <span className="text-[10px] md:text-sm font-mono text-gray-300">Low Sat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"></div>
            <span className="text-[10px] md:text-sm font-mono text-gray-300">Med Sat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]"></div>
            <span className="text-[10px] md:text-sm font-mono text-gray-300">High Sat</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
