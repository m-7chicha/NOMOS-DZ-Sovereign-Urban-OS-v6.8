import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { calculateSystemicImpact } from "./src/utils/contagion.js";
import { globalSimulationEngine } from "./src/utils/SimulationEngine.js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.text({ type: "text/csv", limit: "50mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- SECTION: SOVEREIGN LOCAL STACK INGESTION ---
  app.post("/api/ingest-raw", async (req, res) => {
    try {
      const csvData = req.body;
      if (!csvData || typeof csvData !== "string") {
        return res.status(400).json({ error: "Invalid CSV data" });
      }

      const lines = csvData.split("\n").filter(line => line.trim() !== "");
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV must contain headers and at least one row" });
      }

      const headers = lines[0].split(";").map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(";").map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => {
          row[h] = values[i];
        });
        
        return {
          intersection_name: row.intersection_name,
          time_slot: row.time_slot,
          is_rain: (row.is_rain === "true" || row.is_rain === "1") ? 1 : 0,
          is_ramadan: (row.is_ramadan === "true" || row.is_ramadan === "1") ? 1 : 0,
          event_type: row.event_type || "None",
          traffic_level: row.traffic_level,
          saturation_index: parseFloat(row.saturation_index) || 0.1
        };
      });

      // Train the local model
      globalSimulationEngine.train(rows);

      res.json({ 
        status: "success", 
        message: "Model trained successfully", 
        samples: rows.length 
      });
    } catch (error) {
      console.error("Ingestion error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- SECTION: SIMULATION ENGINE ---
  app.post("/api/simulate", async (req, res) => {
    try {
      const { time, isRain, isRamadan, eventType } = req.body;
      
      if (!globalSimulationEngine.isTrained()) {
        return res.status(400).json({ error: "Model not trained. Please upload CSV first." });
      }

      const predictions = globalSimulationEngine.predict(time, isRain, isRamadan, eventType);
      res.json(predictions);
    } catch (error) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- SECTION: INTELLIGENCE HANDSHAKE CONTEXT ---
  app.get("/api/intelligence/context", async (req, res) => {
    try {
      // Use local simulation engine predictions if trained
      let simulationData = [];
      if (globalSimulationEngine.isTrained()) {
        const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        simulationData = globalSimulationEngine.predict(now, false, false, 'None');
      }

      const highTrafficNode = simulationData.find(p => p.predicted_traffic_level === "High");
      let contagionResult = null;

      if (highTrafficNode) {
        const currentSaturation = simulationData.reduce((acc, p) => ({ ...acc, [p.node_name]: p.predicted_saturation }), {});
        contagionResult = calculateSystemicImpact(
          highTrafficNode.node_name,
          "High",
          currentSaturation,
          false,
          new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        );
      }

      res.json({
        simulationData,
        highTrafficNode: highTrafficNode ? highTrafficNode.node_name : null,
        contagionResult
      });
    } catch (error) {
      console.error("Context error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
