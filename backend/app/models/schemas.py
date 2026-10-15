"""
Pydantic Schemas for Request & Response Validation
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class TelemetryInput(BaseModel):
    machine_id: str = Field(..., example="MCH-CNC-001")
    timestamp: Optional[str] = Field(None, example="2026-10-15T08:00:00Z")
    air_temperature_k: float = Field(..., ge=250.0, le=400.0, example=298.15)
    process_temperature_k: float = Field(..., ge=250.0, le=450.0, example=308.35)
    rotational_speed_rpm: float = Field(..., ge=0.0, le=10000.0, example=1530.0)
    torque_nm: float = Field(..., ge=0.0, le=500.0, example=40.0)
    tool_wear_min: float = Field(..., ge=0.0, le=1000.0, example=85.0)
    vibration_rms: float = Field(..., ge=0.0, le=50.0, example=1.35)
    acoustic_emission_db: float = Field(..., ge=0.0, le=200.0, example=48.0)

class SensorEvidenceItem(BaseModel):
    sensor: str
    value: float
    baseline_mean: float
    unit: str
    deviation_z: float
    direction: str
    significance: str

class PredictionResult(BaseModel):
    machine_id: str
    timestamp: str
    fault_class: str
    confidence: float
    anomaly_score: float
    is_anomaly: bool
    severity: str
    predicted_rul_cycles: float
    calibrated_time_to_inspection_hours: Optional[float] = None
    sensor_evidence: List[SensorEvidenceItem]
    recommendation: str
    class_probabilities: Dict[str, float]
    validation_report: Optional[Dict[str, Any]] = None

class BatchInferenceRequest(BaseModel):
    records: List[TelemetryInput]

class MachineSchema(BaseModel):
    id: str
    name: str
    category: str
    status: str
    location: str
    health_score: float
    last_seen: datetime
    latest_readings: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: str
    machine_id: str
    timestamp: datetime
    detected_at: datetime
    fault_class: str
    severity: str
    confidence: float
    anomaly_score: float
    sensor_evidence: Optional[List[Dict[str, Any]]] = None
    recommendation: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str = Field(..., example="ACKNOWLEDGED")  # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    resolution_notes: Optional[str] = None

class AlertSummary(BaseModel):
    total_alerts: int
    critical_alerts: int
    high_alerts: int
    warning_alerts: int
    advisory_alerts: int
    by_status: Dict[str, int]
    by_fault_class: Dict[str, int]

class EvaluationRequest(BaseModel):
    dataset_path: Optional[str] = "data/test_heldout.csv"
    sample_limit: Optional[int] = None

class SimulationControl(BaseModel):
    action: str = Field(..., example="start")  # start, pause, resume, stop
    playback_speed: Optional[float] = Field(1.0, ge=0.1, le=10.0)
    machine_id: Optional[str] = "MCH-CNC-001"
    fault_scenario: Optional[str] = "RANDOM"  # RANDOM, TWF, HDF, PWF, BEARING_FAULT, NORMAL

class AlertFeedbackRequest(BaseModel):
    technician_name: str = Field("Senior Maintenance Tech", example="Alex Vance")
    is_accurate: int = Field(1, description="1 = Confirmed True Positive, 0 = False Alarm, 2 = Modified Diagnosis")
    verified_fault_class: str = Field(..., example="TWF")
    work_order_id: Optional[str] = Field(None, example="WO-2026-8812")
    technician_notes: Optional[str] = Field(None, example="Insert tip chipped during rapid traverse. Tool cartridge replaced.")
    queue_for_retraining: bool = Field(True, example=True)

class AlertFeedbackSchema(BaseModel):
    id: str
    alert_id: str
    technician_name: str
    is_accurate: int
    verified_fault_class: str
    work_order_id: Optional[str] = None
    technician_notes: Optional[str] = None
    created_at: datetime
    queued_for_retraining: int

    class Config:
        from_attributes = True

class ChannelDriftMetric(BaseModel):
    channel: str
    ks_statistic: float
    p_value: float
    psi: float
    baseline_mean: float
    current_mean: float
    baseline_std: float
    current_std: float
    is_drifted: bool
    drift_severity: str

class DriftAnalysisResult(BaseModel):
    timestamp: datetime
    total_records_evaluated: int
    overall_status: str  # HEALTHY, MODERATE_DRIFT, SEVERE_DRIFT
    drifted_channels_count: int
    channels: Dict[str, ChannelDriftMetric]
    recommendation: str

class EdgeBenchmarkResult(BaseModel):
    timestamp: datetime
    host_cpu: str
    test_iterations: int
    latency_mean_ms: float
    latency_p50_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    throughput_samples_per_sec: float
    memory_ram_mb: float
    total_model_disk_size_kb: float
    models_breakdown_kb: Dict[str, float]
    edge_suitability: Dict[str, Any]

class MicrocontrollerPushResponse(BaseModel):
    status: str
    timestamp: str
    machine_id: str
    fault_class: str
    anomaly_score: float
    is_anomaly: bool
    severity: str
    predicted_rul_cycles: float
    calibrated_time_to_inspection_hours: float
    alert_created: bool
    alert_id: Optional[str] = None
    action_recommendation: str

