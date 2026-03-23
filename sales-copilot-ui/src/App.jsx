import React, { useState } from 'react';
import LiveCopilot from './components/LiveCopilot';
import DualCopilot from './components/DualCopilot';
import SimulatorCopilot from './components/SimulatorCopilot';
import { Cpu, Zap, Swords } from 'lucide-react';

function App() {
  const [activeMode, setActiveMode] = useState('tactical'); // 'tactical', 'omni', 'simulator'

  // Dynamic glow color based on mode
  const getGlowColor = () => {
    if (activeMode === 'omni') return 'bg-neon-purple/5';
    if (activeMode === 'simulator') return 'bg-orange-500/5';
    return 'bg-neon-blue/5';
  };

  return (
    <div className="flex h-screen w-full bg-dark-900 overflow-hidden font-sans">
      <main className="flex-1 h-full overflow-hidden bg-dark-900 relative z-0">

        {/* Background glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${getGlowColor()}`}></div>

        {/* 🚀 3-WAY MODE SWITCHER (Top Center) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-dark-800/80 p-1.5 rounded-full border border-dark-600 backdrop-blur-md">
          <button
            onClick={() => setActiveMode('tactical')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-black uppercase text-[9px] tracking-[0.1em] ${activeMode === 'tactical' ? 'bg-neon-blue/20 text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Zap className="w-3 h-3" /> Sales Copilot
          </button>

          <button
            onClick={() => setActiveMode('omni')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-black uppercase text-[9px] tracking-[0.1em] ${activeMode === 'omni' ? 'bg-neon-purple/20 text-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.3)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Cpu className="w-3 h-3" /> Manager Ride-Along
          </button>

          <button
            onClick={() => setActiveMode('simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-black uppercase text-[9px] tracking-[0.1em] ${activeMode === 'simulator' ? 'bg-orange-500/20 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Swords className="w-3 h-3" /> Training
          </button>
        </div>

        <div className="h-full relative z-10 pt-4">
          {activeMode === 'tactical' && <LiveCopilot />}
          {activeMode === 'omni' && <DualCopilot />}
          {activeMode === 'simulator' && <SimulatorCopilot />}
        </div>

      </main>
    </div>
  );
}

export default App;