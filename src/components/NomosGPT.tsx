
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Bot, Sparkles, Send, Loader2, Terminal, MessageSquare, Cpu, Database, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalSimulationEngine } from '../utils/SimulationEngine';
import { calculateEnvironmentalImpact } from '../utils/emissions';

interface NomosGPTProps {
  simulationState: {
    time: string;
    isRain: boolean;
    isRamadan: boolean;
    eventType: string;
    predictions: any[];
  };
  controls?: {
    setTime: (time: number) => void;
    setIsRain: (isRain: boolean) => void;
    setIsRamadan: (isRamadan: boolean) => void;
    setEventType: (eventType: string) => void;
    onRunSimulation?: (overrides?: { time?: number, isRain?: boolean, isRamadan?: boolean, eventType?: string }) => void;
    onExportBrief?: () => void;
  };
}

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export const NomosGPT: React.FC<NomosGPTProps> = ({ simulationState, controls }) => {
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleHandshake = () => {
    setMessages([{
      id: 'init',
      role: 'system',
      content: 'NOMOS-GPT PROTOCOL INITIALIZED. WAITING FOR INPUT...',
      timestamp: new Date()
    }]);
    setInputValue('');
  };

  // Initial Handshake on Mount
  useEffect(() => {
    if (messages.length === 0) {
      handleHandshake();
    }
  }, []);

  const executeCommand = (action: string, payload: any) => {
    if (!controls) return;

    switch (action) {
      case 'UPDATE_SIMULATION':
        if (payload.time) {
          const [hours, minutes] = payload.time.split(':').map(Number);
          controls.setTime(hours * 60 + minutes);
        }
        if (payload.isRain !== undefined) controls.setIsRain(payload.isRain);
        if (payload.isRamadan !== undefined) controls.setIsRamadan(payload.isRamadan);
        if (payload.eventType) controls.setEventType(payload.eventType);
        
        if (payload.run_now && controls.onRunSimulation) {
          const overrides: any = {};
          if (payload.time) {
             const [h, m] = payload.time.split(':').map(Number);
             overrides.time = h * 60 + m;
          }
          if (payload.isRain !== undefined) overrides.isRain = payload.isRain;
          if (payload.isRamadan !== undefined) overrides.isRamadan = payload.isRamadan;
          if (payload.eventType) overrides.eventType = payload.eventType;
          
          setTimeout(() => controls.onRunSimulation!(overrides), 100); 
        }
        return `Simulation parameters updated: ${JSON.stringify(payload)}`;

      case 'QUERY_DB':
        const data = globalSimulationEngine.getAllData();
        const query = payload.query.toLowerCase();
        // Simple keyword search for RAG
        const results = data.filter(r => 
          r.intersection_name.toLowerCase().includes(query) || 
          r.traffic_level.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to 5 records for context
        return results.length > 0 ? JSON.stringify(results) : "No matching records found in NOMOS-dz_database.";

      case 'GET_STATS':
        // Calculate Sovereignty Stats using real data
        const impacts = simulationState.predictions.map(p => calculateEnvironmentalImpact({
          node_name: p.node_name,
          saturation_index: p.predicted_saturation,
          traffic_level: p.predicted_traffic_level
        }));

        if (payload.node_name) {
            const nodeImpact = impacts.find(i => i.node_name.toLowerCase() === payload.node_name.toLowerCase());
            if (nodeImpact) {
                return JSON.stringify({
                    node: nodeImpact.node_name,
                    co2_emissions: nodeImpact.co2_emissions,
                    fuel_waste: nodeImpact.fuel_waste,
                    green_score: nodeImpact.green_score,
                    is_hotspot: nodeImpact.is_hotspot
                });
            }
            return `Node '${payload.node_name}' not found in current simulation.`;
        }

        const totalCO2 = impacts.reduce((acc, i) => acc + i.co2_emissions, 0);
        const totalFuel = impacts.reduce((acc, i) => acc + i.fuel_waste, 0);
        const avgGreenScore = impacts.reduce((acc, i) => acc + i.green_score, 0) / (impacts.length || 1);
        const hotspots = impacts.filter(i => i.is_hotspot).map(i => ({ node: i.node_name, green_score: i.green_score }));

        return JSON.stringify({
          sovereign_target: 85,
          current_green_score: avgGreenScore.toFixed(1),
          total_co2_emissions: totalCO2.toFixed(2),
          total_fuel_waste: totalFuel.toFixed(2),
          delta: (85 - avgGreenScore).toFixed(1),
          hotspots: hotspots,
          predictions: simulationState.predictions
        });

      case 'GENERATE_REPORT':
        if (controls.onExportBrief) {
          controls.onExportBrief();
        }
        
        const reportImpacts = simulationState.predictions.map(p => calculateEnvironmentalImpact({
          node_name: p.node_name,
          saturation_index: p.predicted_saturation,
          traffic_level: p.predicted_traffic_level
        }));
        
        const highestRiskNode = simulationState.predictions.reduce((prev, current) => 
            (prev.predicted_saturation > current.predicted_saturation) ? prev : current
        , simulationState.predictions[0]);
        
        const reportTotalCO2 = reportImpacts.reduce((acc, i) => acc + i.co2_emissions, 0);
        const reportTotalFuel = reportImpacts.reduce((acc, i) => acc + i.fuel_waste, 0);
        const reportAvgGreenScore = reportImpacts.reduce((acc, i) => acc + i.green_score, 0) / (reportImpacts.length || 1);
        
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        return `
NOMOS-DZ EXECUTIVE INTELLIGENCE SUMMARY | ${dateStr}
------------------------------------------------------------

INTELLIGENCE PATH:
> Scenario: ${simulationState.time} | Rain: ${simulationState.isRain ? 'YES' : 'NO'} | Event: ${simulationState.eventType}
> Critical Node: ${highestRiskNode ? highestRiskNode.node_name : 'N/A'} (${highestRiskNode ? (highestRiskNode.predicted_saturation * 100).toFixed(1) : '0.0'}% Saturation)
> Risk Assessment: ${highestRiskNode ? highestRiskNode.predicted_traffic_level.toUpperCase() : 'N/A'} - Immediate Intervention Required.

SOVEREIGNTY PATH:
> Total CO2 Emissions: ${reportTotalCO2.toFixed(2)} kg/hr
> Fuel Waste Estimator: ${reportTotalFuel.toFixed(2)} L/Day
> Final Green Score: ${reportAvgGreenScore.toFixed(1)} / 100

------------------------------------------------------------
OS_CORE: 1.0.4_STABLE | HUAWEI_GAUSSDB_COMPLIANT
        `.trim();

      default:
        return "Command not recognized.";
    }
  };

  const processLocalCommand = (input: string): string => {
    if (!controls) return "Local Control Interface unavailable.";
    
    const lowerInput = input.toLowerCase();
    let updates: string[] = [];
    let actionTaken = false;

    // Initialize with current state to ensure we have a baseline
    let newTimeMinutes = parseInt(simulationState.time.split(':')[0]) * 60 + parseInt(simulationState.time.split(':')[1]);
    let newIsRain = simulationState.isRain;
    let newIsRamadan = simulationState.isRamadan;
    let newEventType = simulationState.eventType;
    let shouldRun = false;

    // Time parsing
    const timeMatch = lowerInput.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/);
    if (timeMatch && (lowerInput.includes("at") || lowerInput.includes("time") || lowerInput.includes("set"))) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
        const period = timeMatch[4];
        
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            newTimeMinutes = hours * 60 + minutes;
            controls.setTime(newTimeMinutes);
            updates.push(`Time set to ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
            actionTaken = true;
        }
    }

    // Weather
    if (lowerInput.includes("rain")) {
        const isRainCmd = !lowerInput.includes("no rain") && !lowerInput.includes("stop") && !lowerInput.includes("clear");
        newIsRain = isRainCmd;
        controls.setIsRain(newIsRain);
        updates.push(`Weather set to ${newIsRain ? 'RAIN' : 'CLEAR'}`);
        actionTaken = true;
    }

    // Ramadan
    if (lowerInput.includes("ramadan")) {
        const isRamadanCmd = !lowerInput.includes("no ramadan") && !lowerInput.includes("end");
        newIsRamadan = isRamadanCmd;
        controls.setIsRamadan(newIsRamadan);
        updates.push(`Ramadan Mode ${newIsRamadan ? 'ENABLED' : 'DISABLED'}`);
        actionTaken = true;
    }

    // Events
    if (lowerInput.includes("event") || lowerInput.includes("match") || lowerInput.includes("protest")) {
        let eventTypeCmd = "";
        
        if (lowerInput.includes("match") || lowerInput.includes("sport")) eventTypeCmd = "Sports";
        else if (lowerInput.includes("protest")) eventTypeCmd = "Protest";
        else if (lowerInput.includes("maintenance")) eventTypeCmd = "Maintenance";
        else if (lowerInput.includes("national")) eventTypeCmd = "National Day";
        else if (lowerInput.includes("none") || lowerInput.includes("clear event")) eventTypeCmd = "None";
        
        if (eventTypeCmd) {
             newEventType = eventTypeCmd;
             controls.setEventType(newEventType);
             updates.push(`Event set to ${newEventType}`);
             actionTaken = true;
        }
    }

    // Run Simulation
    if (lowerInput.includes("run") || lowerInput.includes("simulate") || lowerInput.includes("start") || lowerInput.includes("go")) {
        shouldRun = true;
        updates.push("SIMULATION SEQUENCE INITIATED");
        actionTaken = true;
    }

    if (shouldRun && controls.onRunSimulation) {
        // Direct execution with NEW values to fix "Ghost" execution
        controls.onRunSimulation({
            time: newTimeMinutes,
            isRain: newIsRain,
            isRamadan: newIsRamadan,
            eventType: newEventType
        });
    }

    if (!actionTaken) {
        return "LOCAL SYSTEM: Command not recognized. Try 'Set time to 8am', 'Toggle Rain', or 'Run Simulation'.";
    }
    
    return `LOCAL OVERRIDE EXECUTED:\n> ${updates.join('\n> ')}`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isHandshaking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsHandshaking(true);

    try {
      const apiKey = "AIzaSyAKZxEUuL2h3SabswVb8DRQU6ccqpgO1LQ";
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

      const ai = new GoogleGenAI({ apiKey });
      
      // Construct Context-Aware Prompt
      const systemContext = `
        You are Nomos-GPT, the Sovereign Intelligence Engine for Algiers (NOMOS-DZ OS).
        
        Current System State:
        - Time: ${simulationState.time}
        - Rain: ${simulationState.isRain}
        - Ramadan: ${simulationState.isRamadan}
        - Event: ${simulationState.eventType}
        - Risk Matrix: ${JSON.stringify(simulationState.predictions.map(p => ({ node: p.node_name, saturation: p.predicted_saturation, level: p.predicted_traffic_level })))}
        
        COMMAND PROTOCOLS:
        1. "Set time to [HH:MM]" -> Update Temporal Coordinate.
        2. "Start/Stop Rain" -> Toggle Rain Protocol.
        3. "Analyze [Node] [Metric]" -> Analyze specific node data (CO2, Fuel).
        4. "Identify highest carbon hotspot" -> Find node with >70% saturation.
        5. "Simulate National Day at 18:00" -> Update Event and Time.
        6. "Generate Executive Brief" / "Export Report" -> Generate A4 summary.

        You have access to the following TOOLS. You MUST output a JSON object with "thought", "action", and "payload".
        
        TOOLS:
        1. UPDATE_SIMULATION: { time: "HH:MM", isRain: boolean, isRamadan: boolean, eventType: string, run_now: boolean }
        2. QUERY_DB: { query: string } (Search historical records)
        3. GET_STATS: { node_name?: string } (Get sovereignty metrics. If node_name provided, analyze specific node.)
        4. GENERATE_REPORT: {} (Generate the Executive Intelligence Summary)
        5. ANSWER: { text: string, reasoning_matrix: string } (Final response with technical justification)

        Example User: "Simulate heavy rain at 8am"
        Example Output: { "thought": "User wants to simulate rain...", "action": "UPDATE_SIMULATION", "payload": { "time": "08:00", "isRain": true, "run_now": true } }
        
        Example User: "Analyze Bab Ezzouar CO2"
        Example Output: { "thought": "User wants specific node stats...", "action": "GET_STATS", "payload": { "node_name": "Bab Ezzouar" } }

        Example User: "Export Report"
        Example Output: { "thought": "User wants executive brief...", "action": "GENERATE_REPORT", "payload": {} }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `System Context: ${systemContext}\nUser Input: ${inputValue}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thought: { type: Type.STRING },
              action: { type: Type.STRING, enum: ["UPDATE_SIMULATION", "QUERY_DB", "GET_STATS", "GENERATE_REPORT", "ANSWER"] },
              payload: { type: Type.OBJECT }
            }
          }
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json\n?|\n?```/g, "").trim();
      
      const result = JSON.parse(responseText);
      
      // Execute Tool if needed
      let finalResponseText = "";
      
      if (result.action === 'ANSWER') {
        finalResponseText = result.payload.text || result.thought;
        if (result.payload.reasoning_matrix) {
            finalResponseText += `\n\n[REASONING MATRIX]: ${result.payload.reasoning_matrix}`;
        }
      } else {
        const toolResult = executeCommand(result.action, result.payload);
        
        // Second pass to generate natural language response based on tool result
        const followUp = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `
            Original Request: ${inputValue}
            Tool Action: ${result.action}
            Tool Result: ${toolResult}
            
            Generate a concise, high-level response for the user. Maintain the "Sovereign" aesthetic.
            
            IF the action was GENERATE_REPORT, simply output the tool result directly as it is already formatted.
            
            OTHERWISE, include a "Reasoning Matrix" section explaining the technical justification for the current state/prediction if applicable.
          `
        });
        finalResponseText = followUp.text || "Command executed successfully.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: finalResponseText,
        timestamp: new Date()
      }]);

    } catch (error: any) {
      // Check for 429 Resource Exhausted or other quota errors
      const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('quota') ||
        error?.status === 'RESOURCE_EXHAUSTED';

      if (isQuotaError) {
        console.warn("Nomos-GPT: API Quota Exceeded. Switching to local fallback.");
      } else {
        console.error("Nomos-GPT Error:", error);
      }
      
      // Fallback to local processing
      const localResponse = processLocalCommand(inputValue);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `⚠️ NEURAL LINK SEVERED (${isQuotaError ? 'QUOTA LIMIT' : 'CONNECTION ERROR'}). ENGAGING LOCAL OVERRIDE.\n\n${localResponse}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsHandshaking(false);
    }
  };

  const maxSaturation = React.useMemo(() => {
    if (!simulationState.predictions.length) return 0;
    return Math.max(...simulationState.predictions.map(p => p.predicted_saturation));
  }, [simulationState.predictions]);

  const riskLevel = maxSaturation > 0.7 ? 'CRITICAL' : maxSaturation > 0.3 ? 'ELEVATED' : 'NOMINAL';
  const riskColor = maxSaturation > 0.7 ? 'text-rose-400' : maxSaturation > 0.3 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="flex flex-col h-full min-h-[600px] p-1 rounded-[32px] bg-[#0A0E1A]/60 backdrop-blur-xl border border-white/5 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0A0E1A]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
            <Terminal className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-200">Nomos-GPT Engine</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Sovereign Intelligence</p>
          </div>
        </div>
        <button 
          onClick={handleHandshake}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-400 uppercase tracking-widest transition-all"
        >
          Reset Context
        </button>
      </div>

      {/* Live Risk Monitor */}
      <div className="absolute top-24 right-6 z-0 opacity-20 pointer-events-none">
        <div className="text-right">
          <div className={`text-4xl font-black ${riskColor}`}>{riskLevel}</div>
          <div className="text-xs text-gray-500 uppercase tracking-[0.2em]">System Status</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl border ${
              msg.role === 'user' 
                ? 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-gray-200 rounded-tr-none' 
                : msg.role === 'system'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-mono text-xs'
                : 'bg-white/5 border-white/10 text-gray-300 rounded-tl-none'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-2 text-[#00E5FF] text-[10px] font-bold uppercase tracking-widest">
                  <Bot className="w-3 h-3" />
                  Nomos-GPT
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className="mt-2 text-[10px] text-gray-600 font-mono text-right opacity-50">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
        {isHandshaking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin" />
              <span className="text-xs text-gray-500 font-mono animate-pulse">Processing Neural Handshake...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#0A0E1A]/80 backdrop-blur-md">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Enter command or query (e.g., 'Simulate rain at 08:00')..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00E5FF]/50 transition-all font-mono"
            disabled={isHandshaking}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isHandshaking}
            className="p-3 rounded-xl bg-[#00E5FF] text-[#0A0E1A] hover:bg-[#00E5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex justify-between items-center px-1">
          <span className="text-[8px] text-gray-600 uppercase tracking-widest">AI_ENGINE: GEMINI_3.1_PRO</span>
          <span className="text-[8px] text-gray-600 uppercase tracking-widest">SECURE CONNECTION</span>
        </div>
      </div>
    </div>
  );
};
