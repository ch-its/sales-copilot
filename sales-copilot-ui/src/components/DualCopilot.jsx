import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Zap, Cpu } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:3000', { transports: ['websocket', 'polling'] });

export default function DualCopilot() {
    const [chatHistory, setChatHistory] = useState([]);
    const [julesOptions, setJulesOptions] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [listeningTo, setListeningTo] = useState(null);
    const audioRoleRef = useRef(null);
    const [customPersona, setCustomPersona] = useState("");
    const [customContext, setCustomContext] = useState("");
    const [hasGenerated, setHasGenerated] = useState(false);

    const mediaRecorderRef = useRef(null);
    const chatHistoryRef = useRef([]);
    const messagesEndRef = useRef(null);
    // ✨ NEW: Anchor reference for the left Insights panel
    const insightsEndRef = useRef(null);

    useEffect(() => {
        socket.on('new_transcript_dual', (data) => {
            chatHistoryRef.current.push({ role: data.role, text: data.text });
            setChatHistory([...chatHistoryRef.current]);
            socket.emit('analyze_dual_context', { chatHistory: chatHistoryRef.current, persona: customPersona, context: customContext });
        });
        socket.on('jules_options', (options) => setJulesOptions(options));
        return () => { socket.off('new_transcript_dual'); socket.off('jules_options'); };
    }, [customPersona, customContext]);

    // ✨ FIXED: Now automatically scrolls BOTH the chat and the insights panel
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        insightsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, julesOptions]);

    const startStreaming = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = async (event) => {
            const roleToSend = audioRoleRef.current;
            if (event.data.size > 0 && socket.connected && roleToSend) {
                const reader = new FileReader();
                reader.readAsDataURL(event.data);
                reader.onloadend = () => socket.emit('audio_chunk_dual', { blob: reader.result.split(',')[1], role: roleToSend });
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
        chatHistoryRef.current = [{ role: 'rep', text: data.script }];
        setChatHistory([...chatHistoryRef.current]);
        setHasGenerated(true);
    };

    const saveWinToVault = async () => {
        try {
            await fetch('http://127.0.0.1:3000/api/save-win', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatHistory, persona: customPersona, context: customContext })
            });
            alert("🏆 Live Call Saved to Winning Vault!");
        } catch (err) { console.error("Vault Error:", err); }
    };

    const toggleRecording = (role) => {
        if (!isStreaming) return;

        if (listeningTo === role) {
            setListeningTo(null);
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        } else {
            setListeningTo(role);
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();

            setTimeout(() => {
                audioRoleRef.current = role;
                if (mediaRecorderRef.current?.state === 'inactive') mediaRecorderRef.current.start();
            }, 100);
        }
    };

    return (
        <div className="flex flex-col h-screen p-8 bg-dark-900 text-white font-sans overflow-hidden">
            <div className="flex justify-between items-center mb-6 mt-4">
                <h1 className="text-4xl font-bold tracking-tighter text-neon-purple uppercase italic drop-shadow-glow-purple">Manager Ride-Along</h1>

                <div className="flex gap-4">
                    <button
                        onClick={() => toggleRecording('rep')}
                        disabled={!isStreaming}
                        className={`px-4 py-2 rounded-full border transition-all duration-300 ${!isStreaming ? 'bg-dark-900 border-dark-600 opacity-50 cursor-not-allowed' : listeningTo === 'rep' ? 'bg-neon-blue/20 border-neon-blue shadow-glow-blue animate-pulse' : 'bg-dark-900 border-neon-blue hover:bg-neon-blue/20'}`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-widest text-neon-blue`}>
                            {listeningTo === 'rep' ? '🔴 Recording Rep (Click to Stop)' : '⏺️ Record Rep'}
                        </span>
                    </button>

                    <button
                        onClick={() => toggleRecording('customer')}
                        disabled={!isStreaming}
                        className={`px-4 py-2 rounded-full border transition-all duration-300 ${!isStreaming ? 'bg-dark-900 border-dark-600 opacity-50 cursor-not-allowed' : listeningTo === 'customer' ? 'bg-neon-red/20 border-neon-red shadow-glow-red animate-pulse' : 'bg-dark-900 border-neon-red hover:bg-neon-red/20'}`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-widest text-neon-red`}>
                            {listeningTo === 'customer' ? '🔴 Recording Customer (Click to Stop)' : '⏺️ Record Customer'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 mb-6 overflow-hidden">
                {/* LEFT PANEL */}
                <div className="col-span-4 bg-dark-800 rounded-2xl p-6 border border-dark-600 shadow-lg flex flex-col min-h-0">
                    {!hasGenerated ? (
                        <div className="flex flex-col gap-4 h-full">
                            <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest">Customer Information</p>
                            <input value={customPersona} onChange={(e) => setCustomPersona(e.target.value)} className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm focus:border-neon-purple outline-none" placeholder="e.g. CTO of a Fortune 500 Bank" />
                            <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest">Sales Context</p>
                            <textarea value={customContext} onChange={(e) => setCustomContext(e.target.value)} className="flex-1 bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm focus:border-neon-purple outline-none resize-none" placeholder="e.g. Concerned about security, $50k budget." />
                            <button onClick={handleGenerateScript} className="w-full bg-neon-purple/10 border border-neon-purple/50 text-neon-purple hover:bg-white hover:text-black py-4 rounded-xl font-black uppercase text-xs">Generate Hooks</button>
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
                                {julesOptions && (
                                    <div className="bg-dark-900/90 p-5 rounded-2xl border-2 border-neon-purple shadow-glow-purple space-y-3 mt-6">
                                        <p className="text-[10px] font-black text-neon-purple uppercase mb-2 tracking-widest">Live Manager Insights</p>
                                        {julesOptions.map((opt, i) => (
                                            <div key={i} className="w-full text-left p-4 bg-dark-800 border border-neon-purple/20 rounded-xl">
                                                <div className="text-[9px] font-black text-neon-purple mb-1 uppercase">{opt.type}</div>
                                                <p className="text-sm text-gray-100">{opt.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* ✨ NEW: The invisible anchor for auto-scrolling */}
                                <div ref={insightsEndRef} className="h-4" />
                            </div>
                            <button onClick={saveWinToVault} className="w-full py-4 bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all mt-4 flex-shrink-0">
                                Archive as "Winning Call"
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL */}
                <div className="col-span-8 rounded-2xl border border-dark-600 bg-dark-800/50 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-4 border-b border-dark-600 bg-dark-800/80"><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Co-Pilot Stream</p></div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'rep' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-2xl ${msg.role === 'rep' ? 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue' : 'bg-neon-green/10 border border-neon-green/30 text-neon-green'}`}>
                                    <p className="text-[9px] font-black mb-2 opacity-50 uppercase tracking-widest">{msg.role === 'rep' ? 'You' : 'Customer'}</p>
                                    "{msg.text}"
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>
            </div>
            <button onClick={isStreaming ? () => setIsStreaming(false) : startStreaming} disabled={!hasGenerated} className={`w-full py-6 rounded-2xl flex items-center justify-center gap-4 border-2 transition-all duration-300 ${isStreaming ? 'bg-neon-red/10 border-neon-red text-neon-red' : 'bg-neon-purple/10 border-neon-purple text-neon-purple hover:bg-white hover:text-black'}`}>
                <p className="text-xl font-black uppercase tracking-widest">{isStreaming ? 'End Ride-Along' : 'Start Manager Ride-Along'}</p>
            </button>
        </div>
    );
}