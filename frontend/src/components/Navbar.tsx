import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, alertCount }) => {
  const [modelOnline, setModelOnline] = useState<boolean>(true);

  useEffect(() => {
    api.getHealth()
      .then(h => setModelOnline(h.model_loaded))
      .catch(() => setModelOnline(false));
  }, []);

  const navItems = [
    { id: 'overview', num: '01', label: 'OVERVIEW' },
    { id: 'monitoring', num: '02', label: 'FLEET' },
    { id: 'simulation', num: '03', label: 'TELEMETRY' },
    { id: 'ingestion', num: '04', label: 'INGESTION' },
    { id: 'alerts', num: '05', label: 'ALERTS', badge: alertCount },
    { id: 'insights', num: '06', label: 'MODEL SPEC' },
    { id: 'evaluation', num: '07', label: 'BENCHMARK' },
    { id: 'earlywarning', num: '08', label: 'EARLY WARNING' },
    { id: 'edgedrift', num: '09', label: 'EDGE & DRIFT' },
    { id: 'commercial', num: '10', label: 'COMMERCIAL ROI' },
  ];

  return (
    <header className="border-b-4 border-black bg-white swiss-grid-pattern sticky top-0 z-50">
      {/* Top Utility Bar */}
      <div className="border-b-2 border-black bg-black text-white text-[10px] font-mono tracking-widest px-4 sm:px-8 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="bg-[#FF3000] px-1.5 py-0.2 font-black text-white uppercase">PS 01</span>
          <span className="uppercase font-bold tracking-wider">MACHINASENSE // INDUSTRIAL FAULT DETECTION & PREDICTIVE INTELLIGENCE</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-zinc-400">ENGINE:</span>
          <span className="flex items-center space-x-1.5">
            <span className={`inline-block h-2 w-2 ${modelOnline ? 'bg-[#FF3000]' : 'bg-zinc-500'}`}></span>
            <span className="font-bold text-white uppercase">{modelOnline ? 'ONLINE (ACTIVE)' : 'OFFLINE'}</span>
          </span>
          <span className="hidden md:inline text-zinc-400">LATENCY: 0.052 MS</span>
        </div>
      </div>

      {/* Main Header / Brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start space-x-4 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-12 h-12 bg-black flex items-center justify-center text-white flex-shrink-0">
              <span className="font-black text-2xl tracking-tighter text-[#FF3000]">M</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-black uppercase leading-none">
                  MACHINA<span className="text-[#FF3000]">SENSE</span>
                </h1>
                <span className="text-xs font-mono font-bold uppercase tracking-widest border border-black px-1.5 py-0.5">
                  SYS 1.0
                </span>
              </div>
              <p className="text-[11px] font-bold text-black uppercase tracking-widest mt-1">
                SYSTEME FUR INDUSTRIELLE FEHLERERKENNUNG UND VORAUSSCHAUENDE WARTUNG
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">STANDORT DER ANLAGE</div>
            <div className="text-xs font-black uppercase text-black font-mono">WERK 01 / HALLE A-04</div>
          </div>
        </div>
      </div>

      {/* Grid Navigation Tabs */}
      <div className="border-t-2 border-black bg-white overflow-x-auto">
        <div className="max-w-7xl mx-auto flex divide-x-2 divide-black border-r-2 border-black">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex items-center space-x-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-none whitespace-nowrap text-left ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-[#FF3000] hover:text-white'
                }`}
              >
                <span className={`font-mono text-[10px] ${isActive ? 'text-[#FF3000]' : 'text-zinc-500 group-hover:text-white'}`}>
                  {item.num}.
                </span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                    isActive ? 'bg-[#FF3000] text-white' : 'bg-black text-white group-hover:bg-black'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
