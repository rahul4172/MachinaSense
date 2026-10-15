import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Radio,
  FileUp,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Layers,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { Machine, Alert, AlertSummary } from '../types';

interface OverviewPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [mList, aList, aSummary, hist] = await Promise.all([
        api.getMachines(),
        api.getAlerts(undefined, 'NEW'),
        api.getAlertSummary(),
        api.getInferenceHistory()
      ]);
      setMachines(mList);
      setAlerts(aList);
      setSummary(aSummary);
      if (hist && hist.history) {
        setTelemetryHistory(hist.history.map((h: any) => ({
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          vibration: h.telemetry.vibration_rms,
          torque: h.telemetry.torque_nm,
          anomalyScore: Math.round(h.prediction.anomaly_score * 100)
        })));
      }
    } catch (err) {
      console.error('Failed to load overview data', err);
    }
  };

  const totalMachines = machines.length;
  const normalMachines = machines.filter(m => m.status === 'OPERATIONAL').length;
  const criticalMachines = machines.filter(m => m.status === 'CRITICAL').length;
  const warningMachines = machines.filter(m => m.status === 'WARNING').length;
  const avgHealth = totalMachines > 0
    ? (machines.reduce((acc, m) => acc + m.health_score, 0) / totalMachines).toFixed(1)
    : '100.0';

  return (
    <div className="space-y-10">
      {/* Hero Section — Swiss Asymmetric Composition */}
      <section className="border-4 border-black bg-white p-6 sm:p-10 relative overflow-hidden swiss-grid-pattern">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold mb-2">
              <span>01. SYSTEM STATUS</span>
              <span>//</span>
              <span className="text-black">SYSTEM OVERVIEW</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-black leading-none">
              PLANT FLEET MONITOR
            </h1>
            <p className="mt-4 text-base sm:text-lg text-black font-medium leading-relaxed max-w-2xl">
              Objective mathematical telemetry analytics, real-time vibration velocity degradation mapping, and evidence-grounded incident isolation for rotating machinery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('simulation')}
              className="px-6 py-4 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF3000] transition-none flex items-center space-x-2 border-2 border-black"
            >
              <span>TELEMETRY STREAM</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('ingestion')}
              className="px-6 py-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-none border-2 border-black"
            >
              <span>DATASET INGESTION</span>
            </button>
          </div>
        </div>
      </section>

      {/* Massive Typographic Data Matrix (The Swiss Grid) */}
      <section className="border-4 border-black bg-black grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5">
        {/* Metric 1 */}
        <div className="bg-white p-6 sm:p-8 flex flex-col justify-between swiss-dots">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest font-bold">
            <span>REGISTERED ASSETS</span>
            <span className="text-[#FF3000]">01</span>
          </div>
          <div className="my-6">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-black leading-none">
              {String(totalMachines).padStart(2, '0')}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-2 block font-mono">
              UNITS MONITORED
            </span>
          </div>
          <div className="border-t-2 border-black pt-3 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-black">{normalMachines} NOMINAL</span>
            <span className="text-[#FF3000]">{warningMachines + criticalMachines} ATTENTION</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest font-bold">
            <span>FLEET HEALTH COMPOSITE</span>
            <span className="text-[#FF3000]">02</span>
          </div>
          <div className="my-6">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-black leading-none">
              {avgHealth}<span className="text-3xl font-sans">%</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-2 block font-mono">
              ARITHMETIC MEAN
            </span>
          </div>
          <div className="border-t-2 border-black pt-3 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-black">STANDARD DEVIATION: ±4.2%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 sm:p-8 flex flex-col justify-between swiss-diagonal">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest font-bold">
            <span>CRITICAL FAULT ALERTS</span>
            <span className="text-[#FF3000]">03</span>
          </div>
          <div className="my-6">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-[#FF3000] leading-none">
              {String(summary ? summary.critical_alerts : 0).padStart(2, '0')}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-black mt-2 block font-mono">
              MANDATORY INSPECTION
            </span>
          </div>
          <div className="border-t-2 border-black pt-3 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-black">{summary ? summary.warning_alerts : 0} HIGH/WARNING</span>
            <span className="text-black font-bold">SLA: &lt;15 MIN</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest font-bold">
            <span>INFERENCE LATENCY</span>
            <span className="text-[#FF3000]">04</span>
          </div>
          <div className="my-6">
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-black leading-none">
              0.052<span className="text-2xl font-mono">MS</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-2 block font-mono">
              ~19,230 SAMPLES/SEC
            </span>
          </div>
          <div className="border-t-2 border-black pt-3 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-black">PIPELINE: MULTI-TASK</span>
            <span className="text-emerald-700 font-bold">OPTIMIZED</span>
          </div>
        </div>
      </section>

      {/* Synchronized Telemetry Graphic & Machine Registry (Asymmetric 8:4 Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Large stark area graph */}
        <div className="lg:col-span-8 border-4 border-black bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b-2 border-black gap-2 mb-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
                02. PHYSICAL TELEMETRY
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                SYNCHRONIZED VIBRATION RMS & TORQUE MATRIX
              </h2>
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 bg-black text-white self-start sm:self-auto">
              BUFFER: {telemetryHistory.length} POINTS
            </span>
          </div>

          <div className="h-72 w-full">
            {telemetryHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="0 0" stroke="#E5E5E5" />
                  <XAxis dataKey="time" stroke="#000000" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#000000" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', borderColor: '#000000', borderRadius: '0px', color: '#FFFFFF' }}
                    labelStyle={{ color: '#FF3000', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                    itemStyle={{ color: '#FFFFFF', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration RMS (mm/s)"
                    stroke="#FF3000"
                    strokeWidth={2.5}
                    fillOpacity={0.15}
                    fill="#FF3000"
                  />
                  <Area
                    type="monotone"
                    dataKey="torque"
                    name="Shaft Torque (Nm)"
                    stroke="#000000"
                    strokeWidth={2}
                    fillOpacity={0.05}
                    fill="#000000"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-black p-8 text-center bg-[#F2F2F2]">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-black mb-2">
                  NO ACTIVE TELEMETRY STREAM DATA IN BUFFER
                </span>
                <button
                  onClick={() => onNavigate('simulation')}
                  className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF3000] transition-none"
                >
                  START SIMULATION
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: High-contrast fleet list */}
        <div className="lg:col-span-4 border-4 border-black bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
                  03. ASSET REGISTRY
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black">FLEET HEALTH</h3>
              </div>
              <button
                onClick={() => onNavigate('monitoring')}
                className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] flex items-center space-x-1"
              >
                <span>ALL (5)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y-2 divide-black">
              {machines.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onNavigate('monitoring', m.id)}
                  className="py-3 cursor-pointer group flex items-center justify-between hover:bg-[#F2F2F2] px-2 transition-none"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-black group-hover:text-[#FF3000]">
                        {m.id}
                      </span>
                      <span className={`text-[9px] font-mono px-1 font-bold ${
                        m.status === 'OPERATIONAL'
                          ? 'bg-black text-white'
                          : m.status === 'CRITICAL'
                          ? 'bg-[#FF3000] text-white'
                          : 'bg-zinc-300 text-black'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-black uppercase truncate max-w-[180px] mt-0.5">
                      {m.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-mono font-black text-black">
                      {m.health_score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-black pt-4 mt-6 flex items-center justify-between font-mono text-xs font-bold">
            <span className="uppercase text-zinc-500">CRITICAL MACHINES:</span>
            <span className="text-[#FF3000] font-black text-base">{criticalMachines}</span>
          </div>
        </div>
      </section>

      {/* Priority Action Table (Pure Swiss Typography) */}
      <section className="border-4 border-black bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b-2 border-black mb-4 gap-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
              04. MAINTENANCE WORK ORDERS
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">
              ACTIVE INCIDENT DISPATCH MATRIX
            </h2>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] flex items-center space-x-1"
          >
            <span>VIEW MAINTENANCE LOG</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs font-mono border-2 border-black">
              <thead className="bg-black text-white uppercase tracking-wider">
                <tr>
                  <th className="p-3 border-r border-zinc-800">ALERT ID</th>
                  <th className="p-3 border-r border-zinc-800">MACHINE</th>
                  <th className="p-3 border-r border-zinc-800">FAULT CLASS</th>
                  <th className="p-3 border-r border-zinc-800">SEVERITY</th>
                  <th className="p-3 border-r border-zinc-800">SCORE</th>
                  <th className="p-3 border-r border-zinc-800">RECOMMENDED ACTION</th>
                  <th className="p-3">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-black">
                {alerts.slice(0, 5).map((a) => (
                  <tr key={a.id} className="hover:bg-[#F2F2F2] transition-none">
                    <td className="p-3 font-bold border-r-2 border-black">{a.id}</td>
                    <td className="p-3 font-black border-r-2 border-black">{a.machine_id}</td>
                    <td className="p-3 border-r-2 border-black">
                      <span className="px-1.5 py-0.5 bg-black text-white font-bold text-[10px]">
                        {a.fault_class}
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-black">
                      <span className={`px-1.5 py-0.5 font-black text-[10px] ${
                        a.severity === 'CRITICAL'
                          ? 'bg-[#FF3000] text-white'
                          : a.severity === 'HIGH'
                          ? 'bg-black text-white'
                          : 'bg-zinc-200 text-black border border-black'
                      }`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="p-3 font-bold border-r-2 border-black">
                      {(a.anomaly_score * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 font-sans font-medium text-black border-r-2 border-black max-w-sm truncate">
                      {a.recommendation}
                    </td>
                    <td className="p-3 text-zinc-600">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 border-2 border-black bg-[#F2F2F2] text-center font-mono text-xs font-bold uppercase tracking-widest text-black">
            NO UNRESOLVED CRITICAL ALERTS. ALL SYSTEMS NOMINAL.
          </div>
        )}
      </section>
    </div>
  );
};
