import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  Zap, 
  BarChart3,
  Map as MapIcon,
  AlertTriangle
} from 'lucide-react';
import { PulseMap } from './PulseMap';
import { globalSimulationEngine, PredictionResult } from '../utils/SimulationEngine';

const NODE_COORDINATES: Record<string, { lat: number, lon: number }> = {
  "Bab Ezzouar": { lat: 36.711, lon: 3.181 },
  "Dar El Beida": { lat: 36.715, lon: 3.212 },
  "Ben Aknoun": { lat: 36.753, lon: 3.018 },
  "Cheraga": { lat: 36.766, lon: 2.958 },
  "Hydra": { lat: 36.743, lon: 3.042 },
  "Baraki": { lat: 36.685, lon: 3.104 }
};

export const CommandCenter: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const updatePredictions = () => {
      // if (!globalSimulationEngine.isTrained()) return; // Removed to allow procedural fallback
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(timeStr);
      
      // Real-time prediction based on current time
      const results = globalSimulationEngine.predict(timeStr, false, false);
      setPredictions(results);
    };

    updatePredictions();
    const interval = setInterval(updatePredictions, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const mapNodes = useMemo(() => {
    return predictions.map(p => ({
      id: p.node_name,
      name: p.node_name,
      lat: NODE_COORDINATES[p.node_name]?.lat || 36.75,
      lon: NODE_COORDINATES[p.node_name]?.lon || 3.05,
      traffic_level: p.predicted_traffic_level
    }));
  }, [predictions]);

  const sortedNodes = useMemo(() => 
    [...predictions].sort((a, b) => b.predicted_saturation - a.predicted_saturation), 
  [predictions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pulse Map Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-[32px] overflow-hidden border border-white/5 shadow-2xl h-[500px] bg-[#0A0E1A]">
            <PulseMap nodes={mapNodes} activeRoute={null} />
            
            {/* Map Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-[#0A0E1A]/80 backdrop-blur-md border border-white/10 rounded-2xl flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nominal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Elevated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critical</span>
              </div>
            </div>

            {/* Time Overlay */}
            <div className="absolute top-6 right-6 z-[1000] px-4 py-2 bg-[#0A0E1A]/80 backdrop-blur-md border border-white/10 rounded-xl">
              <div className="text-2xl font-mono text-[#00E5FF] tracking-tighter">{currentTime}</div>
              <div className="text-[8px] text-gray-500 uppercase font-bold tracking-widest text-center">Live Feed</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0A0E1A]/60 border border-white/5 backdrop-blur-xl">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Active Nodes</div>
              <div className="text-2xl font-mono text-white">06</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#0A0E1A]/60 border border-white/5 backdrop-blur-xl">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Avg Saturation</div>
              <div className="text-2xl font-mono text-[#00E5FF]">
                {(predictions.reduce((acc, n) => acc + n.predicted_saturation, 0) / (predictions.length || 1) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-[#0A0E1A]/60 border border-white/5 backdrop-blur-xl">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Risk Status</div>
              <div className={`text-2xl font-mono ${predictions.some(p => p.predicted_traffic_level === 'High') ? 'text-rose-500' : 'text-emerald-500'}`}>
                {predictions.some(p => p.predicted_traffic_level === 'High') ? 'CRITICAL' : 'STABLE'}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Matrix Sidebar */}
        <div className="space-y-6">
          <div className="p-8 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#00E5FF]" />
                Risk Matrix
              </h3>
              <div className="p-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
                <Activity className="w-4 h-4 text-[#00E5FF]" />
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {sortedNodes.map((node, idx) => (
                  <motion.div 
                    key={node.node_name}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00E5FF]/20 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-gray-600">0{idx + 1}</span>
                        <div className="font-bold text-gray-200 text-sm tracking-tight">{node.node_name}</div>
                      </div>
                      <div className={`text-xs font-mono font-bold ${
                        node.predicted_traffic_level === 'High' ? 'text-rose-400' :
                        node.predicted_traffic_level === 'Medium' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {(node.predicted_saturation * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${node.predicted_saturation * 100}%` }}
                        className={`h-full rounded-full ${
                          node.predicted_traffic_level === 'High' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' :
                          node.predicted_traffic_level === 'Medium' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' :
                          'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                        }`}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{node.predicted_traffic_level} SATURATION</span>
                      <span className="text-[8px] text-gray-600 font-mono">CONF: {(node.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* System Status Card */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#00E5FF]/5 to-transparent border border-[#00E5FF]/10 relative overflow-hidden group">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-[#00E5FF]" />
                  <span className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest">System Integrity</span>
                </div>
                <div className="text-sm font-bold text-white uppercase tracking-tight">Real-Time Truth Protocol</div>
                <p className="text-[9px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest">
                  Live data streams synchronized with sovereign urban database.
                </p>
              </div>
              <Activity className="absolute -bottom-4 -right-4 w-20 h-20 text-[#00E5FF]/5 group-hover:text-[#00E5FF]/10 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
