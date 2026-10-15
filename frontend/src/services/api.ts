import {
  Machine,
  Alert,
  AlertSummary,
  PredictionResult,
  EvaluationMetricReport,
  RobustnessReport,
  ModelInfo,
  SensorReading
} from '../types';

let rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
if (rawBase && !rawBase.endsWith('/api') && rawBase.startsWith('http')) {
  rawBase = `${rawBase}/api`;
}
const API_BASE = rawBase;

export const api = {
  // Health & Model
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  getModelInfo: async (): Promise<ModelInfo> => {
    const res = await fetch(`${API_BASE}/model/info`);
    if (!res.ok) throw new Error('Failed to fetch model info');
    return res.json();
  },

  // Machines
  getMachines: async (status?: string, category?: string, search?: string): Promise<Machine[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/machines?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch machines');
    return res.json();
  },

  getMachineDetail: async (id: string) => {
    const res = await fetch(`${API_BASE}/machines/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch machine ${id}`);
    return res.json();
  },

  // Alerts
  getAlerts: async (severity?: string, status?: string, machineId?: string): Promise<Alert[]> => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    if (machineId) params.append('machine_id', machineId);

    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  getAlertSummary: async (): Promise<AlertSummary> => {
    const res = await fetch(`${API_BASE}/alerts/summary`);
    if (!res.ok) throw new Error('Failed to fetch alert summary');
    return res.json();
  },

  updateAlertStatus: async (alertId: string, status: string, notes?: string): Promise<Alert> => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution_notes: notes })
    });
    if (!res.ok) throw new Error('Failed to update alert status');
    return res.json();
  },

  // Datasets & Ingestion
  uploadDataset: async (file: File, runInference: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/datasets/upload?run_inference=${runInference}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  getDataset: async (id: string) => {
    const res = await fetch(`${API_BASE}/datasets/${id}`);
    if (!res.ok) throw new Error('Failed to fetch dataset');
    return res.json();
  },

  // Inference
  predictSingle: async (reading: SensorReading & { machine_id: string }): Promise<PredictionResult> => {
    const res = await fetch(`${API_BASE}/inference/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading)
    });
    if (!res.ok) throw new Error('Prediction failed');
    return res.json();
  },

  getInferenceHistory: async () => {
    const res = await fetch(`${API_BASE}/inference/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  // Simulation
  getSimulationStatus: async () => {
    const res = await fetch(`${API_BASE}/simulation/status`);
    if (!res.ok) throw new Error('Failed to fetch simulation status');
    return res.json();
  },

  startSimulation: async (speed: number = 1.0, scenario: string = 'RANDOM', machineId: string = 'MCH-CNC-001') => {
    const res = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', playback_speed: speed, fault_scenario: scenario, machine_id: machineId })
    });
    if (!res.ok) throw new Error('Failed to start simulation');
    return res.json();
  },

  pauseSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },

  resumeSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/resume`, { method: 'POST' });
    return res.json();
  },

  stopSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
    return res.json();
  },

  // Evaluations & Robustness
  runEvaluation: async (datasetPath?: string, sampleLimit?: number): Promise<{ evaluation_id: string; metrics: EvaluationMetricReport; robustness: RobustnessReport }> => {
    const res = await fetch(`${API_BASE}/evaluations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_path: datasetPath, sample_limit: sampleLimit })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Evaluation run failed' }));
      throw new Error(err.detail || 'Evaluation run failed');
    }
    return res.json();
  },

  getEvaluations: async () => {
    const res = await fetch(`${API_BASE}/evaluations`);
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    return res.json();
  },

  getEvaluationDetail: async (id: string) => {
    const res = await fetch(`${API_BASE}/evaluations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch evaluation detail');
    return res.json();
  },

  getRobustnessResults: async (evaluationId: string): Promise<RobustnessReport> => {
    const res = await fetch(`${API_BASE}/evaluations/${evaluationId}/robustness`);
    if (!res.ok) throw new Error('Failed to fetch robustness results');
    return res.json();
  },

  // Drift Detection
  getDriftStatus: async (preset: string = 'test_heldout.csv') => {
    const res = await fetch(`${API_BASE}/drift/status?sample_preset=${encodeURIComponent(preset)}`);
    if (!res.ok) throw new Error('Failed to fetch drift status');
    return res.json();
  },

  // Edge Deployment Benchmark
  getEdgeBenchmark: async (iterations: number = 25) => {
    const res = await fetch(`${API_BASE}/edge/benchmark?iterations=${iterations}`);
    if (!res.ok) throw new Error('Failed to fetch edge benchmark');
    return res.json();
  },

  // Human Feedback Loop
  submitAlertFeedback: async (alertId: string, feedback: {
    technician_name: string;
    is_accurate: number;
    verified_fault_class: string;
    work_order_id?: string;
    technician_notes?: string;
    queue_for_retraining?: boolean;
  }) => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  getFeedbackLog: async () => {
    const res = await fetch(`${API_BASE}/alerts/feedback/log`);
    if (!res.ok) throw new Error('Failed to fetch feedback log');
    return res.json();
  },

  // Microcontroller Edge Webhook Push
  pushMicrocontrollerTelemetry: async (reading: SensorReading & { machine_id: string }) => {
    const res = await fetch(`${API_BASE}/telemetry/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading)
    });
    if (!res.ok) throw new Error('Telemetry push failed');
    return res.json();
  }
};

