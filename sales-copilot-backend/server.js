const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const Groq = require('groq-sdk');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ✨ FIXED: Re-added the API Key declaration to prevent "ReferenceError"

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ['websocket', 'polling']
});

const mongoClient = new MongoClient(MONGO_URI);
const groq = new Groq({ apiKey: GROQ_API_KEY });

// ✨ UPDATED: Enhanced Voice Mapping Logic
const getBestVoice = (persona) => {
  const p = persona.toLowerCase();

  // 1. Priority check for Female Personas to avoid "CTO" male default
  if (p.includes("sarah") || p.includes("woman") || p.includes("female") || p.includes("she") || p.includes("her")) {
    // Hannah is the most polished professional female voice available
    return {
      id: "hannah",
      // Trigger specific emotion if audit stress is detected
      direction: p.includes("audit") || p.includes("stressed") ? "[anxiously]" : "[authoritatively]"
    };
  }

  // 2. Aggressive/Chef logic (Gordon Ramsay)
  if (p.includes("angry") || p.includes("furious") || p.includes("ramsay") || p.includes("chef") || p.includes("gordon")) {
    return { id: "troy", direction: "[furious]" };
  }

  // 3. Professional Male logic
  if (p.includes("executive") || p.includes("boss") || p.includes("ceo") || p.includes("man") || p.includes("cto")) {
    return { id: "daniel", direction: "[professional]" };
  }

  // Default fallback
  return { id: "austin", direction: "" };
};

// --- API: Generate Opening Hook ---
app.post('/api/generate-hook', async (req, res) => {
  const { persona, context, repName, repOrg, repTitle } = req.body;
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are ${repName}, a ${repTitle} at ${repOrg}. Write a highly realistic, conversational opening hook for a cold call.
          STRICT RULES:
          - Maximum 35 words total.
          - Use this exact structure: "Hi [Target Name], this is ${repName} with ${repOrg}. I'm calling because [1 short, punchy reason based on context]."`
        },
        { role: "user", content: `Target: ${persona}, Context: ${context}` }
      ],
      model: "llama-3.3-70b-versatile",
    });
    res.json({ script: chatCompletion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ error: "Hook generation failed" });
  }
});

// --- API: Save Successful Conversation ---
app.post('/api/save-win', async (req, res) => {
  const { chatHistory, persona, context } = req.body;
  try {
    const db = mongoClient.db('SalesCopilotDB');
    const collection = db.collection('SuccessfulConversations');
    await collection.insertOne({
      timestamp: new Date(),
      persona,
      context,
      transcript: chatHistory,
      outcome: "SUCCESS"
    });
    console.log("🏆 New Win Saved to the Vault!");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save win" });
  }
});

// --- Server Logic ---
async function startServer() {
  try {
    await mongoClient.connect();
    console.log("🟢 MongoDB Connected");

    io.on('connection', (socket) => {
      console.log(`🔌 Client Connected: ${socket.id}`);

      // MODE 1: SALES COPILOT
      socket.on('audio_chunk', async (data) => {
        const tempFile = path.join(__dirname, `temp_${socket.id}.webm`);
        try {
          const buffer = Buffer.from(data.blob, 'base64');
          if (buffer.length < 1000) return;
          fs.writeFileSync(tempFile, buffer);
          const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en",
          });
          if (transcription.text && transcription.text.trim().length > 2) {
            socket.emit('new_transcript', { text: transcription.text.trim() });
          }
        } catch (err) { console.error("❌ Whisper Error:", err.message); }
        finally { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); }
      });

      socket.on('jules_analyze_transcript', async (data) => {
        const { text, persona, context } = data;
        try {
          const db = mongoClient.db('SalesCopilotDB');
          const collection = db.collection('SuccessfulConversations');

          // ✨ 1. Initialize with a fallback string so it's NEVER undefined
          let dbContext = "No prior winning patterns found.";

          try {
            const pastWins = await collection.find({}).sort({ _id: -1 }).limit(2).toArray();
            if (pastWins.length > 0) {
              dbContext = pastWins.map(w => JSON.stringify(w)).join(" | ");
            }
          } catch (dbErr) {
            console.error("⚠️ Database RAG fetch failed, using default context.");
          }

          // ✨ 2. Now use it safely in the prompt (and mention JSON)
          const chatCompletion = await groq.chat.completions.create({
            messages: [{
              role: "system",
              content: `You are an elite enterprise sales copilot for Chaitanya (Account Executive at LG). 
                PERSONA: ${persona} | CONTEXT: ${context} | DB RAG: ${dbContext}
                The customer just said: "${text}"
                
                STRICT RULES:
                - Return exactly 3 tactical options in a valid JSON format.
                - Each option 'text' MUST be under 12 words.
                - Use the DB RAG to suggest proven winning rebuttals if relevant.`
            }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
          });

          const response = JSON.parse(chatCompletion.choices[0].message.content);
          socket.emit('jules_options', response.options);
        } catch (e) {
          console.error("❌ Analysis Error:", e.message);
        }
      });

      // MODE 2: MANAGER RIDE-ALONG
      socket.on('audio_chunk_dual', async (data) => {
        const tempFile = path.join(__dirname, `temp_dual_${socket.id}.webm`);
        try {
          const buffer = Buffer.from(data.blob, 'base64');
          if (buffer.length < 1000) return;
          fs.writeFileSync(tempFile, buffer);
          const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en",
          });
          if (transcription.text && transcription.text.trim().length > 2) {
            socket.emit('new_transcript_dual', { text: transcription.text.trim(), role: data.role });
          }
        } catch (err) { console.error("❌ Whisper Error (Dual):", err.message); }
        finally { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); }
      });

      socket.on('analyze_dual_context', async (data) => {
        const { chatHistory, persona, context } = data;
        try {
          const db = mongoClient.db('SalesCopilotDB');
          const collection = db.collection('SuccessfulConversations');
          let dbContext = "";
          const pastWins = await collection.find({}).sort({ _id: -1 }).limit(2).toArray();
          dbContext = pastWins.map(w => JSON.stringify(w)).join(" | ");
          const formattedHistory = chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n');
          const lastSpeaker = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].role : 'unknown';
          let instruction = lastSpeaker === 'customer' ? "Provide EXACTLY 1 strategic direction." : "Provide EXACTLY 1 piece of strategic coaching.";
          const systemPrompt = `You are a sales manager. PERSONA: ${persona} | CONTEXT: ${context} | HISTORY: ${formattedHistory} | INSTRUCTIONS: ${instruction} | RULES: Single sentence, under 20 words. Return JSON: {"options": [{"type": "MANAGER INSIGHT", "text": "feedback"}]}`;
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
          });
          socket.emit('jules_options', JSON.parse(chatCompletion.choices[0].message.content).options);
        } catch (e) { console.error("Dual Analysis Error:", e.message); }
      });

      // MODE 3: SPARRING MODE (Dynamic Voice Selection)
      socket.on('simulator_turn', async (data) => {
        const { blob, chatHistory, persona } = data;
        const tempFile = path.join(__dirname, `temp_sim_${socket.id}.webm`);
        try {
          const buffer = Buffer.from(blob, 'base64');
          if (buffer.length < 1000) return;
          fs.writeFileSync(tempFile, buffer);
          const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFile),
            model: "whisper-large-v3-turbo",
            response_format: "json",
            language: "en",
          });
          const repText = transcription.text.trim();
          if (repText.length < 2) return;
          socket.emit('simulator_transcript', { text: repText });
          const formattedHistory = chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n');
          const systemPrompt = `You are a ruthless prospect. PERSONA: ${persona} | HISTORY: ${formattedHistory} | REP SAID: "${repText}" | RULES: Respond in character, 1-2 short sentences.`;
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "llama-3.3-70b-versatile",
          });
          const aiResponse = chatCompletion.choices[0].message.content.trim();

          // ✨ NEW: Dynamic Voice and Emotional Direction
          const voiceConfig = getBestVoice(persona);
          let audioBase64 = null;
          try {
            const ttsResponse = await groq.audio.speech.create({
              model: "canopylabs/orpheus-v1-english", //
              voice: voiceConfig.id,
              input: `${voiceConfig.direction} ${aiResponse}`, // Dynamic vocal direction
              response_format: "wav"
            });
            const arrayBuffer = await ttsResponse.arrayBuffer();
            audioBase64 = Buffer.from(arrayBuffer).toString('base64');
          } catch (ttsErr) { console.error("❌ TTS Error:", ttsErr.message); }

          socket.emit('simulator_response', { repText, aiText: aiResponse, audioBase64 });
        } catch (err) { console.error("❌ Simulator Error:", err.message); }
        finally { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); }
      });

      socket.on('disconnect', () => { console.log(`❌ Client Disconnected: ${socket.id}`); });
    });

    server.listen(3000, '0.0.0.0', () => { console.log(`🚀 Sovereign Copilot ready on port 3000`); });
  } catch (err) { console.error("💥 Server Startup Failed:", err); }
}
startServer();