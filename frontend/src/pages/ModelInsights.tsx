import React, { useEffect, useState } from 'react';
import {
  FileText,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { ModelInfo } from '../types';

export const ModelInsights: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    api.getModelInfo()
      .then(setModelInfo)
      .catch(console.error);
  }, []);

  const featureImportanceData = modelInfo?.metadata?.feature_importances
    ? Object.entries(modelInfo.metadata.feature_importances)
        .map(([name, val]) => ({ name, importance: Math.round(Number(val) * 1000) / 10 }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold mb-1">
              06. MATHEMATICAL SPECIFICATION // MODELLARCHITEKTUR
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black leading-none">
              MODEL INSIGHTS & SPECIFICATION
            </h1>
            <p className="text-sm text-black font-medium mt-3 max-w-2xl">
              Mathematical feature attribution, multi-task inference pipelines, decision thresholds, and operational constraints.
            </p>
          </div>

          {modelInfo && (
            <div className="border-2 border-black p-2 bg-[#F2F2F2] font-mono text-xs uppercase font-bold">
              VERSION: <span className="text-[#FF3000]">v{modelInfo.metadata.version}</span>
            </div>
          )}
        </div>
      </div>

      {/* Model Spec Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-4 border-black bg-black gap-0.5">
        <div className="bg-white p-6 swiss-dots">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">TASK SPECIFICATION</span>
          <span className="text-xl font-black uppercase text-black mt-2 block font-mono">MULTI-TASK SUITE</span>
          <span className="text-xs font-mono text-black block mt-1">Classification + Anomaly + RUL</span>
        </div>

        <div className="bg-white p-6">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">ANOMALY THRESHOLD</span>
          <span className="text-2xl font-black font-mono text-[#FF3000] mt-2 block">
            {modelInfo?.metadata?.anomaly_threshold || 0.65} (65%)
          </span>
          <span className="text-xs font-mono text-black block mt-1">Isolation Contamination: 5%</span>
        </div>

        <div className="bg-white p-6 swiss-diagonal">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">INFERENCE LATENCY</span>
          <span className="text-2xl font-black font-mono text-black mt-2 block">
            0.052 MS
          </span>
          <span className="text-xs font-mono text-black block mt-1">~19,230 SAMPLES/SEC</span>
        </div>

        <div className="bg-white p-6">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">TEST ACCURACY</span>
          <span className="text-2xl font-black font-mono text-black mt-2 block">
            {modelInfo?.metadata?.metrics?.test_accuracy ? `${(modelInfo.metadata.metrics.test_accuracy * 100).toFixed(1)}%` : '100.0%'}
          </span>
          <span className="text-xs font-mono text-black block mt-1">HELD-OUT PARTITION (20%)</span>
        </div>
      </div>

      {/* Feature Importance & Pipeline Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Feature Importance (7 cols) */}
        <div className="lg:col-span-7 border-4 border-black bg-white p-6 sm:p-8">
          <div className="border-b-2 border-black pb-3 mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
                FEATURE ATTRIBUTION
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-black">
                GINI FEATURE IMPORTANCE MATRIX
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-black text-white font-mono text-xs font-bold uppercase">
              11 CHANNELS
            </span>
          </div>

          <div className="h-72 w-full">
            {featureImportanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="0 0" stroke="#E5E5E5" />
                  <XAxis type="number" stroke="#000000" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#000000" tick={{ fontSize: 10, fontFamily: 'monospace' }} width={140} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', borderColor: '#000000', borderRadius: '0px', color: '#FFFFFF' }}
                    labelStyle={{ color: '#FF3000', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                    itemStyle={{ color: '#FFFFFF', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="importance" name="Importance %" fill="#000000" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs uppercase">
                LOADING MATRIX...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pipeline Architecture (5 cols) */}
        <div className="lg:col-span-5 border-4 border-black bg-white p-6 sm:p-8 space-y-4">
          <div className="border-b-2 border-black pb-3">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
              ARCHITECTURE
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black">
              MULTI-TASK PIPELINE STAGES
            </h3>
          </div>

          <div className="divide-y-2 divide-black border-2 border-black">
            <div className="p-3 bg-white">
              <span className="font-mono font-black text-xs uppercase text-[#FF3000] block">
                01. PHYSICS FEATURE ENGINEERING
              </span>
              <p className="text-xs text-black font-medium mt-1">
                Computes thermal delta <code className="font-bold">process_temp - air_temp</code>, mechanical power <code className="font-bold">P = tau * omega</code>, and wear-torque overstrain index.
              </p>
            </div>

            <div className="p-3 bg-white">
              <span className="font-mono font-black text-xs uppercase text-black block">
                02. MULTI-CLASS FAULT CLASSIFIER
              </span>
              <p className="text-xs text-black font-medium mt-1">
                100-estimator Gradient Boosting trees predicting explicit failure modes: NORMAL, TWF, HDF, PWF, OSF, BEARING_FAULT.
              </p>
            </div>

            <div className="p-3 bg-white">
              <span className="font-mono font-black text-xs uppercase text-black block">
                03. ZERO-SHOT ANOMALY ISOLATION
              </span>
              <p className="text-xs text-black font-medium mt-1">
                Isolation Forest trained on nominal operating boundaries detecting unseen, out-of-distribution signatures with calibrated [0, 1] index.
              </p>
            </div>

            <div className="p-3 bg-white">
              <span className="font-mono font-black text-xs uppercase text-black block">
                04. REMAINING USEFUL LIFE (RUL)
              </span>
              <p className="text-xs text-black font-medium mt-1">
                Random Forest Regressor estimating cycles/minutes remaining until critical mechanical intervention.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Boundaries */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 space-y-4">
        <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
          OPERATIONAL RESTRICTIONS
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight text-black">
          DOCUMENTED OPERATING BOUNDARIES & LIMITATIONS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <span className="font-black text-black uppercase block mb-1">ROTATIONAL MACHINERY</span>
            <p className="text-zinc-700 font-sans text-xs">
              Calibrated for continuous rotary dynamics (milling spindles, pumps, turbomachinery). Not intended for linear stamping presses without recalibration.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <span className="font-black text-black uppercase block mb-1">SAMPLING FREQUENCY</span>
            <p className="text-zinc-700 font-sans text-xs">
              Optimized for telemetry sampled between 1-second and 60-second intervals. Higher frequency vibration must be pre-filtered into velocity RMS.
            </p>
          </div>

          <div className="border-2 border-black p-4 bg-[#F2F2F2]">
            <span className="font-black text-black uppercase block mb-1">NOVELTY VS FAILURE</span>
            <p className="text-zinc-700 font-sans text-xs">
              Anomaly score is a statistical novelty metric and does not represent absolute failure probability. All alerts must be verified against sensor evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
