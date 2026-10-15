import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Layers,
  Zap,
  ShieldCheck,
  Server,
  Terminal,
  TrendingDown,
  RefreshCw,
  Send
} from 'lucide-react';
import { api } from '../services/api';

export const EdgeAndDriftPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'edge' | 'drift' | 'microcontroller'>('edge');
  
  // Edge Benchmark State
  const [benchmarking, setBenchmarking] = useState<boolean>(false);
  const [edgeData, setEdgeData] = useState<any>(null);

  // Drift State
  const [loadingDrift, setLoadingDrift] = useState<boolean>(false);
  const [driftPreset, setDriftPreset] = useState<string>('test_heldout.csv');
  const [driftData, setDriftData] = useState<any>(null);

  // Microcontroller Push Simulator State
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<any>(null);
  const [telemetryPayload, setTelemetryPayload] = useState({
    machine_id: 'ESP32-CELL-01',
    air_temperature_k: 298.2,
    process_temperature_k: 308.8,
    rotational_speed_rpm: 1510.0,
    torque_nm: 41.5,
    tool_wear_min: 105.0,
    vibration_rms: 1.42,
    acoustic_emission_db: 49.0
  });

  useEffect(() => {
    runBenchmark();
    runDriftAnalysis('test_heldout.csv');
  }, []);

  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await api.getEdgeBenchmark(25);
      setEdgeData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBenchmarking(false);
    }
  };

  const runDriftAnalysis = async (preset: string) => {
    setLoadingDrift(true);
    setDriftPreset(preset);
    try {
      const res = await api.getDriftStatus(preset);
      setDriftData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrift(false);
    }
  };

  const handlePushTelemetry = async () => {
    setPushing(true);
    try {
      const res = await api.pushMicrocontrollerTelemetry(telemetryPayload as any);
      setPushResult(res);
    } catch (e: any) {
      alert('Push failed: ' + e.message);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-black">
      {/* 01. Swiss Section Header */}
      <section className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-mono text-xs font-bold tracking-widest text-[#FF3000] uppercase">
                09 / EDGE & COVARIATE AUDIT
              </span>
              <span className="h-2 w-2 bg-[#FF3000]"></span>
              <span className="font-mono text-xs tracking-wider text-black/60 uppercase">
                CONSTRAINED COMPUTING & DISTRIBUTION SHIFT
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
              EDGE EFFICIENCY & SENSOR DRIFT
            </h1>
            <p className="mt-3 text-sm text-black font-medium max-w-2xl font-mono uppercase tracking-tight">
              Sub-millisecond inference profiles, zero-cloud edge readiness (ARM Cortex / Jetson), and Kolmogorov-Smirnov drift detection.
            </p>
          </div>

          {/* Subtabs */}
          <div className="flex border-2 border-black divide-x-2 divide-black self-start md:self-auto font-mono text-xs font-black uppercase">
            <button
              onClick={() => setActiveSubTab('edge')}
              className={`px-4 py-2 transition-none ${
                activeSubTab === 'edge' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
              }`}
            >
              EDGE BENCHMARK
            </button>
            <button
              onClick={() => setActiveSubTab('drift')}
              className={`px-4 py-2 transition-none ${
                activeSubTab === 'drift' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
              }`}
            >
              DRIFT DETECTOR
            </button>
            <button
              onClick={() => setActiveSubTab('microcontroller')}
              className={`px-4 py-2 transition-none ${
                activeSubTab === 'microcontroller' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
              }`}
            >
              MCU WEBHOOK
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* TAB 1: EDGE COMPUTING & RESOURCE PROFILE */}
      {/* ============================================================== */}
      {activeSubTab === 'edge' && (
        <div className="space-y-8">
          {/* Asymmetrical 4-Stat Metric Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-4 border-black bg-white">
            <div className="p-6 border-b-2 sm:border-b-0 sm:border-r-2 border-black bg-white">
              <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
                MEDIAN LATENCY (p50)
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tighter text-black">
                {edgeData ? edgeData.latency_p50_ms : '...'} <span className="text-lg font-mono text-black/60">MS</span>
              </div>
              <div className="mt-2 text-[11px] font-mono uppercase text-[#FF3000] font-bold">
                ▲ SUB-100MS HARD REAL-TIME TARGET
              </div>
            </div>

            <div className="p-6 border-b-2 sm:border-b-0 lg:border-r-2 border-black bg-[#F2F2F2]">
              <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
                BATCH THROUGHPUT
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tighter text-[#FF3000]">
                {edgeData ? edgeData.throughput_samples_per_sec : '...'} <span className="text-lg font-mono text-black/60">SAMPLES/S</span>
              </div>
              <div className="mt-2 text-[11px] font-mono uppercase text-black/70">
                VECTORIZED PIPELINE EVALUATION
              </div>
            </div>

            <div className="p-6 border-b-2 sm:border-b-0 sm:border-r-2 border-black bg-white">
              <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
                PROCESS MEMORY (RSS)
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tighter text-black">
                {edgeData ? edgeData.memory_ram_mb : '...'} <span className="text-lg font-mono text-black/60">MB</span>
              </div>
              <div className="mt-2 text-[11px] font-mono uppercase text-black/70">
                FITS COMFORTABLY IN 512MB RAM
              </div>
            </div>

            <div className="p-6 bg-[#F2F2F2]">
              <div className="font-mono text-xs uppercase tracking-widest text-black/60 mb-2">
                MODEL DISK FOOTPRINT
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tighter text-black">
                {edgeData ? edgeData.total_model_disk_size_kb : '...'} <span className="text-lg font-mono text-black/60">KB</span>
              </div>
              <div className="mt-2 text-[11px] font-mono uppercase text-[#FF3000] font-bold">
                TOTAL PACKAGE &lt; 3.5 MB
              </div>
            </div>
          </section>

          {/* Action Header & Hardware Profiles */}
          <section className="border-4 border-black bg-white">
            <div className="p-6 border-b-4 border-black bg-[#F2F2F2] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000]">
                  <span>[SPEC 09.1]</span>
                  <span>HARDWARE SUITABILITY MATRIX</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight mt-1">
                  OFFLINE INDUSTRIAL EDGE DEPLOYMENT FEASIBILITY
                </h2>
                <p className="text-xs font-mono text-black/70 mt-1 uppercase">
                  Auditing inference feasibility on constrained shop-floor computing hardware without external cloud access.
                </p>
              </div>

              <button
                onClick={runBenchmark}
                disabled={benchmarking}
                className="border-2 border-black bg-black text-white hover:bg-[#FF3000] px-4 py-2 font-mono text-xs font-black uppercase flex items-center space-x-2 self-start md:self-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${benchmarking ? 'animate-spin' : ''}`} />
                <span>{benchmarking ? 'BENCHMARKING...' : 'RE-RUN CPU PROFILER'}</span>
              </button>
            </div>

            {/* Hardware Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {edgeData?.edge_suitability && Object.entries(edgeData.edge_suitability).map(([key, item]: [string, any]) => (
                <div key={key} className="border-2 border-black p-5 flex flex-col justify-between bg-white hover:bg-[#F2F2F2] transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-black uppercase text-[#FF3000]">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="border border-black bg-black text-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                        {item.feasibility}
                      </span>
                    </div>

                    <h3 className="font-black text-base uppercase tracking-tight mb-2">
                      {key.includes('pi') ? 'Raspberry Pi 4' : key.includes('jetson') ? 'NVIDIA Jetson Nano' : key.includes('siemens') ? 'Siemens Industrial IPC' : 'ESP32 Microcontroller'}
                    </h3>

                    <div className="space-y-1.5 font-mono text-xs text-black/80">
                      <div><strong className="text-black">CHIP:</strong> {item.hardware}</div>
                      {item.recommended_ram && <div><strong className="text-black">RAM:</strong> {item.recommended_ram}</div>}
                      {item.estimated_latency_ms && <div><strong className="text-black">LATENCY:</strong> ~{item.estimated_latency_ms} ms</div>}
                      {item.power_draw_watts && <div><strong className="text-black">POWER:</strong> ~{item.power_draw_watts} W</div>}
                    </div>

                    <p className="mt-3 text-[11px] font-mono text-zinc-600 uppercase border-t border-black/20 pt-2">
                      {item.notes}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-black text-[10px] font-mono font-black uppercase text-black">
                    DEPLOYMENT READY: 100% OFFLINE
                  </div>
                </div>
              ))}
            </div>

            {/* Artifact Serialization Table */}
            <div className="border-t-4 border-black p-6 bg-white">
              <div className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3000] mb-3">
                SERIALIZED ARTIFACT DISK FOOTPRINT (STORAGE CONSTRAINTS)
              </div>
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-black text-white uppercase tracking-wider">
                    <tr>
                      <th className="p-3">ARTIFACT FILENAME</th>
                      <th className="p-3">ROLE / MODEL CLASS</th>
                      <th className="p-3">SERIALIZED FORMAT</th>
                      <th className="p-3 text-right">SIZE (KB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-t border-black divide-black">
                    {edgeData?.models_breakdown_kb && Object.entries(edgeData.models_breakdown_kb).map(([file, size]: [string, any]) => (
                      <tr key={file} className="hover:bg-[#F2F2F2]">
                        <td className="p-3 font-bold text-black">{file}</td>
                        <td className="p-3 text-black/70">
                          {file.includes('classifier') ? 'Multi-Class Gradient Boosting' : file.includes('anomaly') ? 'Isolation Forest' : file.includes('rul') ? 'Random Forest Regressor' : file.includes('scaler') ? 'StandardScaler (Zero Leakage)' : 'Feature Metadata & Gini Importances'}
                        </td>
                        <td className="p-3 font-semibold uppercase text-black/60">Scikit-learn Joblib</td>
                        <td className="p-3 font-black text-right text-[#FF3000]">{size} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: COVARIATE & SENSOR DRIFT DETECTION */}
      {/* ============================================================== */}
      {activeSubTab === 'drift' && (
        <div className="space-y-8">
          <section className="border-4 border-black bg-white">
            <div className="p-6 border-b-4 border-black bg-[#F2F2F2] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000]">
                  <span>[ANALYSIS 09.2]</span>
                  <span>COVARIATE DRIFT STATISTICAL AUDIT</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight mt-1">
                  KOLMOGOROV-SMIRNOV & POPULATION STABILITY INDEX (PSI)
                </h2>
                <p className="text-xs font-mono text-black/70 mt-1 uppercase">
                  Comparing incoming production sensor distributions against the baseline training distribution (train.csv).
                </p>
              </div>

              {/* Dataset preset selector */}
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="font-bold uppercase text-black">TEST SCENARIO:</span>
                <select
                  value={driftPreset}
                  onChange={(e) => runDriftAnalysis(e.target.value)}
                  disabled={loadingDrift}
                  className="border-2 border-black p-2 bg-white font-bold uppercase focus:outline-none"
                >
                  <option value="test_heldout.csv">TEST HELDOUT (CLEAN)</option>
                  <option value="sample_noisy.csv">SAMPLE NOISY (SENSOR DISTORTION)</option>
                  <option value="sample_mixed_operational.csv">MIXED OPERATIONAL (STRESS CYCLE)</option>
                </select>
              </div>
            </div>

            {/* Overall Verdict Banner */}
            {driftData && (
              <div className="p-6 border-b-4 border-black bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-4 border-2 border-black font-mono text-xl font-black uppercase ${
                    driftData.overall_status === 'HEALTHY' ? 'bg-black text-white' : 'bg-[#FF3000] text-white'
                  }`}>
                    {driftData.overall_status}
                  </div>
                  <div>
                    <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
                      DRIFT AUDIT VERDICT: {driftData.drifted_channels_count} CHANNELS DRIFTED
                    </div>
                    <p className="font-mono text-xs text-black/70 uppercase mt-0.5 max-w-2xl">
                      {driftData.recommendation}
                    </p>
                  </div>
                </div>

                <div className="border-2 border-black bg-[#F2F2F2] p-3 text-right font-mono text-xs uppercase self-stretch md:self-auto">
                  <div className="text-[10px] text-black/60 font-bold">RECORDS EVALUATED</div>
                  <div className="text-2xl font-black text-black">{driftData.total_records_evaluated} SAMPLES</div>
                </div>
              </div>
            )}

            {/* Per-Channel Table */}
            <div className="p-6">
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-black text-white uppercase tracking-wider">
                    <tr>
                      <th className="p-3">TRANSDUCER CHANNEL</th>
                      <th className="p-3">KS STATISTIC (D)</th>
                      <th className="p-3">p-VALUE</th>
                      <th className="p-3">PSI (POPULATION STABILITY)</th>
                      <th className="p-3">BASELINE MEAN ± STD</th>
                      <th className="p-3">CURRENT MEAN ± STD</th>
                      <th className="p-3">SEVERITY</th>
                      <th className="p-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-t border-black divide-black">
                    {driftData?.channels && Object.values(driftData.channels).map((ch: any) => (
                      <tr key={ch.channel} className="hover:bg-[#F2F2F2]">
                        <td className="p-3 font-black text-black uppercase">{ch.channel.replace(/_/g, ' ')}</td>
                        <td className="p-3 font-bold">{ch.ks_statistic}</td>
                        <td className="p-3 text-black/70">{ch.p_value}</td>
                        <td className="p-3 font-bold text-black">{ch.psi}</td>
                        <td className="p-3 text-black/60">{ch.baseline_mean} ± {ch.baseline_std}</td>
                        <td className="p-3 text-black/80">{ch.current_mean} ± {ch.current_std}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 border text-[10px] font-black uppercase ${
                            ch.drift_severity === 'SIGNIFICANT' ? 'bg-[#FF3000] text-white border-black' : ch.drift_severity === 'MODERATE' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'
                          }`}>
                            {ch.drift_severity}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-black uppercase ${ch.is_drifted ? 'text-[#FF3000]' : 'text-black'}`}>
                            {ch.is_drifted ? 'DRIFT DETECTED' : 'NOMINAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MICROCONTROLLER / EDGE WEBHOOK PUSH SIMULATOR */}
      {/* ============================================================== */}
      {activeSubTab === 'microcontroller' && (
        <div className="space-y-8">
          <section className="border-4 border-black bg-white">
            <div className="p-6 border-b-4 border-black bg-[#F2F2F2]">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#FF3000]">
                <span>[GATEWAY 09.3]</span>
                <span>PHYSICAL MICROCONTROLLER & EDGE PUSH API</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mt-1">
                ESP32 / ARDUINO DIRECT TELEMETRY INGESTION
              </h2>
              <p className="text-xs font-mono text-black/70 mt-1 uppercase">
                Simulate an external microcontroller posting raw sensor ADC readings directly to POST /api/telemetry/push for sub-millisecond edge classification.
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Telemetry Input Deck */}
              <div className="space-y-4">
                <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
                  EDIT TRANSDUCER INPUT PAYLOAD (JSON)
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">MACHINE ID</label>
                    <input
                      type="text"
                      value={telemetryPayload.machine_id}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, machine_id: e.target.value })}
                      className="w-full border-2 border-black p-2 bg-white font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">AIR TEMP (K)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={telemetryPayload.air_temperature_k}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, air_temperature_k: parseFloat(e.target.value) || 298.15 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">PROCESS TEMP (K)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={telemetryPayload.process_temperature_k}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, process_temperature_k: parseFloat(e.target.value) || 308.35 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">ROTATIONAL SPEED (RPM)</label>
                    <input
                      type="number"
                      step="10"
                      value={telemetryPayload.rotational_speed_rpm}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, rotational_speed_rpm: parseFloat(e.target.value) || 1500 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">TORQUE (NM)</label>
                    <input
                      type="number"
                      step="1"
                      value={telemetryPayload.torque_nm}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, torque_nm: parseFloat(e.target.value) || 40 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">TOOL WEAR (MIN)</label>
                    <input
                      type="number"
                      step="5"
                      value={telemetryPayload.tool_wear_min}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, tool_wear_min: parseFloat(e.target.value) || 100 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">VIBRATION RMS (MM/S)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={telemetryPayload.vibration_rms}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, vibration_rms: parseFloat(e.target.value) || 1.35 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] mb-1">ACOUSTIC EMISSION (DB)</label>
                    <input
                      type="number"
                      step="1"
                      value={telemetryPayload.acoustic_emission_db}
                      onChange={(e) => setTelemetryPayload({ ...telemetryPayload, acoustic_emission_db: parseFloat(e.target.value) || 48 })}
                      className="w-full border-2 border-black p-2 bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handlePushTelemetry}
                    disabled={pushing}
                    className="border-2 border-black bg-[#FF3000] text-white hover:bg-black px-6 py-2.5 font-mono text-xs font-black uppercase flex items-center space-x-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{pushing ? 'TRANSMITTING...' : 'POST TELEMETRY TO INGESTION ENDPOINT'}</span>
                  </button>

                  <button
                    onClick={() => {
                      // Inject bearing fault
                      setTelemetryPayload({
                        machine_id: 'ESP32-CELL-01',
                        air_temperature_k: 298.5,
                        process_temperature_k: 309.2,
                        rotational_speed_rpm: 1480.0,
                        torque_nm: 44.0,
                        tool_wear_min: 120.0,
                        vibration_rms: 4.8,
                        acoustic_emission_db: 78.0
                      });
                    }}
                    className="border-2 border-black bg-white text-black hover:bg-[#F2F2F2] px-3 py-2.5 font-mono text-xs font-black uppercase"
                  >
                    PRESET: INJECT BEARING STRESS
                  </button>
                </div>
              </div>

              {/* Edge Response Card */}
              <div className="border-4 border-black p-6 bg-[#F2F2F2] flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs font-black uppercase tracking-widest text-[#FF3000] mb-2 flex items-center justify-between">
                    <span>MICROSECOND EDGE DIAGNOSIS RESPONSE</span>
                    <span className="border border-black bg-white px-2 py-0.5 text-[9px] uppercase">
                      HTTP 200 OK
                    </span>
                  </div>

                  {pushResult ? (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="border-2 border-black bg-white p-4">
                        <div className="text-[10px] text-zinc-500 uppercase">CLASSIFIED FAULT STATE</div>
                        <div className="text-3xl font-black text-black uppercase mt-1">
                          {pushResult.fault_class}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            pushResult.severity === 'CRITICAL' ? 'bg-[#FF3000] text-white' : pushResult.severity === 'HIGH' ? 'bg-black text-white' : 'border border-black bg-white text-black'
                          }`}>
                            {pushResult.severity}
                          </span>
                          <span className="text-[11px] font-bold text-black/70">
                            ANOMALY SCORE: {(pushResult.anomaly_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="border-2 border-black bg-white p-3">
                          <div className="text-[10px] text-zinc-500 uppercase">REMAINING USEFUL LIFE</div>
                          <div className="text-xl font-black text-black mt-0.5">
                            {pushResult.predicted_rul_cycles} CYCLES
                          </div>
                        </div>

                        <div className="border-2 border-black bg-white p-3">
                          <div className="text-[10px] text-zinc-500 uppercase">CALIBRATED TIME-TO-INSPECTION</div>
                          <div className="text-xl font-black text-[#FF3000] mt-0.5">
                            {pushResult.calibrated_time_to_inspection_hours} HRS
                          </div>
                        </div>
                      </div>

                      <div className="border-2 border-black bg-white p-3">
                        <div className="text-[10px] text-zinc-500 uppercase">AUTOMATED WORK ORDER DISPATCH</div>
                        <div className="font-bold text-black mt-0.5">
                          {pushResult.alert_created ? (
                            <span className="text-[#FF3000] font-black">
                              ALERT DISPATCHED: {pushResult.alert_id}
                            </span>
                          ) : (
                            <span className="text-black/70 font-semibold">
                              NOMINAL REGIME — NO DISPATCH TRIGGERED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-600 uppercase mt-1">
                          {pushResult.action_recommendation}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-black bg-white text-center font-mono text-xs text-zinc-500 uppercase">
                      POST TELEMETRY TO WITNESS EDGE DIAGNOSIS & REMAINING USEFUL LIFE CALCULATION.
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t-2 border-black font-mono text-[10px] uppercase text-zinc-500">
                  ENDPOINT: POST /api/telemetry/push • COMPATIBLE WITH ESP-IDF, ARDUINOJSON, AND MICROPYTHON
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
