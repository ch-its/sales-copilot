import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Zap, UserCircle, RefreshCcw } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:3000', { transports: ['websocket', 'polling'] });

export default function LiveCopilot() {
  const [chatHistory, setChatHistory] = useState([]);
  const [julesOptions, setJulesOptions] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [customPersona, setCustomPersona] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const mediaRecorderRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('new_transcript', (data) => {
      setChatHistory(prev => [...prev, { role: 'customer', text: data.text }]);
      socket.emit('jules_analyze_transcript', { text: data.text, persona: customPersona, context: customContext });
    });
    socket.on('jules_options', (options) => setJulesOptions(options));
    return () => { socket.off('new_transcript'); socket.off('jules_options'); };
  }, [customPersona, customContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, julesOptions]);

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        const reader = new FileReader();
        reader.readAsDataURL(e.data);
        reader.onloadend = () => socket.emit('audio_chunk', { blob: reader.result.split(',')[1] });
      }
    };
    setIsStreaming(true);
  };

  const handleGenerateScript = async () => {
    const res = await fetch('http://127.0.0.1:3000/api/generate-hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: customPersona, context: customContext, repName: "Chaitanya", repOrg: "Mahajan Inc.", repTitle: "Sales Representative" })
    });
    const data = await res.json();
    setChatHistory([{ role: 'rep', text: data.script }]);
    setHasGenerated(true);
  };

  const handleOptionClick = (text) => {
    setChatHistory(prev => [...prev, { role: 'rep', text }]);
    setJulesOptions(null);
  };

  const saveWinToVault = async () => {
    try {
      await fetch('http://127.0.0.1:3000/api/save-win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory, persona: customPersona, context: customContext })
      });
      alert("🏆 Session Saved to Winning Vault!");
    } catch (err) { console.error("Vault Error:", err); }
  };

  // ✨ NEW: Clickable Toggle Logic
  const toggleRecording = () => {
    if (!isStreaming) return;
    if (!isRecording) {
      if (mediaRecorderRef.current?.state === 'inactive') mediaRecorderRef.current.start();
      setIsRecording(true);
    } else {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-8 bg-dark-900 text-white font-sans overflow-hidden">
      <div className="flex justify-between items-center mb-6 mt-4">
        <h1 className="text-4xl font-bold tracking-tighter text-neon-blue uppercase italic drop-shadow-glow-blue">Sales Co-Pilot</h1>

        {/* ✨ NEW: Clickable Button */}
        <button
          onClick={toggleRecording}
          disabled={!isStreaming}
          className={`px-6 py-3 rounded-full border-2 transition-all ${!isStreaming ? 'bg-dark-800 border-dark-600 opacity-50 cursor-not-allowed' : isRecording ? 'bg-neon-red/20 border-neon-red shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'bg-dark-800 border-neon-blue hover:bg-neon-blue/20'}`}
        >
          <span className={`text-xs font-black uppercase tracking-widest ${isRecording ? 'text-neon-red animate-pulse' : 'text-neon-blue'}`}>
            {isRecording ? '🔴 Recording Customer...' : '⏺️ Record Customer'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 mb-6 overflow-hidden">
        <div className="col-span-4 bg-dark-800 rounded-2xl p-6 border border-dark-600 shadow-lg flex flex-col min-h-0">
          {!hasGenerated ? (
            <div className="flex flex-col gap-4 h-full">
              <p className="text-[10px] font-black text-neon-blue uppercase tracking-widest">Customer Information</p>
              <input value={customPersona} onChange={(e) => setCustomPersona(e.target.value)} className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm focus:border-neon-blue outline-none" placeholder="e.g. CTO of a Fortune 500 Bank" />
              <p className="text-[10px] font-black text-neon-blue uppercase tracking-widest">Sales Context</p>
              <textarea value={customContext} onChange={(e) => setCustomContext(e.target.value)} className="flex-1 bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm focus:border-neon-blue outline-none resize-none" placeholder="e.g. Concerned about security, $50k budget." />
              <button onClick={handleGenerateScript} className="w-full bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-white hover:text-black py-4 rounded-xl font-black uppercase text-xs">Generate Hooks</button>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-600">
                  <p className="text-[10px] text-neon-green font-black mb-2 uppercase tracking-widest">Customer Profile</p>
                  <p className="text-sm text-white font-bold">{customPersona}</p>
                </div>
                <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-600">
                  <p className="text-[10px] text-neon-blue font-black mb-2 uppercase tracking-widest">Sales Context</p>
                  <p className="text-sm text-gray-300 italic break-words whitespace-pre-wrap">{customContext}</p>
                </div>
              </div>
              <button onClick={saveWinToVault} className="w-full py-4 bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all mt-4 flex-shrink-0">
                Archive as "Winning Call"
              </button>
            </div>
          )}
        </div>

        <div className="col-span-8 rounded-2xl border border-dark-600 bg-dark-800/50 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-dark-600 bg-dark-800/80"><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Co-Pilot Stream</p></div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'rep' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'rep' ? 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue' : 'bg-neon-green/10 border border-neon-green/30 text-neon-green'}`}>
                  <p className="text-[9px] font-black mb-1 opacity-50 uppercase tracking-widest">{msg.role === 'rep' ? 'You' : 'Customer'}</p>
                  "{msg.text}"
                </div>
              </div>
            ))}

            {julesOptions && (
              <div className="flex flex-col gap-3 mt-6 animate-in slide-in-from-bottom-4">
                <p className="text-[10px] font-black text-neon-blue uppercase tracking-widest text-center">Select Tactical Response</p>
                {julesOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt.text)}
                    className="w-full text-left p-4 bg-dark-900 border border-neon-blue/40 rounded-xl hover:bg-neon-blue/20 hover:border-neon-blue transition-all group"
                  >
                    <div className="text-[9px] font-black text-neon-blue mb-1 uppercase group-hover:text-white transition-colors">{opt.type}</div>
                    <p className="text-sm text-gray-200">{opt.text}</p>
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>
      <button onClick={isStreaming ? () => setIsStreaming(false) : startStreaming} disabled={!hasGenerated} className={`w-full py-6 rounded-2xl flex items-center justify-center gap-4 border-2 ${isStreaming ? 'bg-neon-red/10 border-neon-red text-neon-red' : 'bg-neon-blue/10 border-neon-blue text-neon-blue hover:bg-white hover:text-black'}`}>
        <p className="text-xl font-black uppercase tracking-widest">{isStreaming ? 'End Session' : 'Start Session'}</p>
      </button>
    </div>
  );
}