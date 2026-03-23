import React from 'react';
import { Mic, Headphones, LayoutDashboard } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'live', label: 'Live Copilot', icon: Headphones },
    { id: 'roleplay', label: 'Roleplay Training', icon: Mic },
  ];

  return (
    <div className="w-64 bg-dark-800 border-r border-dark-600 h-full flex flex-col p-4 shadow-xl z-10 relative">
      <div className="flex items-center gap-3 mb-10 px-2 mt-4">
        <div className="w-8 h-8 rounded bg-neon-blue flex items-center justify-center shadow-glow-blue">
          <LayoutDashboard className="text-dark-900 w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Sales<span className="text-neon-blue">Copilot</span></h1>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-dark-700 text-neon-blue shadow-glow-blue border border-neon-blue/30' 
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-neon-blue' : 'text-gray-400'}`} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto px-2 py-4 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-700 border-2 border-dark-600 overflow-hidden">
             {/* Placeholder avatar */}
             <div className="w-full h-full bg-gradient-to-tr from-neon-blue to-neon-purple opacity-70"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Alex Rep</p>
            <p className="text-xs text-gray-400">Enterprise Sales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
