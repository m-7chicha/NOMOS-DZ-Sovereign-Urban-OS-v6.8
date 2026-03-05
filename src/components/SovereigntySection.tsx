import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, 
  TrendingDown, 
  AlertCircle, 
  Droplets, 
  Wind,
  ShieldCheck,
  Zap,
  BarChart3,
  Flame,
  TrendingUp,
  Info,
  ShieldAlert
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { PredictionResult, globalSimulationEngine } from '../utils/SimulationEngine';
import { calculateEnvironmentalImpact, EmissionsResult } from '../utils/emissions';

interface SovereigntySectionProps {
  predictions: PredictionResult[];
  isRain: boolean;
  isRamadan: boolean;
  eventType: string;
  time: string;
}

export const SovereigntySection: React.FC<SovereigntySectionProps> = ({ 
  predictions, 
  isRain, 
  isRamadan, 
  eventType,
  time 
}) => {
  const impactResults = useMemo(() => {
    return predictions.map(p => calculateEnvironmentalImpact({
      node_name: p.node_name,
      saturation_index: p.predicted_saturation,
      traffic_level: p.predicted_traffic_level
    }));
  }, [predictions]);

  const totalCO2 = useMemo(() => impactResults.reduce((acc, r) => acc + r.co2_emissions, 0), [impactResults]);
  const totalFuel = useMemo(() => impactResults.reduce((acc, r) => acc + r.fuel_waste, 0), [impactResults]);
  const avgGreenScore = useMemo(() => impactResults.reduce((acc, r) => acc + r.green_score, 0) / (impactResults.length || 1), [impactResults]);
  const hotspots = useMemo(() => impactResults.filter(r => r.is_hotspot), [impactResults]);

  // Generate chart data: Simulated vs Baseline
  // For baseline, we'll simulate a "Normal" state (No rain, no ramadan, no event)
  const chartData = useMemo(() => {
    // We'll create a 24-hour projection for the current parameters
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    return hours.map(h => {
      const sim = globalSimulationEngine.predict(h, isRain, isRamadan, eventType);
      const base = globalSimulationEngine.predict(h, false, false, 'None');
      
      const simTotal = sim.reduce((acc, p) => acc + calculateEnvironmentalImpact({
        node_name: p.node_name,
        saturation_index: p.predicted_saturation,
        traffic_level: p.predicted_traffic_level
      }).co2_emissions, 0);

      const baseTotal = base.reduce((acc, p) => acc + calculateEnvironmentalImpact({
        node_name: p.node_name,
        saturation_index: p.predicted_saturation,
        traffic_level: p.predicted_traffic_level
      }).co2_emissions, 0);

      return {
        time: h,
        simulated: Number(simTotal.toFixed(1)),
        baseline: Number(baseTotal.toFixed(1))
      };
    });
  }, [isRain, isRamadan, eventType, time]);

  const insights = useMemo(() => {
    let cause = "Standard Urban Flow";
    if (eventType !== 'None') cause = `${eventType} Protocol`;
    else if (isRain && isRamadan) cause = "Rain Protocol + Ramadan Cultural Shift";
    else if (isRain) cause = "Precipitation-Induced Friction";
    else if (isRamadan) cause = "Ramadan Peak Compression";

    const result = totalCO2 > 5000 
      ? "Sustained high emissions will lead to localized air quality degradation and 12% increase in respiratory health risk within 24 months."
      : "Environmental impact remains within sovereign safety margins, but localized hotspots require Command intervention to prevent systemic decay.";

    return { cause, result };
  }, [isRain, isRamadan, totalCO2]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wind className="w-16 h-16 text-[#00E5FF]" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3 text-[#00E5FF]" />
              Total CO2 Emissions
            </div>
            <div className="text-4xl font-mono text-white tracking-tighter">
              {totalCO2.toLocaleString()} <span className="text-sm text-gray-500 font-sans">kg/hr</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              <TrendingDown className="w-3 h-3" />
              Sovereign Local Calc
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplets className="w-16 h-16 text-amber-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <Flame className="w-3 h-3 text-amber-500" />
              Fuel Waste Estimator
            </div>
            <div className="text-4xl font-mono text-amber-400 tracking-tighter">
              {totalFuel.toLocaleString()} <span className="text-sm text-gray-500 font-sans">L/hr</span>
            </div>
            <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
              Congestion-Induced Idling
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Leaf className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Green Score
            </div>
            <div className="text-4xl font-mono text-emerald-400 tracking-tighter">
              {avgGreenScore.toFixed(0)} <span className="text-sm text-gray-500 font-sans">/ 100</span>
            </div>
            <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
              Sovereign Target: 85
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line Chart */}
        <div className="lg:col-span-2 p-8 rounded-[40px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
                Environmental Impact Projection
              </h3>
              <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">24-Hour Sovereign Baseline vs Simulated Impact</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}kg`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0E1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="simulated" stroke="#00E5FF" fillOpacity={1} fill="url(#colorSim)" strokeWidth={2} />
                <Area type="monotone" dataKey="baseline" stroke="#94a3b8" fillOpacity={1} fill="url(#colorBase)" strokeDasharray="5 5" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Breakdown Heatmap-style Bar Chart */}
        <div className="p-8 rounded-[40px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 space-y-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Node Intensity Breakdown
          </h3>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impactResults} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="node_name" 
                  type="category" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0A0E1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="co2_emissions" radius={[0, 4, 4, 0]}>
                  {impactResults.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.is_hotspot ? '#f43f5e' : '#00E5FF'} fillOpacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ML Insights & Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cause & Result */}
        <div className="p-8 rounded-[40px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
              <Terminal className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <h3 className="font-bold text-gray-200 uppercase tracking-widest text-sm">ML Environmental Insight</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest">Primary Cause</div>
              <p className="text-sm text-gray-300 font-medium">{insights.cause}</p>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Projected Result</div>
              <p className="text-sm text-gray-400 leading-relaxed italic">"{insights.result}"</p>
            </div>
          </div>
        </div>

        {/* Hotspot List */}
        <div className="p-8 rounded-[40px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Carbon Hotspots Detected
          </h3>
          
          <div className="space-y-4">
            {hotspots.length > 0 ? hotspots.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">{h.node_name}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Green Score: {h.green_score}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-rose-400">+{((1 - h.green_score/100) * 100).toFixed(0)}%</div>
                  <div className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Saturation Delta</div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-40">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">All nodes within sovereign safety margins</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Terminal = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);
