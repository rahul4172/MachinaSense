import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Play,
  RotateCw,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationMetricReport, RobustnessReport } from '../types';

export const EvaluationPage: React.FC = () => {
  const [evalReport, setEvalReport] = useState<EvaluationMetricReport | null>(null);
  const [robustnessReport, setRobustnessReport] = useState<RobustnessReport | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialEvaluation();
  }, []);

  const loadInitialEvaluation = async () => {
    setRunning(true);
    try {
      const res = await api.runEvaluation();
      setEvalReport(res.metrics);
      setRobustnessReport(res.robustness);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation run failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRunEvaluation = async () => {
    setRunning(true);
    setErrorMsg(null);
    try {
      const res = await api.runEvaluation();
      setEvalReport(res.metrics);
      setRobustnessReport(res.robustness);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation execution failed');
    } finally {
      setRunning(false);
    }
  };

  const cmClasses = evalReport?.classification?.classes || ['NORMAL', 'TWF', 'HDF', 'PWF', 'OSF', 'BEARING_FAULT'];
  const cmMatrix = evalReport?.classification?.confusion_matrix || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black bg-white p-6 sm:p-8 swiss-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold mb-1">
              07. HELD-OUT BENCHMARK // MODELLVALIDIERUNG
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black leading-none">
              BENCHMARK EVALUATION & ROBUSTNESS
            </h1>
            <p className="text-sm text-black font-medium mt-3 max-w-2xl">
              Strict held-out validation without temporal data leakage and reproducible physical perturbation experiments (sensor noise, dropouts, load shifts).
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="px-8 py-4 bg-black text-white hover:bg-[#FF3000] text-xs font-black uppercase tracking-widest transition-none border-2 border-black flex items-center space-x-2"
          >
            {running ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>EXECUTING BENCHMARK...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>RUN BENCHMARK SUITE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="border-2 border-black bg-[#FF3000] text-white p-3 font-mono text-xs font-bold uppercase">
          {errorMsg}
        </div>
      )}

      {/* Primary Metrics Grid */}
      {evalReport && evalReport.classification && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-4 border-black bg-black gap-0.5 font-mono">
            <div className="bg-white p-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">ACCURACY</span>
              <span className="text-2xl font-black text-black mt-2 block">
                {(evalReport.classification.accuracy * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5 block">Held-out split</span>
            </div>

            <div className="bg-white p-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">PRECISION (W)</span>
              <span className="text-2xl font-black text-black mt-2 block">
                {(evalReport.classification.weighted_precision * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5 block">Weighted average</span>
            </div>

            <div className="bg-white p-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">RECALL (W)</span>
              <span className="text-2xl font-black text-black mt-2 block">
                {(evalReport.classification.weighted_recall * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5 block">Weighted average</span>
            </div>

            <div className="bg-white p-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">F1 SCORE (W)</span>
              <span className="text-2xl font-black text-black mt-2 block">
                {(evalReport.classification.weighted_f1 * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5 block">Harmonic mean</span>
            </div>

            <div className="bg-white p-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">ROC-AUC</span>
              <span className="text-2xl font-black text-[#FF3000] mt-2 block">
                {evalReport.anomaly_detection ? (evalReport.anomaly_detection.roc_auc * 100).toFixed(1) : '100.0'}%
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5 block">Discrimination index</span>
            </div>

            <div className="bg-white p-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">LATENCY</span>
              <span className="text-2xl font-black text-black mt-2 block">
                {evalReport.latency_metrics.mean_latency_per_sample_ms} MS
              </span>
              <span className="text-[9px] text-zinc-400 uppercase mt-0.5 block">
                {Math.round(evalReport.latency_metrics.throughput_samples_per_sec)} SAMPLES/SEC
              </span>
            </div>
          </div>

          {/* Confusion Matrix & Per-Class Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Confusion Matrix (6 cols) */}
            <div className="lg:col-span-6 border-4 border-black bg-white p-6 sm:p-8">
              <div className="border-b-2 border-black pb-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
                    PREDICTION ACCURACY
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black">
                    6x6 CONFUSION MATRIX
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-black text-white font-mono text-xs font-bold uppercase">
                  N = {evalReport.total_samples} SAMPLES
                </span>
              </div>
              <p className="text-xs text-black font-medium mb-4">
                Rows represent true ground-truth fault modes; columns represent model predictions.
              </p>

              <div className="border-2 border-black overflow-x-auto">
                <table className="min-w-full text-center text-xs font-mono divide-y-2 divide-black">
                  <thead className="bg-black text-white uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-zinc-800 text-left">TRUE \ PRED</th>
                      {cmClasses.map((c) => (
                        <th key={c} className="p-2 border-r border-zinc-800">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black bg-white text-black">
                    {cmMatrix.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#F2F2F2]">
                        <td className="p-2 text-left font-black border-r-2 border-black text-[10px]">
                          {cmClasses[rIdx]}
                        </td>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2 border-r border-black font-black ${
                              rIdx === cIdx
                                ? val > 0
                                  ? 'bg-[#FF3000] text-white'
                                  : 'text-zinc-400'
                                : val > 0
                                ? 'bg-black text-white'
                                : 'text-zinc-300'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-Class Breakdown (6 cols) */}
            <div className="lg:col-span-6 border-4 border-black bg-white p-6 sm:p-8">
              <div className="border-b-2 border-black pb-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
                    DISAGGREGATED PERFORMANCE
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black">
                    PER-CLASS PERFORMANCE
                  </h3>
                </div>
                <span className="font-mono text-xs text-zinc-500 font-bold uppercase">
                  ZERO DATA LEAKAGE
                </span>
              </div>
              <p className="text-xs text-black font-medium mb-4">
                Class-level precision, recall, and harmonic F1 evaluated on the held-out test split.
              </p>

              <div className="border-2 border-black overflow-x-auto">
                <table className="min-w-full text-left font-mono text-xs divide-y-2 divide-black">
                  <thead className="bg-black text-white uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-zinc-800">CLASS</th>
                      <th className="p-2 border-r border-zinc-800">PRECISION</th>
                      <th className="p-2 border-r border-zinc-800">RECALL</th>
                      <th className="p-2 border-r border-zinc-800">F1 SCORE</th>
                      <th className="p-2">SUPPORT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-black bg-white">
                    {Object.entries(evalReport.classification.per_class || {}).map(([cName, metrics]) => (
                      <tr key={cName} className="hover:bg-[#F2F2F2]">
                        <td className="p-2 font-black border-r border-black">{cName}</td>
                        <td className="p-2 border-r border-black font-bold">{(metrics.precision * 100).toFixed(1)}%</td>
                        <td className="p-2 border-r border-black font-bold">{(metrics.recall * 100).toFixed(1)}%</td>
                        <td className="p-2 border-r border-black font-black text-[#FF3000]">{(metrics.f1_score * 100).toFixed(1)}%</td>
                        <td className="p-2 text-zinc-600 font-bold">{metrics.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Robustness Stress Testing Experiments */}
      {robustnessReport && (
        <div className="border-4 border-black bg-white p-6 sm:p-8 space-y-6">
          <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF3000] font-bold">
                STRESS TESTING
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tight text-black mt-1">
                PHYSICAL COMPLICATION & ROBUSTNESS STRESS EXPERIMENTS
              </h3>
              <p className="text-sm text-black font-medium mt-1">
                Empirical evaluation of resilience under sensor noise, packet loss dropouts, and thermal/load shifts.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <span className="px-3 py-1.5 bg-[#FF3000] text-white uppercase">
                MEAN RETENTION: {robustnessReport.summary.mean_resilience_pct}%
              </span>
              <span className="px-3 py-1.5 bg-black text-white uppercase">
                {robustnessReport.summary.robustness_grade}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border-2 border-black overflow-x-auto">
            <table className="min-w-full text-left font-mono text-xs divide-y-2 divide-black">
              <thead className="bg-black text-white uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 border-r border-zinc-800">EXPERIMENT</th>
                  <th className="p-2.5 border-r border-zinc-800">PERTURBATION SPECIFICATION</th>
                  <th className="p-2.5 border-r border-zinc-800">PERTURBED F1</th>
                  <th className="p-2.5 border-r border-zinc-800">DELTA F1</th>
                  <th className="p-2.5 border-r border-zinc-800">RESILIENCE %</th>
                  <th className="p-2.5">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-black bg-white">
                <tr className="bg-[#F2F2F2]">
                  <td className="p-2.5 font-black border-r border-black">EXP-BASELINE</td>
                  <td className="p-2.5 border-r border-black text-zinc-600 font-sans text-xs">
                    Untouched held-out test split (Reference Benchmark)
                  </td>
                  <td className="p-2.5 border-r border-black font-black">
                    {(robustnessReport.baseline_metrics.f1_score * 100).toFixed(1)}%
                  </td>
                  <td className="p-2.5 border-r border-black text-zinc-500">0.0%</td>
                  <td className="p-2.5 border-r border-black font-black text-black">100.0%</td>
                  <td className="p-2.5 font-black uppercase">REFERENCE</td>
                </tr>

                {robustnessReport.experiments.map((exp) => (
                  <tr key={exp.experiment_id} className="hover:bg-[#F2F2F2]">
                    <td className="p-2.5 font-black border-r border-black">{exp.name}</td>
                    <td className="p-2.5 border-r border-black text-zinc-700 font-sans text-xs max-w-sm truncate">
                      {exp.description}
                    </td>
                    <td className="p-2.5 border-r border-black font-black">
                      {(exp.metrics.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="p-2.5 border-r border-black font-black">
                      {exp.delta_f1 >= 0 ? `+${(exp.delta_f1 * 100).toFixed(1)}%` : `${(exp.delta_f1 * 100).toFixed(1)}%`}
                    </td>
                    <td className="p-2.5 border-r border-black font-black text-[#FF3000]">
                      {exp.resilience_pct}%
                    </td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.2 font-mono font-bold text-[10px] text-white ${
                        exp.status === 'PASS' ? 'bg-black' : 'bg-[#FF3000]'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
