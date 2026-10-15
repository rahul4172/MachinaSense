import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  Terminal,
  Layers,
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
import { SimulationEvent } from '../types';

export const SimulationPage: React.FC = () => {
  const [simState, setSimState] = useState<'STOPPED' | 'RUNNING' | 'PAUSED'>('STOPPED');
  const [speed, setSpeed] = useState<number>(1.0);
  const [scenario, setScenario] = useState<string>('RANDOM');
  const [selectedMachine, setSelectedMachine] = useState<string>('MCH-CNC-001');
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api.getSimulationStatus()
      .then((st) => {
        setSimState(st.state);
        setSpeed(st.playback_speed || 1.0);
        setScenario(st.fault_scenario || 'RANDOM');
        setSelectedMachine(st.machine_id || 'MCH-CNC-001');
        if (st.state === 'RUNNING') {
          connectSSE();
        }
      })
      .catch(console.error);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/simulation/stream');
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: SimulationEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, data].slice(-40));
        if (data.alert) {
          setLiveAlerts((prev) => [data.alert, ...prev].slice(0, 8));
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    es.onerror = () => {
      setTimeout(() => {
        if (simState === 'RUNNING') connectSSE();
      }, 3000);
    };
  };

  const handleStart = async () => {
    try {
      const res = await api.startSimulation(speed, scenario, selectedMachine);
      setSimState(res.state);
      connectSSE();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePause = async () => {
    try {
      const res = await api.pauseSimulation();
      setSimState(res.state);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    try {
      const res = await api.resumeSimulation();
      setSimState(res.state);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      const res = await api.stopSimulation();
      setSimState(res.state);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  const chartData = events.map((ev) => ({
    time: new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    vibration: ev.telemetry.vibration_rms,
    torque: ev.telemetry.torque_nm,
    acoustic: ev.telemetry.acoustic_emission_db,
    anomalyScore: Math.round(ev.prediction.anomaly_score * 100)
  }));

  return (
    <div className="space-y-8">
      {/* Simulation Banner Notice */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold mb-1">
              03. LIVE TELEMETRY GENERATOR // SSE STREAM
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black leading-none">
              TELEMETRY & INFERENCE STREAM
            </h1>
            <p className="text-sm text-black font-medium mt-3 max-w-2xl">
              Real-time Server-Sent Events generating physics-governed sensor trajectories and evaluating instantaneous machine condition via the production ML inference suite.
            </p>
          </div>

          <div className="border-2 border-black p-2 bg-[#F2F2F2] font-mono text-xs uppercase tracking-wider font-bold">
            PROTOCOL: <span className="text-[#FF3000]">SERVER-SENT EVENTS (SSE)</span>
          </div>
        </div>
      </div>

      {/* Control Panel — The Swiss Grid */}
      <div className="border-4 border-black bg-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-widest text-black mb-2">
                TARGET ASSET
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                disabled={simState === 'RUNNING'}
                className="w-full bg-white border-2 border-black p-2.5 text-xs font-mono font-bold text-black uppercase focus:outline-none focus:border-[#FF3000]"
              >
                <option value="MCH-CNC-001">MCH-CNC-001 (5-Axis Spindle)</option>
                <option value="MCH-CNC-002">MCH-CNC-002 (Vertical Mill)</option>
                <option value="MCH-PUMP-101">MCH-PUMP-101 (Centrifugal Pump)</option>
                <option value="MCH-PUMP-102">MCH-PUMP-102 (Hydraulic Pump)</option>
                <option value="MCH-TURB-201">MCH-TURB-201 (Gas Turbine)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-widest text-black mb-2">
                FAULT SCENARIO
              </label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full bg-white border-2 border-black p-2.5 text-xs font-mono font-bold text-black uppercase focus:outline-none focus:border-[#FF3000]"
              >
                <option value="RANDOM">RANDOM (Intermittent Physics Faults)</option>
                <option value="NORMAL">NORMAL (Nominal Healthy Operation)</option>
                <option value="BEARING_FAULT">BEARING_FAULT (Spindle Race Spalling)</option>
                <option value="TWF">TWF (Tool Wear Insert Failure)</option>
                <option value="HDF">HDF (Heat Dissipation Failure)</option>
                <option value="PWF">PWF (Power / Electrical Failure)</option>
                <option value="OSF">OSF (Mechanical Overstrain)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-widest text-black mb-2">
                SAMPLING VELOCITY
              </label>
              <div className="flex border-2 border-black divide-x-2 divide-black">
                {[0.5, 1.0, 2.0, 5.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-2 text-xs font-mono font-black uppercase transition-none ${
                      speed === s ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
                    }`}
                  >
                    {s}X
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            {simState === 'STOPPED' ? (
              <button
                onClick={handleStart}
                className="px-8 py-3.5 bg-black text-white hover:bg-[#FF3000] text-xs font-black uppercase tracking-widest transition-none border-2 border-black flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>START TELEMETRY STREAM</span>
              </button>
            ) : simState === 'RUNNING' ? (
              <>
                <button
                  onClick={handlePause}
                  className="px-6 py-3.5 bg-black text-white hover:bg-[#FF3000] text-xs font-black uppercase tracking-widest transition-none border-2 border-black flex items-center space-x-2"
                >
                  <Pause className="h-4 w-4" />
                  <span>PAUSE</span>
                </button>
                <button
                  onClick={handleStop}
                  className="px-6 py-3.5 bg-white text-black hover:bg-black hover:text-white text-xs font-black uppercase tracking-widest transition-none border-2 border-black flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>STOP</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleResume}
                  className="px-6 py-3.5 bg-black text-white hover:bg-[#FF3000] text-xs font-black uppercase tracking-widest transition-none border-2 border-black flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>RESUME</span>
                </button>
                <button
                  onClick={handleStop}
                  className="px-6 py-3.5 bg-white text-black hover:bg-black hover:text-white text-xs font-black uppercase tracking-widest transition-none border-2 border-black flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>STOP</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Machine Learning Verdict & Transducers */}
      {latestEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Live ML Verdict (5 cols) */}
          <div className="lg:col-span-5 border-4 border-black bg-white p-6 sm:p-8 space-y-6">
            <div className="border-b-2 border-black pb-3 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                REAL-TIME INFERENCE VERDICT
              </span>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 text-white uppercase ${
                latestEvent.prediction.severity === 'CRITICAL' ? 'bg-[#FF3000]' : 'bg-black'
              }`}>
                {latestEvent.prediction.severity}
              </span>
            </div>

            <div>
              <div className="text-4xl font-black uppercase tracking-tighter text-black font-mono">
                {latestEvent.prediction.fault_class}
              </div>
              <div className="font-mono text-xs text-black font-bold uppercase mt-1">
                CLASSIFICATION CONFIDENCE: {(latestEvent.prediction.confidence * 100).toFixed(1)}%
              </div>
              <p className="text-xs font-medium text-black mt-2">
                {latestEvent.prediction.recommendation}
              </p>
            </div>

            {/* Anomaly Score Bar */}
            <div className="border-2 border-black p-4 bg-[#F2F2F2]">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase mb-2">
                <span>ISOLATION ANOMALY SCORE</span>
                <span className={latestEvent.prediction.anomaly_score >= 0.65 ? 'text-[#FF3000]' : 'text-black'}>
                  {(latestEvent.prediction.anomaly_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white border border-black h-4 overflow-hidden">
                <div
                  className={`h-full ${latestEvent.prediction.anomaly_score >= 0.65 ? 'bg-[#FF3000]' : 'bg-black'}`}
                  style={{ width: `${latestEvent.prediction.anomaly_score * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase mt-1 block">
                THRESHOLD: 65% (NOMINAL BOUNDARY)
              </span>
            </div>

            {/* Predicted RUL */}
            <div className="border-2 border-black p-4 flex items-center justify-between font-mono text-xs font-bold">
              <span>PREDICTED REMAINING USEFUL LIFE:</span>
              <span className="text-base text-black font-black">
                {latestEvent.prediction.predicted_rul_cycles.toFixed(0)} CYCLES
              </span>
            </div>

            {/* Sensor Evidence Attributions */}
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-black font-bold mb-2">
                DEVIATING TRANSDUCER EVIDENCE (Z-SCORE)
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {latestEvent.prediction.sensor_evidence.length > 0 ? (
                  latestEvent.prediction.sensor_evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="border border-black p-2 font-mono text-xs flex items-center justify-between bg-white"
                    >
                      <span className="font-bold text-black">{ev.sensor}</span>
                      <span className={ev.direction === 'HIGH' ? 'text-[#FF3000] font-black' : 'text-black font-bold'}>
                        {ev.value} {ev.unit} ({ev.direction} z={ev.deviation_z})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="border border-black p-3 text-center font-mono text-xs text-zinc-600 bg-[#F2F2F2]">
                    ALL TRANSDUCERS TRACKING WITHIN NOMINAL REGIME.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Transducers (7 cols) */}
          <div className="lg:col-span-7 border-4 border-black bg-white p-6 sm:p-8 space-y-6">
            <div className="border-b-2 border-black pb-3 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest">
              <span>PHYSICAL SENSOR TRANSDUCERS</span>
              <span>TICK: {new Date(latestEvent.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">VIBRATION RMS</span>
                <span className="text-xl font-mono font-black text-[#FF3000]">
                  {latestEvent.telemetry.vibration_rms} <span className="text-xs">mm/s</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">TORQUE</span>
                <span className="text-xl font-mono font-black text-black">
                  {latestEvent.telemetry.torque_nm} <span className="text-xs">Nm</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">SPEED</span>
                <span className="text-xl font-mono font-black text-black">
                  {latestEvent.telemetry.rotational_speed_rpm} <span className="text-xs">RPM</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">ACOUSTICS</span>
                <span className="text-xl font-mono font-black text-black">
                  {latestEvent.telemetry.acoustic_emission_db} <span className="text-xs">dB</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">PROCESS TEMP</span>
                <span className="text-xl font-mono font-black text-black">
                  {latestEvent.telemetry.process_temperature_k} <span className="text-xs">K</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">AIR TEMP</span>
                <span className="text-xl font-mono font-black text-black">
                  {latestEvent.telemetry.air_temperature_k} <span className="text-xs">K</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">TOOL WEAR</span>
                <span className="text-xl font-mono font-black text-black">
                  {latestEvent.telemetry.tool_wear_min} <span className="text-xs">min</span>
                </span>
              </div>

              <div className="border-2 border-black p-3 bg-white">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">SAMPLE FREQ</span>
                <span className="text-xl font-mono font-black text-black">
                  {(1.0 / (1.0 / speed)).toFixed(1)} <span className="text-xs">Hz</span>
                </span>
              </div>
            </div>

            {/* Live Alerts Stream Card */}
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-black font-bold mb-2">
                DYNAMIC INCIDENT GENERATION FEED
              </div>
              <div className="divide-y border-2 border-black max-h-40 overflow-y-auto">
                {liveAlerts.length > 0 ? (
                  liveAlerts.map((alt, i) => (
                    <div
                      key={i}
                      className="p-2.5 font-mono text-xs flex items-center justify-between bg-white text-black hover:bg-[#F2F2F2]"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.2 bg-[#FF3000] text-white font-black text-[10px]">
                          {alt.fault_class}
                        </span>
                        <span className="font-medium text-black truncate max-w-sm">{alt.recommendation}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                        {new Date(alt.detected_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border-black bg-[#F2F2F2] text-center font-mono text-xs text-zinc-600">
                    NO ACTIVE INCIDENTS TRIGGERED IN THIS SAMPLE WINDOW.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Scrolling Telemetry Chart */}
      <div className="border-4 border-black bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b-2 border-black mb-6 gap-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
              04. HIGH-FREQUENCY SIGNALS
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              LIVE SLIDING TELEMETRY RECORDER
            </h3>
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 bg-black text-white">
            POINTS IN MEMORY: {chartData.length}
          </span>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="0 0" stroke="#E5E5E5" />
                <XAxis dataKey="time" stroke="#000000" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis stroke="#000000" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#000000', borderRadius: '0px', color: '#FFFFFF' }}
                  labelStyle={{ color: '#FF3000', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Line type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#FF3000" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="torque" name="Torque (Nm)" stroke="#000000" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="acoustic" name="Acoustic (dB)" stroke="#71717A" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="anomalyScore" name="Anomaly Index (%)" stroke="#FF3000" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-black p-8 text-center bg-[#F2F2F2]">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-black mb-2">
                TELEMETRY RECORDER PAUSED. CLICK START TO INITIATE INGESTION.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Industrial Hardware Adapter Architecture Documentation */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 space-y-4">
        <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
          05. PROTOCOL INTEROPERABILITY
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight text-black">
          INDUSTRIAL HARDWARE ADAPTER ARCHITECTURE
        </h3>
        <p className="text-sm text-black font-medium">
          Decoupled protocol bridge specifications for factory automation integration:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <span className="font-black text-black uppercase block mb-1">MQTT / SPARKPLUG B</span>
            <p className="text-zinc-600 font-sans text-xs">
              Factory broker topic <code>machinasense/telemetry/&#123;id&#125;</code> delivering JSON payloads directly into preprocessing imputer.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <span className="font-black text-black uppercase block mb-1">OPC UA PROTOCOL</span>
            <p className="text-zinc-600 font-sans text-xs">
              PLC tag subscriber (Siemens S7-1500, Beckhoff) polling vibration, thermal, and torque node addresses on 100ms cycle.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <span className="font-black text-black uppercase block mb-1">ESP32 EDGE NODE</span>
            <p className="text-zinc-600 font-sans text-xs">
              RS485 Modbus bridge sampling ADXL345 3-axis accelerometer and MAX6675 thermocouple via lightweight binary frames.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
