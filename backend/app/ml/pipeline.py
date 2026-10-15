"""
MachinaSense ML Inference Pipeline
Loads production models, performs strict input validation, feature engineering,
multi-task inference (Fault Classification + Anomaly Detection + RUL Regression),
and sensor evidence attribution.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime

from app.core.config import settings
from app.ml.synthetic_gen import FEATURE_COLUMNS, FAULT_CLASSES, FAULT_MAP_REV
from app.ml.trainer import ALL_MODEL_FEATURES, add_engineered_features

# Sensor reference baselines for normal industrial operating regime
SENSOR_BASELINES = {
    "air_temperature_k": {"mean": 298.15, "std": 2.0, "unit": "K", "min": 280.0, "max": 320.0},
    "process_temperature_k": {"mean": 308.35, "std": 2.2, "unit": "K", "min": 285.0, "max": 335.0},
    "rotational_speed_rpm": {"mean": 1530.0, "std": 120.0, "unit": "RPM", "min": 800.0, "max": 3200.0},
    "torque_nm": {"mean": 40.0, "std": 10.0, "unit": "Nm", "min": 5.0, "max": 100.0},
    "tool_wear_min": {"mean": 100.0, "std": 65.0, "unit": "min", "min": 0.0, "max": 350.0},
    "vibration_rms": {"mean": 1.35, "std": 0.35, "unit": "mm/s", "min": 0.2, "max": 15.0},
    "acoustic_emission_db": {"mean": 48.0, "std": 4.5, "unit": "dB", "min": 25.0, "max": 120.0}
}

INSPECTION_RECOMMENDATIONS = {
    "TWF": "Schedule immediate milling tool insert replacement. Inspect spindle chuck for dynamic balance after retooling.",
    "HDF": "Inspect cooling lubricant circuits and radiator heat exchangers. Clear chip build-up from thermal transfer fins.",
    "PWF": "Verify 3-phase motor drive supply voltage and current harmonics. Check inverter drive IGBT switching status.",
    "OSF": "Reduce instantaneous feed rate and check workpiece hardness. Inspect drive shaft for mechanical torsional bind.",
    "BEARING_FAULT": "Perform acoustic vibration lubrication inspection. Check drive bearing raceway for spalling or cage fracture.",
    "NORMAL": "Operating within nominal design envelope. Routine scheduled monitoring."
}

class ModelInferenceService:
    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = models_dir or settings.MODELS_DIR
        self.classifier = None
        self.anomaly_detector = None
        self.rul_regressor = None
        self.scaler = None
        self.metadata = {}
        self.is_loaded = False
        self.last_load_error = None
        self.load_models()

    def load_models(self) -> bool:
        """Load serialized model files and verify integrity."""
        try:
            clf_path = os.path.join(self.models_dir, "fault_classifier.joblib")
            anom_path = os.path.join(self.models_dir, "anomaly_detector.joblib")
            rul_path = os.path.join(self.models_dir, "rul_regressor.joblib")
            scaler_path = os.path.join(self.models_dir, "scaler.joblib")
            meta_path = os.path.join(self.models_dir, "model_metadata.json")

            if not all(os.path.exists(p) for p in [clf_path, anom_path, rul_path, scaler_path, meta_path]):
                missing = [p for p in [clf_path, anom_path, rul_path, scaler_path, meta_path] if not os.path.exists(p)]
                self.last_load_error = f"Missing model artifacts: {missing}"
                self.is_loaded = False
                return False

            self.classifier = joblib.load(clf_path)
            self.anomaly_detector = joblib.load(anom_path)
            self.rul_regressor = joblib.load(rul_path)
            self.scaler = joblib.load(scaler_path)

            with open(meta_path, "r") as f:
                self.metadata = json.load(f)

            self.is_loaded = True
            self.last_load_error = None
            return True
        except Exception as e:
            self.last_load_error = str(e)
            self.is_loaded = False
            return False

    def validate_and_impute(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Validate input columns, ranges, and impute any missing sensor values."""
        df_clean = df.copy()
        report = {
            "total_records": len(df_clean),
            "missing_values": {},
            "out_of_range_values": {},
            "imputed_cells": 0
        }

        # Check required columns
        for col in FEATURE_COLUMNS:
            if col not in df_clean.columns:
                raise ValueError(f"Missing required sensor column: {col}")

        # Check missing values & impute with baseline normal mean
        for col in FEATURE_COLUMNS:
            n_missing = int(df_clean[col].isna().sum())
            if n_missing > 0:
                report["missing_values"][col] = n_missing
                report["imputed_cells"] += n_missing
                baseline_val = SENSOR_BASELINES[col]["mean"]
                df_clean[col] = df_clean[col].fillna(baseline_val)

        # Check out-of-range bounds
        for col in FEATURE_COLUMNS:
            bounds = SENSOR_BASELINES[col]
            out_of_bounds = ((df_clean[col] < bounds["min"]) | (df_clean[col] > bounds["max"])).sum()
            if out_of_bounds > 0:
                report["out_of_range_values"][col] = int(out_of_bounds)

        return df_clean, report

    def extract_evidence(self, row_dict: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Calculate sensor deviations against baseline normal operating statistics
        to provide genuine, explainable evidence for any alert.
        """
        evidence = []
        for sensor, meta in SENSOR_BASELINES.items():
            if sensor in row_dict:
                val = float(row_dict[sensor])
                mean = meta["mean"]
                std = meta["std"]
                z_score = (val - mean) / (std + 1e-6)
                
                # Flag significant deviations (|z| >= 2.0)
                if abs(z_score) >= 1.8:
                    evidence.append({
                        "sensor": sensor,
                        "value": round(val, 2),
                        "baseline_mean": round(mean, 2),
                        "unit": meta["unit"],
                        "deviation_z": round(z_score, 2),
                        "direction": "HIGH" if z_score > 0 else "LOW",
                        "significance": "CRITICAL" if abs(z_score) >= 3.0 else "ELEVATED"
                    })
        # Sort by absolute deviation
        evidence.sort(key=lambda x: abs(x["deviation_z"]), reverse=True)
        return evidence

    def predict_single(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Perform real-time multi-task inference on a single operational telemetry sample."""
        if not self.is_loaded:
            raise RuntimeError(f"ML models are not loaded: {self.last_load_error}")

        df = pd.DataFrame([telemetry])
        df_clean, validation_report = self.validate_and_impute(df)
        df_eng = add_engineered_features(df_clean)

        X_raw = df_eng[ALL_MODEL_FEATURES]
        X_scaled = self.scaler.transform(X_raw)

        # 1. Fault classification
        fault_pred_idx = int(self.classifier.predict(X_scaled)[0])
        fault_probs = self.classifier.predict_proba(X_scaled)[0]
        fault_class = FAULT_MAP_REV.get(fault_pred_idx, "UNKNOWN")
        confidence = float(fault_probs[fault_pred_idx])

        # 2. Anomaly score (Isolation Forest)
        raw_score = float(-self.anomaly_detector.score_samples(X_scaled)[0])
        score_min = self.metadata.get("anomaly_score_range", {}).get("min", 0.3)
        score_max = self.metadata.get("anomaly_score_range", {}).get("max", 0.7)
        norm_score = float(np.clip((raw_score - score_min) / (score_max - score_min + 1e-8), 0.0, 1.0))

        threshold = float(self.metadata.get("anomaly_threshold", 0.65))
        is_anomaly = bool(norm_score >= threshold or fault_class != "NORMAL")

        # 3. RUL Regression & Calibrated Time-To-Inspection
        predicted_rul = float(self.rul_regressor.predict(X_scaled)[0])
        cycle_to_hours = 0.15  # 9 minutes per operating cycle baseline
        if fault_class in ["BEARING_FAULT", "PWF", "OSF"]:
            time_to_inspect = round(max(0.5, predicted_rul * cycle_to_hours * 0.4), 1)
        elif fault_class in ["TWF", "HDF"] or norm_score >= 0.8:
            time_to_inspect = round(max(1.0, predicted_rul * cycle_to_hours * 0.65), 1)
        elif is_anomaly or norm_score >= threshold:
            time_to_inspect = round(max(2.0, predicted_rul * cycle_to_hours * 0.8), 1)
        else:
            time_to_inspect = round(max(8.0, predicted_rul * cycle_to_hours), 1)

        # 4. Severity determination
        if fault_class in ["BEARING_FAULT", "PWF", "OSF"]:
            severity = "CRITICAL"
        elif fault_class in ["TWF", "HDF"] or norm_score >= 0.8:
            severity = "HIGH"
        elif is_anomaly or norm_score >= threshold:
            severity = "WARNING"
        elif norm_score >= 0.5:
            severity = "ADVISORY"
        else:
            severity = "NORMAL"

        # 5. Extract sensor evidence
        evidence = self.extract_evidence(telemetry)

        return {
            "machine_id": telemetry.get("machine_id", "UNKNOWN"),
            "timestamp": str(telemetry.get("timestamp") or (datetime.utcnow().isoformat() + "Z")),
            "fault_class": fault_class,
            "confidence": round(confidence, 4),
            "anomaly_score": round(norm_score, 4),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "predicted_rul_cycles": round(predicted_rul, 1),
            "calibrated_time_to_inspection_hours": time_to_inspect,
            "sensor_evidence": evidence,
            "recommendation": INSPECTION_RECOMMENDATIONS.get(fault_class, "Inspect asset."),
            "class_probabilities": {
                c_name: round(float(p), 4)
                for c_name, p in zip(FAULT_CLASSES, fault_probs)
            },
            "validation_report": validation_report
        }

    def predict_batch(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Perform batch inference over historical or uploaded dataset records."""
        if not self.is_loaded:
            raise RuntimeError(f"ML models are not loaded: {self.last_load_error}")

        df_clean, validation_report = self.validate_and_impute(df)
        df_eng = add_engineered_features(df_clean)

        X_raw = df_eng[ALL_MODEL_FEATURES]
        X_scaled = self.scaler.transform(X_raw)

        # Batch predictions
        fault_preds = self.classifier.predict(X_scaled)
        fault_probs = self.classifier.predict_proba(X_scaled)
        raw_scores = -self.anomaly_detector.score_samples(X_scaled)
        score_min = self.metadata.get("anomaly_score_range", {}).get("min", 0.3)
        score_max = self.metadata.get("anomaly_score_range", {}).get("max", 0.7)
        norm_scores = np.clip((raw_scores - score_min) / (score_max - score_min + 1e-8), 0.0, 1.0)
        rul_preds = self.rul_regressor.predict(X_scaled)
        threshold = float(self.metadata.get("anomaly_threshold", 0.65))

        results = []
        for i in range(len(df_clean)):
            row = df_clean.iloc[i].to_dict()
            f_idx = int(fault_preds[i])
            f_class = FAULT_MAP_REV.get(f_idx, "UNKNOWN")
            conf = float(fault_probs[i][f_idx])
            a_score = float(norm_scores[i])
            is_anom = bool(a_score >= threshold or f_class != "NORMAL")
            rul_val = float(rul_preds[i])

            if f_class in ["BEARING_FAULT", "PWF", "OSF"]:
                sev = "CRITICAL"
            elif f_class in ["TWF", "HDF"] or a_score >= 0.8:
                sev = "HIGH"
            elif is_anom or a_score >= threshold:
                sev = "WARNING"
            elif a_score >= 0.5:
                sev = "ADVISORY"
            else:
                sev = "NORMAL"

            evidence = self.extract_evidence(row)

            results.append({
                "record_index": i,
                "timestamp": str(row.get("timestamp", "")),
                "machine_id": str(row.get("machine_id", "MCH-001")),
                "fault_class": f_class,
                "confidence": round(conf, 4),
                "anomaly_score": round(a_score, 4),
                "is_anomaly": is_anom,
                "severity": sev,
                "predicted_rul_cycles": round(rul_val, 1),
                "sensor_evidence": evidence,
                "recommendation": INSPECTION_RECOMMENDATIONS.get(f_class, "Routine maintenance check."),
                "readings": {col: float(row[col]) for col in FEATURE_COLUMNS if col in row}
            })

        return results

# Global singleton
inference_service = ModelInferenceService()
