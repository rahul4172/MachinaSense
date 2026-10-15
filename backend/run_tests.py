"""
Test Runner for MachinaSense
Executes ML tests, API endpoints, and end-to-end integration workflows.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
import pandas as pd
import numpy as np

from app.ml.pipeline import inference_service, SENSOR_BASELINES
from app.ml.synthetic_gen import FEATURE_COLUMNS
from app.ml.evaluator import evaluate_held_out_dataset
from app.ml.robustness import run_robustness_suite
from app.main import app
from app.core.database import init_db

def run_all_tests():
    print("=" * 60)
    print("MACHINASENSE TEST SUITE")
    print("=" * 60)

    # 1. Model Loading
    print("[TEST 1] Verifying ML model artifacts...")
    assert inference_service.is_loaded is True
    assert inference_service.classifier is not None
    assert inference_service.anomaly_detector is not None
    assert inference_service.rul_regressor is not None
    assert inference_service.scaler is not None
    print("  PASS: All 4 ML models and metadata loaded successfully.")

    # 2. Prediction Output
    print("[TEST 2] Testing single prediction inference and contract...")
    sample_input = {
        "machine_id": "MCH-TEST-001",
        "timestamp": "2026-10-15T12:00:00Z",
        "air_temperature_k": 298.15,
        "process_temperature_k": 308.35,
        "rotational_speed_rpm": 1530.0,
        "torque_nm": 40.0,
        "tool_wear_min": 50.0,
        "vibration_rms": 1.35,
        "acoustic_emission_db": 48.0
    }
    result = inference_service.predict_single(sample_input)
    assert result["machine_id"] == "MCH-TEST-001"
    assert "fault_class" in result
    assert 0.0 <= result["anomaly_score"] <= 1.0
    assert "recommendation" in result
    assert "predicted_rul_cycles" in result
    print("  PASS: Single inference contract validated.")

    # 3. Missing Value Handling
    print("[TEST 3] Testing missing sensor imputation...")
    df_missing = pd.DataFrame([{
        "machine_id": "MCH-PUMP-TEST",
        "air_temperature_k": 298.0,
        "process_temperature_k": np.nan,
        "rotational_speed_rpm": 1500.0,
        "torque_nm": np.nan,
        "tool_wear_min": 10.0,
        "vibration_rms": 1.2,
        "acoustic_emission_db": 45.0
    }])
    df_clean, rep = inference_service.validate_and_impute(df_missing)
    assert rep["imputed_cells"] == 2
    assert not df_clean["process_temperature_k"].isna().any()
    print("  PASS: Missing values imputed with baseline normal means.")

    # 4. Held-Out Evaluation
    print("[TEST 4] Testing held-out dataset evaluation engine...")
    eval_metrics = evaluate_held_out_dataset("data/test_heldout.csv", sample_limit=200)
    assert "classification" in eval_metrics
    assert eval_metrics["classification"]["accuracy"] > 0.85
    assert "mean_latency_per_sample_ms" in eval_metrics["latency_metrics"]
    print(f"  PASS: Evaluation passed. Test Accuracy: {eval_metrics['classification']['accuracy']:.3f}, F1: {eval_metrics['classification']['weighted_f1']:.3f}")

    # 5. Robustness Suite
    print("[TEST 5] Testing robustness stress tests (noise, missing samples, load shift)...")
    rob = run_robustness_suite("data/test_heldout.csv", random_seed=42)
    assert len(rob["experiments"]) >= 3
    print(f"  PASS: {len(rob['experiments'])} robustness scenarios verified. Mean resilience: {rob['summary']['mean_resilience_pct']}%")

    # 6. API Endpoints
    print("[TEST 6] Testing FastAPI REST Endpoints via TestClient...")
    init_db()
    with TestClient(app) as client:
        # Health
        res = client.get("/api/health")
        assert res.status_code == 200 and res.json()["status"] == "HEALTHY"

        # Model Info
        res = client.get("/api/model/info")
        assert res.status_code == 200 and res.json()["status"] == "ACTIVE"

        # Machines
        res = client.get("/api/machines")
        assert res.status_code == 200 and len(res.json()) >= 1

        # Real Inference + Alert Creation
        critical_sample = {
            "machine_id": "MCH-CNC-001",
            "timestamp": "2026-10-15T13:00:00Z",
            "air_temperature_k": 298.5,
            "process_temperature_k": 308.8,
            "rotational_speed_rpm": 1500.0,
            "torque_nm": 42.0,
            "tool_wear_min": 120.0,
            "vibration_rms": 8.5,
            "acoustic_emission_db": 92.0
        }
        res = client.post("/api/inference/predict", json=critical_sample)
        assert res.status_code == 200
        data = res.json()
        assert data["fault_class"] == "BEARING_FAULT"
        assert data["severity"] == "CRITICAL"

        # Verify alert recorded
        res_alerts = client.get("/api/alerts?machine_id=MCH-CNC-001")
        assert res_alerts.status_code == 200
        assert len(res_alerts.json()) >= 1

        # Simulation
        res_sim = client.post("/api/simulation/start", json={"action": "start"})
        assert res_sim.status_code == 200
        res_stop = client.post("/api/simulation/stop")
        assert res_stop.status_code == 200

    print("  PASS: All API endpoints and alert lifecycles tested.")
    print("=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! (6/6 Suites)")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
