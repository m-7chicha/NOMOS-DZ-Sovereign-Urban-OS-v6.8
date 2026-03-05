import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, 
  CloudRain, 
  Moon, 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Lock, 
  Unlock, 
  Activity,
  Zap,
  BarChart3,
  Layers,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  Map as MapIcon,
  Terminal,
  Cpu,
  MessageSquare,
  Info,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalSimulationEngine, PredictionResult } from '../utils/SimulationEngine';
import { NomosGPT } from './NomosGPT';

interface IntelligenceLabProps {
  time: number;
  setTime: (time: number) => void;
  isRain: boolean;
  setIsRain: (isRain: boolean) => void;
  isRamadan: boolean;
  setIsRamadan: (isRamadan: boolean) => void;
  eventType: string;
  setEventType: (eventType: string) => void;
  predictions: PredictionResult[];
  onRunSimulation?: (overrides?: { time?: number, isRain?: boolean, isRamadan?: boolean, eventType?: string }) => void;
  isSimulating?: boolean;
  engineStats?: { latency: number; accuracy: number };
  onExportBrief?: () => void;
}

export const IntelligenceLab: React.FC<IntelligenceLabProps> = ({
  time,
  setTime,
  isRain,
  setIsRain,
  isRamadan,
  setIsRamadan,
  eventType,
  setEventType,
  predictions,
  onRunSimulation,
  isSimulating = false,
  engineStats = { latency: 12, accuracy: 94.2 },
  onExportBrief
}) => {
  const [selectedIntersection, setSelectedIntersection] = useState<string>('All');

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Simulation Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00E5FF]" />
                Simulation Parameters
              </h3>
              {isSimulating && <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin" />}
            </div>

            {/* Time Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Temporal Coordinate</label>
                <span className="text-xl font-mono text-[#00E5FF]">{formatTime(time)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1439" 
                step="15"
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsRain(!isRain)}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${isRain ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}
              >
                <CloudRain className={`w-6 h-6 ${isRain ? 'animate-bounce' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Rain Protocol</span>
              </button>
              <button 
                onClick={() => setIsRamadan(!isRamadan)}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${isRamadan ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}
              >
                <Moon className={`w-6 h-6 ${isRamadan ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Ramadan Mode</span>
              </button>
            </div>

            {/* Intersection Selector */}
            <div className="space-y-4">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Target Intersection</label>
              <select 
                value={selectedIntersection}
                onChange={(e) => setSelectedIntersection(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-300 focus:outline-none focus:border-[#00E5FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Nodes (Global View)</option>
                <option value="Bab Ezzouar">Bab Ezzouar</option>
                <option value="Dar El Beida">Dar El Beida</option>
                <option value="Ben Aknoun">Ben Aknoun</option>
                <option value="Cheraga">Cheraga</option>
                <option value="Hydra">Hydra</option>
                <option value="Baraki">Baraki</option>
              </select>
            </div>

            {/* Event Type Selector */}
            <div className="space-y-4">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Sovereign Event Protocol</label>
              <select 
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-300 focus:outline-none focus:border-[#00E5FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="None">None (Standard Flow)</option>
                <option value="National Day">National Day</option>
                <option value="Protest">Civil Action / Protest</option>
                <option value="Maintenance">Infrastructure Maintenance</option>
                <option value="Sports">Major Sporting Event</option>
              </select>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="w-full py-4 rounded-2xl bg-[#00E5FF] text-[#0A0E1A] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,229,255,0.2)] flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_40px_rgba(0,229,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className={`w-5 h-5 ${isSimulating ? 'animate-pulse' : ''}`} />
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </motion.button>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#00E5FF] mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tighter">
                Adjusting these parameters triggers a Weighted KNN re-calculation across 2,880 sovereign records.
              </p>
            </div>
          </div>

          {/* System Health */}
          <div className="p-8 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-[#00E5FF]" />
              Engine Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Inference Latency</span>
                <span className="text-xs font-mono text-emerald-400">{engineStats.latency}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Model Accuracy</span>
                <span className="text-xs font-mono text-emerald-400">{engineStats.accuracy.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Neighbors (K)</span>
                <span className="text-xs font-mono text-gray-300">5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nomos-GPT Handshake */}
        <div className="lg:col-span-2">
          <NomosGPT 
            simulationState={{ time: formatTime(time), isRain, isRamadan, eventType, predictions }}
            controls={{
              setTime,
              setIsRain,
              setIsRamadan,
              setEventType,
              onRunSimulation,
              onExportBrief
            }}
          />
        </div>
      </div>

      {/* Predictive Matrix */}
      <div className="p-8 rounded-[40px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-[#00E5FF]" />
              Predictive Risk Matrix
            </h3>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Real-time Node Saturation Analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Med</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-600" />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">High</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {predictions.map((pred, idx) => {
              const isSelected = selectedIntersection === 'All' || selectedIntersection === pred.node_name;
              return (
              <motion.div 
                key={pred.node_name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: isSelected ? 1 : 0.3, scale: isSelected ? 1 : 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={`group p-6 rounded-3xl bg-white/5 border transition-all relative overflow-hidden ${isSelected ? 'border-white/20 hover:border-[#00E5FF]/30' : 'border-transparent'}`}
              >
                {/* Background Glow */}
                <div className={`absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-10 transition-opacity group-hover:opacity-20 ${
                  pred.predicted_saturation > 0.7 ? 'bg-rose-600' :
                  pred.predicted_saturation >= 0.3 ? 'bg-amber-500' :
                  'bg-[#00E5FF]'
                }`} />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-200 group-hover:text-white transition-colors">{pred.node_name}</h4>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Node ID: 0{idx + 1}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    pred.predicted_saturation > 0.7 ? 'bg-rose-600/10 text-rose-400 border border-rose-600/20' :
                    pred.predicted_saturation >= 0.3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                  }`}>
                    {pred.predicted_saturation > 0.7 ? 'High' : pred.predicted_saturation >= 0.3 ? 'Medium' : 'Low'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-500">Saturation Index</span>
                      <span className={
                        pred.predicted_saturation > 0.7 ? 'text-rose-400' :
                        pred.predicted_saturation >= 0.3 ? 'text-amber-400' :
                        'text-[#00E5FF]'
                      }>{(pred.predicted_saturation * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pred.predicted_saturation * 100}%` }}
                        className={`h-full ${
                          pred.predicted_saturation > 0.7 ? 'bg-rose-600' :
                          pred.predicted_saturation >= 0.3 ? 'bg-amber-500' :
                          'bg-[#00E5FF]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-gray-600" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Confidence</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{(pred.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pred.confidence * 100}%` }}
                        className="h-full bg-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
