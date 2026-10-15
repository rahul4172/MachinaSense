import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { IngestionPage } from './pages/IngestionPage';
import { SimulationPage } from './pages/SimulationPage';
import { AlertsPage } from './pages/AlertsPage';
import { ModelInsights } from './pages/ModelInsights';
import { EvaluationPage } from './pages/EvaluationPage';
import { EarlyWarning } from './pages/EarlyWarning';
import { EdgeAndDriftPage } from './pages/EdgeAndDriftPage';
import { CommercialRoiPage } from './pages/CommercialRoiPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>(undefined);
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    // Load unread alert count
    const fetchCount = () => {
      api.getAlertSummary()
        .then(s => setAlertCount(s.by_status?.NEW || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab: string, param?: string) => {
    setActiveTab(tab);
    if (param) {
      setSelectedMachineId(param);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-[#FF3000] selection:text-white antialiased">
      {/* Top Swiss Navigation Grid */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setSelectedMachineId(undefined);
        }}
        alertCount={alertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewPage onNavigate={handleNavigate} />}
        {activeTab === 'monitoring' && <MonitoringPage initialMachineId={selectedMachineId} />}
        {activeTab === 'simulation' && <SimulationPage />}
        {activeTab === 'ingestion' && <IngestionPage />}
        {activeTab === 'alerts' && <AlertsPage />}
        {activeTab === 'insights' && <ModelInsights />}
        {activeTab === 'evaluation' && <EvaluationPage />}
        {activeTab === 'earlywarning' && <EarlyWarning />}
        {activeTab === 'edgedrift' && <EdgeAndDriftPage />}
        {activeTab === 'commercial' && <CommercialRoiPage />}
      </main>

      {/* Industrial Swiss Footer */}
      <footer className="border-t-4 border-black bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-black uppercase tracking-wider text-black">
              MACHINASENSE™ INDUSTRIAL ML ENGINE v1.0
            </span>
            <span className="text-black/30">|</span>
            <span className="text-black/70 uppercase">FASTAPI MODEL SERVICE</span>
            <span className="text-black/30">|</span>
            <span className="inline-flex items-center space-x-1.5 font-bold uppercase text-[#FF3000]">
              <span className="h-2 w-2 bg-[#FF3000]"></span>
              <span>ZERO TEMPORAL LEAKAGE VERIFIED</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 uppercase tracking-widest text-black/60 text-[11px]">
            <span>PS 01: FAULT DETECTION & PREDICTIVE MAINTENANCE</span>
            <span>•</span>
            <span className="font-bold text-black">SWISS TYPOGRAPHIC SYSTEM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
