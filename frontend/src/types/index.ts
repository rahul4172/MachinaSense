export interface SensorReading {
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  vibration_rms: number;
  acoustic_emission_db: number;
  [key: string]: number | string | undefined;
}

export interface SensorEvidence {
  sensor: string;
  value: number;
  baseline_mean: number;
  unit: string;
  deviation_z: number;
  direction: 'HIGH' | 'LOW';
  significance: 'CRITICAL' | 'ELEVATED';
}

export interface Machine {
  id: string;
  name: string;
  category: string;
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
  location: string;
  health_score: number;
  last_seen: string;
  latest_readings?: SensorReading;
}

export interface Alert {
  id: string;
  machine_id: string;
  timestamp: string;
  detected_at: string;
  fault_class: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'ADVISORY' | 'NORMAL';
  confidence: number;
  anomaly_score: number;
  sensor_evidence?: SensorEvidence[];
  recommendation: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';
  resolution_notes?: string;
  resolved_at?: string;
}

export interface AlertSummary {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  warning_alerts: number;
  advisory_alerts: number;
  by_status: Record<string, number>;
  by_fault_class: Record<string, number>;
}

export interface PredictionResult {
  machine_id: string;
  timestamp: string;
  fault_class: string;
  confidence: number;
  anomaly_score: number;
  is_anomaly: boolean;
  severity: string;
  predicted_rul_cycles: number;
  sensor_evidence: SensorEvidence[];
  recommendation: string;
  class_probabilities: Record<string, number>;
}

export interface SimulationEvent {
  telemetry: SensorReading & { machine_id: string; timestamp: string; simulated: boolean };
  prediction: PredictionResult;
  alert?: {
    id: string;
    fault_class: string;
    severity: string;
    recommendation: string;
    detected_at: string;
  };
  timestamp: string;
}

export interface EvaluationMetricReport {
  evaluation_id: string;
  timestamp: string;
  dataset_path: string;
  dataset_hash: string;
  total_samples: number;
  latency_metrics: {
    total_inference_ms: number;
    mean_latency_per_sample_ms: number;
    throughput_samples_per_sec: number;
    preprocessing_ms: number;
  };
  classification?: {
    accuracy: number;
    weighted_precision: number;
    weighted_recall: number;
    weighted_f1: number;
    confusion_matrix: number[][];
    classes: string[];
    per_class: Record<string, { precision: number; recall: number; f1_score: number; support: number }>;
  };
  anomaly_detection?: {
    roc_auc: number;
    pr_auc: number;
    threshold: number;
    false_positive_rate: number;
    confusion: { tp: number; fp: number; tn: number; fn: number };
  };
  rul_regression?: {
    mae_cycles?: number;
    rmse_cycles?: number;
  };
}

export interface RobustnessExperiment {
  experiment_id: string;
  name: string;
  description: string;
  perturbation_parameters: Record<string, any>;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  delta_f1: number;
  resilience_pct: number;
  status: 'PASS' | 'DEGRADED';
}

export interface RobustnessReport {
  baseline_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  experiments: RobustnessExperiment[];
  summary: {
    tested_scenarios: number;
    mean_resilience_pct: number;
    min_f1_observed: number;
    robustness_grade: string;
  };
}

export interface ModelInfo {
  status: string;
  metadata: {
    model_name: string;
    version: string;
    created_at: string;
    input_features: string[];
    base_features: string[];
    fault_classes: string[];
    anomaly_threshold: number;
    metrics: any;
    feature_importances: Record<string, number>;
  };
  capabilities: string[];
  operational_limitations: string[];
}
