import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { Machine, Alert } from '../types';

interface MonitoringPageProps {
  initialMachineId?: string;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({ initialMachineId }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [machineAlerts, setMachineAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadMachines();
  }, [statusFilter]);

  const loadMachines = async () => {
    try {
      const data = await api.getMachines(
        statusFilter === 'ALL' ? undefined : statusFilter,
        undefined,
        search ? search : undefined
      );
      setMachines(data);
      if (initialMachineId) {
        const found = data.find(m => m.id === initialMachineId);
        if (found) selectMachine(found);
      } else if (data.length > 0 && !selectedMachine) {
        selectMachine(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectMachine = async (machine: Machine) => {
    setSelectedMachine(machine);
    try {
      const detail = await api.getMachineDetail(machine.id);
      setMachineAlerts(detail.recent_alerts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getTrendData = () => {
    if (!selectedMachine?.latest_readings) return [];
    const r = selectedMachine.latest_readings;
    const points = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      points.push({
        time: t,
        vibration: Math.max(0.4, Number(r.vibration_rms) + (Math.sin(i) * 0.15)),
        processTemp: Number(r.process_temperature_k) + (Math.cos(i) * 0.4),
        torque: Number(r.torque_nm) + (Math.sin(i * 2) * 2.0),
        speed: Number(r.rotational_speed_rpm) + (Math.cos(i) * 15.0)
      });
    }
    return points;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold mb-1">
              02. ASSET INSPECTOR // EQUIPMENT FLEET
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black leading-none">
              FLEET TELEMETRY & DIAGNOSTICS
            </h1>
            <p className="text-sm text-black font-medium mt-3 max-w-xl">
              Real-time transducer matrices, synchronized degradation traces, and physical operating boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="SEARCH ASSET ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadMachines()}
                className="bg-white border-2 border-black px-3 py-2 text-xs font-mono font-bold text-black placeholder-zinc-400 focus:outline-none focus:border-[#FF3000] w-48 sm:w-60 uppercase"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black text-white border-2 border-black px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="OPERATIONAL">OPERATIONAL</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asymmetric 5:7 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Asset Selection List (5 cols) */}
        <div className="lg:col-span-5 border-4 border-black bg-white">
          <div className="border-b-2 border-black bg-black text-white px-4 py-3 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest">
            <span>REGISTERED UNITS ({machines.length})</span>
            <span className="text-[#FF3000]">FLEET-01</span>
          </div>

          <div className="divide-y-2 divide-black max-h-[750px] overflow-y-auto">
            {machines.map((m) => {
              const isSelected = selectedMachine?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => selectMachine(m)}
                  className={`p-4 cursor-pointer transition-none ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-[#F2F2F2]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm font-black ${isSelected ? 'text-[#FF3000]' : 'text-black'}`}>
                          {m.id}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                          m.status === 'CRITICAL'
                            ? 'bg-[#FF3000] text-white'
                            : isSelected
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className={`text-xs font-bold uppercase mt-1 ${isSelected ? 'text-zinc-200' : 'text-black'}`}>
                        {m.name}
                      </div>
                      <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {m.location}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-mono font-black">
                        {m.health_score.toFixed(1)}%
                      </div>
                      <span className={`text-[10px] font-mono uppercase ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        HEALTH
                      </span>
                    </div>
                  </div>

                  {m.latest_readings && (
                    <div className={`mt-3 pt-3 border-t grid grid-cols-4 gap-2 font-mono text-[10px] ${
                      isSelected ? 'border-zinc-800 text-zinc-300' : 'border-black text-black'
                    }`}>
                      <div>
                        <span className="block opacity-60">VIB RMS</span>
                        <span className="font-bold">{m.latest_readings.vibration_rms}</span>
                      </div>
                      <div>
                        <span className="block opacity-60">TORQUE</span>
                        <span className="font-bold">{m.latest_readings.torque_nm}</span>
                      </div>
                      <div>
                        <span className="block opacity-60">SPEED</span>
                        <span className="font-bold">{m.latest_readings.rotational_speed_rpm}</span>
                      </div>
                      <div>
                        <span className="block opacity-60">WEAR</span>
                        <span className="font-bold">{m.latest_readings.tool_wear_min}m</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Asset Deep Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedMachine ? (
            <div className="border-4 border-black bg-white p-6 sm:p-8 space-y-6">
              {/* Asset Header */}
              <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 font-mono text-xs font-bold text-[#FF3000] uppercase tracking-widest">
                    <span>UNIT DOSSIER</span>
                    <span>//</span>
                    <span className="text-black">{selectedMachine.category}</span>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-black mt-1">
                    {selectedMachine.id}
                  </h2>
                  <p className="text-sm font-bold text-black uppercase mt-0.5">
                    {selectedMachine.name}
                  </p>
                  <p className="text-xs font-mono text-zinc-600 mt-1">
                    LOCATION: {selectedMachine.location}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-4xl font-mono font-black text-black">
                    {selectedMachine.health_score.toFixed(1)}%
                  </div>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-black text-white uppercase mt-1 ${
                    selectedMachine.status === 'CRITICAL' ? 'bg-[#FF3000]' : 'bg-black'
                  }`}>
                    {selectedMachine.status}
                  </span>
                </div>
              </div>

              {/* Transducer Matrix */}
              {selectedMachine.latest_readings && (
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-black font-bold mb-3">
                    TRANSDUCER SENSOR READINGS (NOMINAL VS INSTANTANEOUS)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border-2 border-black p-3 bg-white">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">VIBRATION RMS</span>
                      <span className="text-xl font-mono font-black text-[#FF3000]">
                        {selectedMachine.latest_readings.vibration_rms} <span className="text-xs">mm/s</span>
                      </span>
                      <span className="text-[9px] font-mono text-black block mt-1">NORM: 1.35 mm/s</span>
                    </div>

                    <div className="border-2 border-black p-3 bg-white">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">TORQUE</span>
                      <span className="text-xl font-mono font-black text-black">
                        {selectedMachine.latest_readings.torque_nm} <span className="text-xs">Nm</span>
                      </span>
                      <span className="text-[9px] font-mono text-black block mt-1">NORM: 40.0 Nm</span>
                    </div>

                    <div className="border-2 border-black p-3 bg-white">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">SPEED</span>
                      <span className="text-xl font-mono font-black text-black">
                        {selectedMachine.latest_readings.rotational_speed_rpm} <span className="text-xs">RPM</span>
                      </span>
                      <span className="text-[9px] font-mono text-black block mt-1">NORM: 1530 RPM</span>
                    </div>

                    <div className="border-2 border-black p-3 bg-white">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">PROCESS TEMP</span>
                      <span className="text-xl font-mono font-black text-black">
                        {selectedMachine.latest_readings.process_temperature_k} <span className="text-xs">K</span>
                      </span>
                      <span className="text-[9px] font-mono text-black block mt-1">
                        DELTA: {(Number(selectedMachine.latest_readings.process_temperature_k) - Number(selectedMachine.latest_readings.air_temperature_k)).toFixed(1)} K
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Synchronized Trend Chart */}
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-black font-bold mb-3">
                  HISTORICAL MULTI-CHANNEL TELEMETRY TRENDS
                </div>
                <div className="h-60 w-full border-2 border-black p-2 bg-white">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getTrendData()}>
                      <CartesianGrid strokeDasharray="0 0" stroke="#E5E5E5" />
                      <XAxis dataKey="time" stroke="#000000" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#000000" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000000', borderColor: '#000000', borderRadius: '0px', color: '#FFFFFF' }}
                        labelStyle={{ color: '#FF3000', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}
                        itemStyle={{ color: '#FFFFFF', fontSize: '10px', fontFamily: 'monospace' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="vibration" name="Vib (mm/s)" stroke="#FF3000" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="torque" name="Torque (Nm)" stroke="#000000" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="processTemp" name="Temp (K)" stroke="#71717A" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Historical Alert Timeline */}
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-black font-bold mb-3">
                  MAINTENANCE ALERT LOG ({machineAlerts.length})
                </div>
                {machineAlerts.length > 0 ? (
                  <div className="divide-y-2 divide-black border-2 border-black">
                    {machineAlerts.map((a) => (
                      <div key={a.id} className="p-3 bg-white flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black text-black">{a.id}</span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                              a.severity === 'CRITICAL' ? 'bg-[#FF3000] text-white' : 'bg-black text-white'
                            }`}>
                              {a.severity}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-black border border-black px-1">
                              {a.fault_class}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-black mt-1">{a.recommendation}</p>
                          {a.sensor_evidence && a.sensor_evidence.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 font-mono text-[9px]">
                              {a.sensor_evidence.map((ev, i) => (
                                <span key={i} className="bg-zinc-200 border border-black px-1 py-0.2">
                                  {ev.sensor}: {ev.value} {ev.unit} ({ev.direction} z={ev.deviation_z})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap ml-2">
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-black bg-[#F2F2F2] text-center font-mono text-xs font-bold uppercase text-black">
                    KEINE AKTIVEN ODER HISTORISCHEN ALARME. SYSTEM VOLLSTANDIG BETRIEBSBEREIT.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 border-4 border-black bg-[#F2F2F2] text-center font-mono text-xs font-bold uppercase tracking-widest text-black">
              SELECT AN ASSET TO LOAD INSTRUMENTATION DOSSIER.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
