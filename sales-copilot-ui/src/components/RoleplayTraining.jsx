import React, { useState, useRef, useEffect } from 'react';
import { Mic, Activity, Volume2, Square, ChevronDown, Edit3, Sparkles, UserCircle, Zap } from 'lucide-react';
import { io } from 'socket.io-client';

// ✨ NEW: Connect Roleplay tab to Jules!
const socket = io('http://localhost:3000');

const SCENARIOS = [
  {
    id: 'legacy_migration',
    name: 'Enterprise Cloud Migration',
    icon: '☁️',
    persona: 'Sarah (VP of Sales)',
    context: 'Replacing a 15-year-old on-premise system.',
    rep_script: "Sarah, this is Chaitanya from LG. We just helped Acme Corp migrate off their legacy CRM with zero data loss. Do you have 30 seconds to hear how?"
  },
  {
    id: 'budget_freeze',
    name: 'CFO Budget Negotiation',
    icon: '📉',
    persona: 'Mark (CFO)',
    context: 'Total software spending freeze is in effect.',
    rep_script: "Mark, Chaitanya from LG here. I know new spend is frozen. Our platform specifically consolidates redundant tools to free up immediate budget. Can I share an example?"
  },
  {
    id: 'security_block',
    name: 'CTO Security Audit',
    icon: '🛡️',
    persona: 'David (CTO)',
    context: 'Skeptical of LLM data residency.',
    rep_script: "David, this is Chaitanya from LG. I know data residency is your top priority. Our AI layer guarantees zero training on your PII. Open to a quick technical overview?"
  },
  {
    id: 'custom',
    name: 'Create Custom Scenario...',
    icon: '✨',
    persona: '',
    context: '',
    rep_script: ''
  }
];

export default function RoleplayTraining() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[3]);
  const [repName, setRepName] = useState("Chaitanya Mahajan");
  const [repCompany, setRepCompany] = useState("LG");
  const [customPersona, setCustomPersona] = useState(SCENARIOS[3].persona);
  const [customContext, setCustomContext] = useState(SCENARIOS[3].context);
  const [customScript, setCustomScript] = useState(SCENARIOS[3].rep_script);
  const [currentScript, setCurrentScript] = useState(SCENARIOS[3].rep_script);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("Click 'Push to Talk' to simulate a customer objection.");

  // ✨ NEW: States for the Unified Teleprompter
  const [julesOptions, setJulesOptions] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const audioRef = useRef(null);

  // ✨ NEW: Listen for Jules Options
  useEffect(() => {
    socket.on('jules_options', (options) => {
      setJulesOptions(options);
      setShowOptions(true); // 🔄 Switch to Decision Mode!
    });
    return () => socket.off('jules_options');
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    setTranscript("Connecting to ElevenLabs...");
    setShowOptions(false); // Reset to reading mode when we push the button

    const isCustom = activeScenario.id === 'custom';
    const payloadPersona = isCustom ? customPersona : activeScenario.persona;
    const payloadContext = isCustom ? customContext : activeScenario.context;

    try {
      // 1. Get the Customer Objection from ElevenLabs
      const response = await fetch('http://localhost:3000/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: payloadPersona, context: payloadContext })
      });
      const data = await response.json();

      if (data.audio) {
        setTranscript(data.text);
        if (audioRef.current) {
          audioRef.current.src = data.audio;
          audioRef.current.play();
        }

        // ✨ NEW: 2. Send that objection straight to Google Jules for Analysis!
        socket.emit('jules_change_scenario', { persona: payloadPersona, context: payloadContext });
        socket.emit('jules_analyze_transcript', data.text);
      }
    } catch (error) {
      setTranscript("Connection failed. Make sure server is running.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!customPersona || !customContext) return alert("Please enter a Persona and Context first!");

    setIsGeneratingScript(true);
    try {
      const response = await fetch('http://localhost:3000/api/generate-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: customPersona,
          context: customContext,
          repName: repName,
          repCompany: repCompany
        })
      });
      const data = await response.json();
      if (data.script) {
        setCustomScript(data.script);
        setCurrentScript(data.script);
        setShowOptions(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // ✨ NEW: Handle Option Selection
  const handleOptionSelect = (text) => {
    setCurrentScript(text);
    setShowOptions(false); // 🔄 Switch back to Reading Mode
  };

  const isCustom = activeScenario.id === 'custom';

  return (
    <div className="flex flex-col items-center h-full p-8 bg-dark-900 overflow-y-auto">
      <audio ref={audioRef} className="hidden" />

      <div className="max-w-4xl w-full flex flex-col items-center pb-20">

        <div className="w-full flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Objection Roleplay</h1>
            <p className="text-gray-400 text-sm">Practice your opening hooks against our AI.</p>
          </div>

          <div className="flex items-center gap-2 mt-2 group relative bg-dark-800 border border-dark-600 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Scenario:</span>
            <div className="relative flex items-center">
              <select
                value={activeScenario.id}
                onChange={(e) => {
                  const scenario = SCENARIOS.find(s => s.id === e.target.value);
                  setActiveScenario(scenario);
                  if (scenario.id === 'custom') {
                    setCurrentScript(customScript);
                  } else {
                    setCurrentScript(scenario.rep_script);
                  }
                  setShowOptions(false);
                  setJulesOptions(null);
                  setTranscript("Click 'Push to Talk' to simulate a customer objection.");
                }}
                className="appearance-none bg-transparent text-neon-blue font-bold text-sm focus:outline-none cursor-pointer hover:text-white transition-colors pr-6 z-10"
              >
                {SCENARIOS.map(s => <option key={s.id} value={s.id} className="bg-dark-800 text-white">{s.icon} {s.name}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-neon-blue absolute right-0 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Rep Identity Block */}
        <div className="w-full flex gap-4 mb-6">
          <div className="flex-1 bg-dark-800/50 border border-dark-700 rounded-xl p-3 flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="bg-transparent border-none text-sm text-white focus:outline-none font-medium w-full"
              placeholder="Your Name"
            />
          </div>
          <div className="flex-1 bg-dark-800/50 border border-dark-700 rounded-xl p-3 flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={repCompany}
              onChange={(e) => setRepCompany(e.target.value)}
              className="bg-transparent border-none text-sm text-white focus:outline-none font-medium w-full"
              placeholder="Your Company"
            />
          </div>
        </div>

        {/* ✨ THE UNIFIED DYNAMIC TELEPROMPTER */}
        <div className={`w-full bg-dark-800 rounded-2xl p-6 border-y border-r border-dark-600 shadow-2xl relative transition-all duration-300 flex flex-col min-h-[250px] mb-6 ${showOptions ? 'border-l-4 border-l-neon-purple' : 'border-l-4 border-l-neon-green'}`}>

          <div className="flex items-center justify-between mb-4 border-b border-dark-700 pb-3">
            <div className="flex items-center gap-2">
              {showOptions ? <Zap className="w-5 h-5 text-neon-purple animate-pulse" /> : <Mic className="w-5 h-5 text-neon-green animate-pulse" />}
              <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${showOptions ? 'text-neon-purple' : 'text-neon-green'}`}>
                {showOptions ? "Strategic Rebuttals Generated" : "Your Live Script"}
              </h3>
            </div>
            {!showOptions && isCustom && <Edit3 className="w-4 h-4 text-gray-500" />}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {showOptions && julesOptions ? (
              // MODE 2: DECISION MODE (The 3 Options)
              <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-gray-400 text-sm mb-1 text-center italic">Select your next strategic move:</p>
                {julesOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(opt.text)}
                    className="text-left w-full p-4 bg-dark-900 border border-neon-purple/40 rounded-xl hover:border-neon-green hover:bg-neon-green/10 transition-all group shadow-md"
                  >
                    <div className="text-[10px] uppercase font-black text-neon-purple group-hover:text-neon-green mb-1 transition-colors">{opt.type}</div>
                    <div className="text-md text-gray-100 font-medium leading-snug">{opt.text}</div>
                  </button>
                ))}
              </div>
            ) : (
              // MODE 1: READING MODE (The Script)
              isCustom ? (
                <textarea
                  value={currentScript}
                  onChange={(e) => {
                    setCurrentScript(e.target.value);
                    setCustomScript(e.target.value);
                  }}
                  className="w-full h-full min-h-[120px] bg-transparent border-none text-2xl text-white font-medium focus:outline-none resize-none leading-relaxed"
                  placeholder={`Enter a Persona and Context below, then click Auto-Generate Script!`}
                />
              ) : (
                <p className="text-2xl text-white font-medium leading-relaxed">"{currentScript}"</p>
              )
            )}
          </div>
        </div>

        {/* Custom Scenario Settings */}
        {isCustom && (
          <div className="w-full flex gap-4 mb-6">
            <div className="flex-1 bg-dark-800 border border-dark-700 rounded-xl p-4 flex flex-col shadow-md">
              <p className="text-xs text-neon-blue font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Target Persona</p>
              <input
                type="text"
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                className="bg-dark-900 border border-dark-600 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue"
                placeholder="e.g., Gordon Ramsay"
              />
            </div>
            <div className="flex-[2] bg-dark-800 border border-dark-700 rounded-xl p-4 flex flex-col shadow-md">
              <p className="text-xs text-neon-blue font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Context</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  className="flex-1 bg-dark-900 border border-dark-600 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue"
                  placeholder="e.g., Selling him a microwave..."
                />
                <button
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript}
                  className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/40 border border-neon-purple/50 px-4 rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGeneratingScript ? 'Writing...' : 'Auto-Generate'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative mb-12 flex justify-center items-center h-48 w-48 group cursor-pointer mt-4" onClick={toggleRecording}>
          {isRecording && (
            <>
              <div className="absolute inset-0 bg-neon-red/20 rounded-full animate-ping opacity-75 duration-1000"></div>
              <div className="absolute -inset-4 bg-neon-red/10 rounded-full animate-pulse-glow"></div>
            </>
          )}
          <div className={`relative z-10 flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 transition-all duration-300 ${isRecording ? 'bg-dark-800 border-neon-red shadow-glow-red scale-95' : 'bg-dark-700 border-dark-600 hover:border-neon-blue hover:shadow-glow-blue hover:scale-105'}`}>
            {isRecording ? <Square className="w-12 h-12 text-neon-red drop-shadow-[0_0_8px_rgba(255,0,60,0.8)] fill-current" /> : <Mic className="w-12 h-12 text-white group-hover:text-neon-blue transition-colors drop-shadow-md" />}
            <span className={`mt-3 font-bold tracking-wider text-xs transition-colors ${isRecording ? 'text-neon-red' : 'text-gray-300 group-hover:text-neon-blue'}`}>
              {isRecording ? 'GENERATING...' : 'PUSH TO TALK'}
            </span>
          </div>
        </div>

        <div className="w-full bg-dark-800 border-2 border-dark-600 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-dark-500 mb-6">
          <div className="bg-dark-700 px-6 py-4 flex items-center justify-between border-b border-dark-600">
            <div className="flex items-center gap-3">
              <div className="bg-dark-900 rounded p-1.5 border border-dark-600">
                <Activity className="w-4 h-4 text-neon-purple" />
              </div>
              <h3 className="font-semibold text-gray-200">Customer (ElevenLabs AI)</h3>
            </div>
          </div>
          <div className="p-8 min-h-[160px] flex items-center justify-center relative">
            <Volume2 className="absolute top-4 right-4 w-5 h-5 text-dark-500" />
            <p className={`text-xl text-center font-medium leading-relaxed transition-opacity duration-300 ${isRecording ? 'text-gray-400 italic' : 'text-white'}`}>
              "{transcript}"
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}