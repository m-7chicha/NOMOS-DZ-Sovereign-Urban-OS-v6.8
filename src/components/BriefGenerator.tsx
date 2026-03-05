import React, { forwardRef } from 'react';
import { PredictionResult } from '../utils/SimulationEngine';
import { calculateEnvironmentalImpact } from '../utils/emissions';
import { Activity, AlertTriangle } from 'lucide-react';

interface BriefGeneratorProps {
  time: string;
  isRain: boolean;
  isRamadan: boolean;
  eventType: string;
  predictions: PredictionResult[];
  briefNotes?: string;
}

export const BriefGenerator = forwardRef<HTMLDivElement, BriefGeneratorProps>(({
  time,
  isRain,
  isRamadan,
  eventType,
  predictions,
  briefNotes
}, ref) => {

  // Execution Constraint: Zero Static Data
  if (!predictions || predictions.length === 0) {
     return (
        <div className="fixed left-[-9999px] top-0">
            <div ref={ref} className="w-[210mm] h-[297mm] bg-white flex items-center justify-center p-12 border-8 border-[#EF4444]">
                <div className="text-center space-y-6">
                    <AlertTriangle className="w-24 h-24 text-[#DC2626] mx-auto" />
                    <h1 className="text-4xl font-black text-[#DC2626] uppercase tracking-tighter">Neural Link Interruption</h1>
                    <p className="text-xl text-[#1F2937] font-mono uppercase tracking-widest">Unable to fetch live simulation data.</p>
                    <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] font-mono text-sm">
                        ERROR_CODE: 0x5F_NO_DATA_STREAM
                    </div>
                </div>
            </div>
        </div>
     );
  }

  // Calculate Metrics
  const impacts = predictions.map(p => calculateEnvironmentalImpact({
    node_name: p.node_name,
    saturation_index: p.predicted_saturation,
    traffic_level: p.predicted_traffic_level
  }));

  const totalCO2 = impacts.reduce((acc, i) => acc + i.co2_emissions, 0);
  const totalFuel = impacts.reduce((acc, i) => acc + i.fuel_waste, 0);
  const avgGreenScore = impacts.reduce((acc, i) => acc + i.green_score, 0) / (impacts.length || 1);

  const sortedPredictions = [...predictions].sort((a, b) => b.predicted_saturation - a.predicted_saturation);

  return (
    <div className="fixed left-[-9999px] top-0">
      <div
        ref={ref}
        className="w-[210mm] h-[297mm] bg-white text-[#333333] font-sans p-12 flex flex-col relative"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#333333] pb-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#333333] text-white">
                    <Activity className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#333333]">NOMOS-DZ</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#00BCD4]">Sovereign Urban OS</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#333333] mb-2">Executive Intelligence Brief</h2>
                <div className="text-sm font-mono text-[#555555]">
                    <div className="font-bold">BRIEF NO.: #00234</div>
                    <div>DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} | {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        </div>

        {/* Admin Info Block */}
        <div className="grid grid-cols-2 gap-8 mb-10 border-b border-[#E5E5E5] pb-8">
            <div>
                <div className="text-[10px] text-[#888888] uppercase font-bold tracking-widest mb-1">Operator</div>
                <div className="text-sm font-bold text-[#333333] uppercase">Mouadh | Sovereign Admin</div>
            </div>
            <div>
                <div className="text-[10px] text-[#888888] uppercase font-bold tracking-widest mb-1">System Status</div>
                <div className="text-sm font-bold text-[#00BCD4] uppercase">Operational</div>
            </div>
        </div>

        {/* Intelligence Table */}
        <div className="mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#333333] mb-4 border-l-4 border-[#00BCD4] pl-3">Intelligence Matrix</h3>
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-[#F5F5F5] text-[#555555] font-bold uppercase text-xs tracking-wider">
                        <th className="p-3 border-b border-[#E5E5E5]">Node / Metric</th>
                        <th className="p-3 border-b border-[#E5E5E5]">Current Value</th>
                        <th className="p-3 border-b border-[#E5E5E5]">Baseline / Target</th>
                        <th className="p-3 border-b border-[#E5E5E5]">Risk Level</th>
                    </tr>
                </thead>
                <tbody className="font-mono text-[#333333]">
                    {/* Simulation Parameters */}
                    <tr className="border-b border-[#E5E5E5]">
                        <td className="p-3 font-bold">Simulation State</td>
                        <td className="p-3">{time} | {isRain ? 'Rain' : 'Clear'} | {eventType}</td>
                        <td className="p-3 text-[#888888]">Standard / Clear</td>
                        <td className="p-3 text-[#00BCD4]">LOW</td>
                    </tr>

                    {/* Predictive Risk Matrix (Top 3 Nodes) */}
                    {sortedPredictions.slice(0, 3).map(pred => (
                        <tr key={pred.node_name} className="border-b border-[#E5E5E5]">
                            <td className="p-3 font-bold">{pred.node_name}</td>
                            <td className="p-3">{(pred.predicted_saturation * 100).toFixed(1)}%</td>
                            <td className="p-3 text-[#888888]">&lt; 70.0%</td>
                            <td className={`p-3 font-bold ${pred.predicted_saturation > 0.7 ? 'text-[#DC2626]' : 'text-[#00BCD4]'}`}>
                                {pred.predicted_saturation > 0.7 ? 'CRITICAL' : 'STABLE'}
                            </td>
                        </tr>
                    ))}

                    {/* Sovereignty Metrics */}
                    <tr className="border-b border-[#E5E5E5]">
                        <td className="p-3 font-bold">Green Score</td>
                        <td className="p-3">{avgGreenScore.toFixed(1)} / 100</td>
                        <td className="p-3 text-[#888888]">&gt; 50.0</td>
                        <td className={`p-3 font-bold ${avgGreenScore < 40 ? 'text-[#D97706]' : 'text-[#00BCD4]'}`}>
                            {avgGreenScore < 40 ? 'MODERATE' : 'OPTIMAL'}
                        </td>
                    </tr>
                     <tr className="border-b border-[#E5E5E5]">
                        <td className="p-3 font-bold">Total CO2 Emissions</td>
                        <td className="p-3">{totalCO2.toFixed(1)} kg/hr</td>
                        <td className="p-3 text-[#888888]">&lt; 1500.0</td>
                        <td className="p-3 text-[#00BCD4]">MONITORED</td>
                    </tr>
                     <tr className="border-b border-[#E5E5E5]">
                        <td className="p-3 font-bold">Fuel Waste</td>
                        <td className="p-3">{totalFuel.toFixed(0)} L/Day</td>
                        <td className="p-3 text-[#888888]">&lt; 5000</td>
                        <td className="p-3 text-[#00BCD4]">MONITORED</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Authorization Section */}
        <div className="mt-auto">
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#333333] mb-2">Brief Notes</h3>
                <div className="p-4 bg-[#F9FAFB] border border-[#E5E5E5] text-sm text-[#555555] leading-relaxed italic">
                    "{briefNotes || 'System analysis indicates stable urban flow. No critical anomalies detected.'}"
                </div>
            </div>

            <div className="flex justify-between items-end border-t-2 border-[#333333] pt-6">
                <div className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">
                    <div>OS_CORE: 1.0.4_STABLE</div>
                    <div>HUAWEI_GAUSSDB_COMPLIANT</div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-center">
                        {/* Signature Mockup */}
                        <div className="font-serif text-2xl text-[#333333] italic mb-1" style={{ fontFamily: 'cursive' }}>Mr. Bouquenara</div>
                        <div className="w-32 h-px bg-[#333333] mb-1"></div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#888888]">Authorized Signature</div>
                    </div>
                    
                    {/* Stamp Mockup */}
                    <div className="w-20 h-20 rounded-full border-2 border-[#00BCD4] flex items-center justify-center relative opacity-80" style={{ transform: 'rotate(-15deg)' }}>
                        <div className="absolute inset-1 border border-[#00BCD4] rounded-full"></div>
                        <div className="text-center">
                            <div className="text-[8px] font-bold text-[#00BCD4] uppercase tracking-widest">NOMOS-DZ</div>
                            <div className="text-[6px] font-bold text-[#00BCD4] uppercase">OFFICIAL</div>
                            <div className="text-[10px] font-black text-[#00BCD4] uppercase tracking-widest mt-1">TIMBRE</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
});

BriefGenerator.displayName = 'BriefGenerator';
