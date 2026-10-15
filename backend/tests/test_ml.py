"""
MachinaSense Automated ML & Pipeline Tests
"""

import pytest
import pandas as pd
import numpy as np

from app.ml.pipeline import inference_service, SENSOR_BASELINES
from app.ml.synthetic_gen import FEATURE_COLUMNS, generate_telemetry_series
from app.ml.evaluator import evaluate_held_out_dataset
from app.ml.robustness import run_robustness_suite

def test_model_loading():
    """Verify that models and scaler are loaded properly."""
    assert inference_service.is_loaded is True
    assert inference_service.classifier is not None
    assert inference_service.anomaly_detector is not None
    assert inference_service.rul_regressor is not None
    assert inference_service.scaler is not None
    assert "version" in inference_service.metadata

def test_prediction_output_structure():
    """Test that single prediction returns all required keys and correct types."""
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
    assert "anomaly_score" in result
    assert 0.0 <= result["anomaly_score"] <= 1.0
    assert "is_anomaly" in result
    assert "severity" in result
    assert "predicted_rul_cycles" in result
    assert "recommendation" in result
    assert isinstance(result["sensor_evidence"], list)

def test_missing_sensor_imputation():
    """Test that missing sensor values are imputed without crashing."""
    df_missing = pd.DataFrame([{
        "machine_id": "MCH-PUMP-TEST",
        "air_temperature_k": 298.0,
        "process_temperature_k": np.nan,  # Missing
        "rotational_speed_rpm": 1500.0,
        "torque_nm": np.nan,              # Missing
        "tool_wear_min": 10.0,
        "vibration_rms": 1.2,
        "acoustic_emission_db": 45.0
    }])
    df_clean, report = inference_service.validate_and_impute(df_missing)
    assert report["imputed_cells"] == 2
    assert not df_clean["process_temperature_k"].isna().any()
    assert not df_clean["torque_nm"].isna().any()

def test_invalid_columns_raises_error():
    """Test that submitting data with missing required columns raises ValueError."""
    df_bad = pd.DataFrame([{"machine_id": "MCH-001", "random_column": 123.4}])
    with pytest.raises(ValueError, match="Missing required sensor column"):
        inference_service.validate_and_impute(df_bad)

def test_held_out_evaluation_metrics():
    """Verify that held-out evaluation produces genuine metrics."""
    metrics = evaluate_held_out_dataset("data/test_heldout.csv", sample_limit=200)
    assert "classification" in metrics
    assert "anomaly_detection" in metrics
    assert metrics["classification"]["accuracy"] > 0.8
    assert "confusion_matrix" in metrics["classification"]
    assert "mean_latency_per_sample_ms" in metrics["latency_metrics"]

def test_robustness_suite_execution():
    """Verify that robustness complications run and return comparative metrics."""
    res = run_robustness_suite("data/test_heldout.csv", random_seed=42)
    assert "baseline_metrics" in res
    assert "experiments" in res
    assert len(res["experiments"]) >= 3
    for exp in res["experiments"]:
        assert "delta_f1" in exp
        assert "resilience_pct" in exp
