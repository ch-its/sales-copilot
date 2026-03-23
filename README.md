# Sovereign Copilot 🎙️⚡

A high-performance, ultra-low latency AI companion for enterprise sales, built to process live audio, analyze context, and deliver real-time tactical coaching mid-conversation. 

## 🚀 The Architecture

Standard HTTP APIs are too slow for live voice interactions. Sovereign Copilot bypasses traditional REST constraints by utilizing a **Full-Duplex WebSocket** architecture connected to **Groq's LPU Inference Engine**, achieving sub-second round-trip latency for audio transcription, LLM reasoning, and database retrieval.

### Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Real-Time Pipeline:** Socket.io (WebSockets)
* **AI Inference:** Groq Cloud
  * **STT:** Whisper-Large-v3-Turbo (sub-150ms transcription)
  * **LLM:** Llama-3.3-70B (Reasoning, JSON-structured output)
  * **TTS:** Orpheus-v1-English (Emotion-tagged voice synthesis)
* **Database / RAG:** MongoDB Atlas

## 🧠 Core Features

1. **Sparring Mode (Ultra-Low Latency Voice Chat):** A high-fidelity simulator where reps pitch to dynamic, emotion-aware AI personas (e.g., an angry Gordon Ramsay). Achieves near-instantaneous conversational flow.
2. **Live Copilot (Real-Time RAG):** Listens to live customer objections, queries MongoDB Atlas for historically successful rebuttals ("Winning Vault"), and streams exactly 3 tactical options to the rep's UI via WebSockets.
3. **Manager Ride-Along:** A silent AI observer that acts as a manager, analyzing the call context and whispering high-level strategic pivots directly to the rep without interrupting the flow.

## 🛠️ Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ch-its/sovereign-copilot.git```
2. Install Backend Dependencies:
   ```bash
   cd sales-copilot-backend
   npm install```
3. Install Frontend Dependencies:
   ```bash
   cd sales-copilot-ui
   npm install```
4. Environment Variables (Create a .env file in the root directory of the project)
   # .env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   MONGO_URI=mongodb+srv://your_user:your_password@your-cluster.mongodb.net/?retryWrites=true&w=majority
5. Start the Backend
   ```bash
   cd sales-copilot-backend
   node server.js```
6. Start the Frontend
   ```bash
   cd sales-copilot-ui
   npm run dev```
   
   
