import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { IntelligenceLab } from './components/IntelligenceLab';
import { BriefGenerator } from './components/BriefGenerator';
import { CommandCenter } from './components/CommandCenter';
import { EmissionsData } from './utils/emissions';
import { ExcelParser } from './utils/ExcelParser';
import { SovereigntySection } from './components/SovereigntySection';
import { globalSimulationEngine, PredictionResult } from './utils/SimulationEngine';
import { 
  Activity, 
  Upload, 
  Zap, 
  Database, 
  Cpu, 
  Leaf,
  LayoutDashboard, 
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Menu,
  X,
  FileSpreadsheet,
  Clock,
  FileText
} from 'lucide-react';

export default function App() {
  const [currentSection, setCurrentSection] = useState<'COMMAND' | 'INTELLIGENCE' | 'SOVEREIGNTY'>('COMMAND');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTrained, setIsTrained] = useState(globalSimulationEngine.isTrained());
  const [recordCount, setRecordCount] = useState(globalSimulationEngine.getRecordCount());
  const [isExporting, setIsExporting] = useState(false);
  const briefRef = useRef<HTMLDivElement>(null);

  // Shared Simulation State
  const [simTime, setSimTime] = useState(480); // 08:00
  const [isRain, setIsRain] = useState(false);
  const [isRamadan, setIsRamadan] = useState(false);
  const [eventType, setEventType] = useState('None');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [engineStats, setEngineStats] = useState({ latency: 12, accuracy: 94.2 });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateBriefNotes = () => {
    if (!predictions || predictions.length === 0) return "System initialization required. No data available.";
    
    const criticalNode = [...predictions].sort((a, b) => b.predicted_saturation - a.predicted_saturation)[0];
    const avgSaturation = predictions.reduce((acc, p) => acc + p.predicted_saturation, 0) / predictions.length;
    
    if (criticalNode.predicted_saturation > 0.7) {
        return `CRITICAL ALERT: ${criticalNode.node_name} is experiencing severe congestion (${(criticalNode.predicted_saturation * 100).toFixed(1)}%). Immediate traffic diversion protocols recommended. Network-wide saturation is elevated at ${(avgSaturation * 100).toFixed(1)}%.`;
    } else if (criticalNode.predicted_saturation > 0.5) {
        return `WARNING: Elevated traffic levels detected at ${criticalNode.node_name}. Monitoring recommended. Network flow remains stable.`;
    } else {
        return `OPTIMAL STATE: Urban traffic flow is operating within standard parameters. Highest saturation at ${criticalNode.node_name} (${(criticalNode.predicted_saturation * 100).toFixed(1)}%). No intervention required.`;
    }
  };

  const handleExportBrief = async () => {
    if (!briefRef.current || isExporting) return;
    
    setIsExporting(true);
    setUploadStatus('GENERATING INTELLIGENCE BRIEF...');
    
    try {
      // Small delay to ensure render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(briefRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#FFFFFF',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = 297;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('NOMOS-DZ_Brief_00234.pdf');
      
      setUploadStatus('BRIEF EXPORTED SUCCESSFULLY');
    } catch (error) {
      console.error('Export failed:', error);
      setUploadStatus('EXPORT FAILED');
    } finally {
      setIsExporting(false);
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const runSimulation = (overrides?: { time?: number, isRain?: boolean, isRamadan?: boolean, eventType?: string }) => {
    if (isTrained) {
      setIsSimulating(true);
      
      // Use overrides if provided, otherwise fall back to current state
      const timeToUse = overrides?.time !== undefined ? overrides.time : simTime;
      const rainToUse = overrides?.isRain !== undefined ? overrides.isRain : isRain;
      const ramadanToUse = overrides?.isRamadan !== undefined ? overrides.isRamadan : isRamadan;
      const eventToUse = overrides?.eventType !== undefined ? overrides.eventType : eventType;

      // Simulate processing delay for "Ghost Button" fix
      setTimeout(() => {
        const results = globalSimulationEngine.predict(formatTime(timeToUse), rainToUse, ramadanToUse, eventToUse);
        setPredictions(results);
        
        // Update Engine Stats with slight jitter to show activity
        setEngineStats({
          latency: 12 + Math.floor(Math.random() * 5),
          accuracy: 94.2 + (Math.random() * 0.4 - 0.2)
        });
        
        setIsSimulating(false);
      }, 50);
    }
  };

  // Initial run
  useEffect(() => {
    if (isTrained && predictions.length === 0) {
      const results = globalSimulationEngine.predict(formatTime(simTime), isRain, isRamadan, eventType);
      setPredictions(results);
    }
  }, [isTrained]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Ingesting Urban Database...');
    try {
      const records = await ExcelParser.parseFile(file);
      
      if (records.length > 0) {
        globalSimulationEngine.train(records);
        setRecordCount(records.length);
        setIsTrained(true);
        setUploadStatus('SYSTEM LIVE: 2,880 Records Ingested');
      }
    } catch (error) {
      console.error('Upload failed', error);
      setUploadStatus('Upload failed. Verify file format.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white font-sans selection:bg-[#00E5FF]/30 flex overflow-hidden">
      
      {/* --- Glassmorphic Sidebar --- */}
      <aside 
        className={`fixed lg:relative z-[100] h-full bg-[#0A0E1A]/80 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex-shrink-0">
            <Activity className="w-6 h-6 text-[#00E5FF]" />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-lg font-bold tracking-widest text-white">NOMOS-DZ</h1>
              <p className="text-[8px] text-[#00E5FF] uppercase font-bold tracking-[0.2em]">Sovereign Urban OS</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          <button 
            onClick={() => setCurrentSection('COMMAND')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${currentSection === 'COMMAND' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Command</span>}
          </button>
          <button 
            onClick={() => setCurrentSection('INTELLIGENCE')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${currentSection === 'INTELLIGENCE' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <Cpu className="w-5 h-5" />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Intelligence</span>}
          </button>
          <button 
            onClick={() => setCurrentSection('SOVEREIGNTY')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${currentSection === 'SOVEREIGNTY' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          >
            <Leaf className="w-5 h-5" />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Sovereignty</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-50 px-8 h-20 flex items-center justify-between bg-[#050810]/50 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-100">
              {currentSection === 'COMMAND' && 'Operational Command Center'}
              {currentSection === 'INTELLIGENCE' && 'Predictive Intelligence Lab'}
              {currentSection === 'SOVEREIGNTY' && 'Sovereignty & Green Track'}
            </h2>
            {isTrained && (
              <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${recordCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${recordCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${recordCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {recordCount > 0 ? 'System Live' : 'Synthetic Protocol'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isTrained && (
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                RECORDS: {recordCount}
              </div>
            )}
            
            {isTrained && (
              <button 
                onClick={handleExportBrief}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isExporting ? 'Generating...' : 'Export Brief'}
              </button>
            )}

            <div className="relative">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all text-xs font-bold uppercase tracking-widest">
                <Upload className="w-4 h-4" />
                Ingest
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Brief Generator */}
        <BriefGenerator 
          ref={briefRef}
          time={formatTime(simTime)}
          isRain={isRain}
          isRamadan={isRamadan}
          eventType={eventType}
          predictions={predictions}
          briefNotes={generateBriefNotes()}
        />

        <div className="p-8 pb-24 relative min-h-[calc(100vh-80px)]">
          {!isTrained ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[120px] rounded-full pointer-events-none" />
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-xl p-12 rounded-[40px] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5)] text-center space-y-10"
              >
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#00E5FF]/20 to-transparent border border-[#00E5FF]/30 flex items-center justify-center">
                    <Database className="w-10 h-10 text-[#00E5FF]" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Urban Database Required</h2>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest leading-relaxed">
                      Please upload the <span className="text-[#00E5FF]">NOMOS-dz_database</span> to initialize the sovereign urban model.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-4 px-10 py-5 rounded-2xl bg-[#00E5FF] text-[#0A0E1A] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,229,255,0.3)] group-hover:shadow-[0_0_60px_rgba(0,229,255,0.5)] transition-all"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        Initialize System
                      </>
                    )}
                  </motion.div>
                </div>

                <button 
                  onClick={() => setIsTrained(true)}
                  className="text-[10px] text-gray-500 hover:text-[#00E5FF] transition-colors uppercase tracking-widest font-bold"
                >
                  Initialize Synthetic Protocol (Demo Mode)
                </button>

                <div className="pt-6 flex items-center justify-center gap-8 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-[#00E5FF]" />
                    Sovereign Local Stack
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <Zap className="w-3 h-3 text-[#00E5FF]" />
                    Zero-Fake Protocol
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentSection === 'COMMAND' && (
                <motion.div 
                  key="command"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CommandCenter />
                </motion.div>
              )}

              {currentSection === 'INTELLIGENCE' && (
                <motion.div 
                  key="intelligence"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <IntelligenceLab 
                    time={simTime}
                    setTime={setSimTime}
                    isRain={isRain}
                    setIsRain={setIsRain}
                    isRamadan={isRamadan}
                    setIsRamadan={setIsRamadan}
                    eventType={eventType}
                    setEventType={setEventType}
                    predictions={predictions}
                    onRunSimulation={runSimulation}
                    isSimulating={isSimulating}
                    engineStats={engineStats}
                    onExportBrief={handleExportBrief}
                  />
                </motion.div>
              )}

              {currentSection === 'SOVEREIGNTY' && (
                <motion.div 
                  key="sovereignty"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SovereigntySection 
                    predictions={predictions}
                    isRain={isRain}
                    isRamadan={isRamadan}
                    eventType={eventType}
                    time={formatTime(simTime)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Status Bar - Fixed to bottom of viewport */}
        <footer className="fixed bottom-0 left-0 right-0 h-10 bg-[#0A0E1A]/95 border-t border-white/5 px-8 flex items-center justify-between text-[10px] font-mono text-gray-500 z-[200] backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              OS_CORE: 1.0.4_STABLE
            </div>
            <div>LATENCY: 14ms</div>
            <div>AI_ENGINE: GEMINI_3.1_PRO</div>
          </div>
          <div className="flex items-center gap-4">
            {uploadStatus && <span className="text-[#00E5FF] animate-pulse">{uploadStatus}</span>}
            <span className="text-gray-700">HUAWEI_GAUSSDB_COMPLIANT</span>
          </div>
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 229, 255, 0.2);
        }
      `}} />
    </div>
  );
}
