import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Zap, Swords } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:3000', { transports: ['websocket', 'polling'] });

export default function SimulatorCopilot() {
    const [chatHistory, setChatHistory] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    // UI Loading States
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    // ✨ NEW: State for the live preview text
    const [liveText, setLiveText] = useState("");

    const [customPersona, setCustomPersona] = useState("");
    const [customContext, setCustomContext] = useState("");
    const [hasStarted, setHasStarted] = useState(false);

    const mediaRecorderRef = useRef(null);
    const chatHistoryRef = useRef([]);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.onresult = (event) => {
                let current = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    current += event.results[i][0].transcript;
                }
                setLiveText(current);
            };
        }
    }, []);

    useEffect(() => {
        socket.on('simulator_transcript', (data) => {
            setIsTranscribing(false);
            setLiveText("");
            chatHistoryRef.current.push({ role: 'rep', text: data.text });
            setChatHistory([...chatHistoryRef.current]);
        });

        socket.on('simulator_response', (data) => {
            setIsThinking(false);
            chatHistoryRef.current.push({ role: 'customer', text: data.aiText });
            setChatHistory([...chatHistoryRef.current]);

            // ✨ FIXED: Play the high-fidelity Groq audio!
            if (data.audioBase64) {
                const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
                audio.play().catch(e => console.error("Audio playback error:", e));
            } else {
                // Fallback to robotic browser voice
                const utterance = new SpeechSynthesisUtterance(data.aiText);
                utterance.rate = 1.05;
                window.speechSynthesis.speak(utterance);
            }
        });

        return () => {
            socket.off('simulator_transcript');
            socket.off('simulator_response');
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatHistory, isThinking, isTranscribing, liveText]);

    const startSession = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = async (event) => {
            if (event.data.size > 0 && socket.connected) {
                const reader = new FileReader(); reader.readAsDataURL(event.data);
                reader.onloadend = () => {
                    setIsThinking(true);
                    socket.emit('simulator_turn', { blob: reader.result.split(',')[1], chatHistory: chatHistoryRef.current, persona: customPersona });
                };
            }
        };
        setHasStarted(true);
    };

    const toggleRecording = () => {
        if (!hasStarted) return;
        if (!isRecording) {
            window.speechSynthesis.cancel();
            if (mediaRecorderRef.current?.state === 'inactive') mediaRecorderRef.current.start();
            if (recognitionRef.current) recognitionRef.current.start();
            setIsRecording(true);
        } else {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            setIsTranscribing(true);
        }
    };

    const saveWinToVault = async () => {
        try {
            await fetch('http://127.0.0.1:3000/api/save-win', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatHistory, persona: customPersona, context: customContext })
            });
            alert("🏆 Training Conversation Saved to Winning Vault!");
        } catch (err) { console.error("Vault Error:", err); }
    };

    const endTraining = () => {
        setHasStarted(false);
        setChatHistory([]);
        chatHistoryRef.current = [];
        setIsRecording(false);
        setIsThinking(false);
        setIsTranscribing(false);
        setLiveText("");
        window.speechSynthesis.cancel();
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return (
        <div className="flex flex-col h-screen p-8 bg-dark-900 text-white font-sans overflow-hidden">
            <div className="flex justify-between items-center mb-6 mt-4">
                <h1 className="text-4xl font-bold tracking-tighter text-orange-500 uppercase italic drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">Training Mode</h1>

                {hasStarted && (
                    <button
                        onClick={toggleRecording}
                        className={`px-6 py-3 rounded-full border-2 transition-all duration-300 ${isRecording ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse' : 'bg-dark-800 border-orange-500 hover:bg-orange-500/20'}`}
                    >
                        <span className={`text-xs font-black uppercase tracking-widest ${isRecording ? 'text-orange-500' : 'text-orange-400'}`}>
                            {isRecording ? '🔴 Recording (Click to Stop)' : '⏺️ Record Pitch'}
                        </span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 mb-6 overflow-hidden">
                <div className="col-span-4 bg-dark-800 rounded-2xl p-6 border border-dark-600 shadow-lg flex flex-col min-h-0">
                    {!hasStarted ? (
                        <div className="flex flex-col gap-4 h-full">
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Customer Information</p>
                            <input value={customPersona} onChange={(e) => setCustomPersona(e.target.value)} className="bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm focus:border-orange-500 outline-none" placeholder="e.g. Gordon Ramsay, furious Michelin star chef." />
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Sales Context</p>
                            <textarea value={customContext} onChange={(e) => setCustomContext(e.target.value)} className="flex-1 bg-dark-900 border border-dark-600 rounded-xl p-4 text-sm focus:border-orange-500 outline-none resize-none" placeholder="e.g. Concerned about security, $50k budget." />
                            <button onClick={startSession} className="w-full bg-orange-500/10 border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-black py-4 rounded-xl font-black uppercase text-xs flex-shrink-0">Enter Training</button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-600">
                                    <p className="text-[10px] text-orange-500 font-black mb-2 uppercase tracking-widest">Customer Profile</p>
                                    <p className="text-sm text-white font-bold">{customPersona}</p>
                                </div>
                                <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-600">
                                    <p className="text-[10px] text-orange-500 font-black mb-2 uppercase tracking-widest">Sales Context</p>
                                    <p className="text-sm text-gray-300 italic break-words whitespace-pre-wrap">{customContext}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-4 flex-shrink-0">
                                <button onClick={saveWinToVault} className="flex-1 py-4 bg-green-500/10 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
                                    Save Win
                                </button>
                                <button onClick={endTraining} className="flex-1 py-4 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
                                    End Training
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-span-8 rounded-2xl border border-dark-600 bg-dark-800/50 flex flex-col min-h-0 overflow-hidden relative">
                    <div className="p-4 border-b border-dark-600 bg-dark-800/80"><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Co-Pilot Stream</p></div>

                    <div className="absolute top-16 right-4 flex flex-col gap-2">
                        {isTranscribing && <div className="px-3 py-1 bg-dark-900 border border-blue-500/30 rounded-full text-[10px] text-blue-400 animate-pulse uppercase tracking-widest shadow-lg">Transcribing audio...</div>}
                        {isThinking && <div className="px-3 py-1 bg-dark-900 border border-orange-500/30 rounded-full text-[10px] text-orange-500 animate-pulse uppercase tracking-widest shadow-lg">Opponent Typing...</div>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'rep' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-2xl ${msg.role === 'rep' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border border-orange-500/40 text-orange-400 font-bold'}`}>
                                    <p className="text-[9px] font-black mb-2 opacity-50 uppercase tracking-widest">{msg.role === 'rep' ? 'You' : 'AI Prospect'}</p>
                                    "{msg.text}"
                                </div>
                            </div>
                        ))}

                        {liveText && (
                            <div className="flex justify-end">
                                <div className="max-w-[85%] p-5 rounded-2xl bg-blue-500/5 border border-blue-500/30 text-blue-400/50 italic transition-all duration-300">
                                    <p className="text-[9px] font-black mb-2 opacity-50 uppercase tracking-widest">You (Speaking...)</p>
                                    "{liveText}"
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}