"""
Model Training & Artifact Generation Pipeline for MachinaSense
Trains genuine ML models for:
1. Multi-Class Fault Classification (Gradient Boosting)
2. Unsupervised Zero-Shot Anomaly Detection (Isolation Forest)
3. Remaining Useful Life (RUL) Degradation Estimation (Random Forest)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor, IsolationForest
from sklearn.metrics import (
    precision_recall_fscore_support,
    accuracy_score,
    confusion_matrix,
    mean_absolute_error,
    root_mean_squared_error
)

from app.ml.synthetic_gen import (
    generate_multi_machine_fleet,
    generate_telemetry_series,
    FEATURE_COLUMNS,
    FAULT_CLASSES,
    FAULT_MAP
)

ENGINEERED_FEATURES = [
    "temp_difference_k",
    "mechanical_power_w",
    "overstrain_factor",
    "vibration_energy"
]

ALL_MODEL_FEATURES = FEATURE_COLUMNS + ENGINEERED_FEATURES

def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive physics-informed operational indicators."""
    df_out = df.copy()
    
    # Delta T: Thermal dissipation efficiency
    df_out["temp_difference_k"] = df_out["process_temperature_k"] - df_out["air_temperature_k"]
    
    # Mechanical Power: P = Torque * Angular velocity (rad/s)
    angular_vel = df_out["rotational_speed_rpm"] * (2 * np.pi / 60.0)
    df_out["mechanical_power_w"] = df_out["torque_nm"] * angular_vel
    
    # Overstrain Factor: Product of cumulative wear and instantaneous torque
    df_out["overstrain_factor"] = df_out["tool_wear_min"] * df_out["torque_nm"]
    
    # Vibration energy interaction
    df_out["vibration_energy"] = df_out["vibration_rms"] * (df_out["acoustic_emission_db"] / 50.0)
    
    return df_out

def train_and_export_models(
    models_dir: str = "models",
    data_dir: str = "data",
    n_samples_per_machine: int = 1600,
    random_seed: int = 42
) -> Dict[str, Any]:
    """Train all models, evaluate on held-out test data, and serialize artifacts."""
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)
    
    print("[MachinaSense ML] Generating industrial benchmark fleet data...")
    df_full = generate_multi_machine_fleet(
        samples_per_machine=n_samples_per_machine,
        random_seed=random_seed
    )
    
    # Save full dataset
    df_full.to_csv(os.path.join(data_dir, "fleet_telemetry_full.csv"), index=False)
    
    # Feature engineering
    df_engineered = add_engineered_features(df_full)
    
    # Stratified Train/Test split (80% train, 20% held-out test)
    # Ensure chronological/machine integrity is maintained
    # We partition by machine operating blocks to avoid window leakage
    train_dfs = []
    test_dfs = []
    
    for machine_id, m_group in df_engineered.groupby("machine_id"):
        split_idx = int(len(m_group) * 0.8)
        train_dfs.append(m_group.iloc[:split_idx])
        test_dfs.append(m_group.iloc[split_idx:])
        
    df_train = pd.concat(train_dfs, ignore_index=True)
    df_test = pd.concat(test_dfs, ignore_index=True)
    
    # Save train & held-out test sets
    df_train.to_csv(os.path.join(data_dir, "train.csv"), index=False)
    df_test.to_csv(os.path.join(data_dir, "test_heldout.csv"), index=False)
    
    # Extract features and targets
    X_train_raw = df_train[ALL_MODEL_FEATURES]
    X_test_raw = df_test[ALL_MODEL_FEATURES]
    
    y_fault_train = df_train["fault_type"].map(FAULT_MAP).values
    y_fault_test = df_test["fault_type"].map(FAULT_MAP).values
    
    y_rul_train = df_train["rul_cycles"].values
    y_rul_test = df_test["rul_cycles"].values
    
    # Fit StandardScaler strictly on training set
    print("[MachinaSense ML] Fitting feature scaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_test_scaled = scaler.transform(X_test_raw)
    
    # 1. Multi-Class Fault Classifier
    print("[MachinaSense ML] Training Multi-Class Gradient Boosting Classifier...")
    classifier = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=random_seed
    )
    classifier.fit(X_train_scaled, y_fault_train)
    
    # 2. Unsupervised Anomaly Detector (Isolation Forest)
    print("[MachinaSense ML] Training Isolation Forest Anomaly Detector...")
    # Train on normal samples in train split
    normal_mask = (y_fault_train == FAULT_MAP["NORMAL"])
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=random_seed
    )
    iso_forest.fit(X_train_scaled[normal_mask])
    
    # 3. RUL Regressor
    print("[MachinaSense ML] Training Random Forest RUL Regressor...")
    rul_model = RandomForestRegressor(
        n_estimators=80,
        max_depth=8,
        random_state=random_seed,
        n_jobs=-1
    )
    rul_model.fit(X_train_scaled, y_rul_train)
    
    # Held-Out Evaluation
    print("[MachinaSense ML] Evaluating models on held-out test split...")
    y_pred_fault = classifier.predict(X_test_scaled)
    prec, rec, f1, _ = precision_recall_fscore_support(
        y_fault_test, y_pred_fault, average="weighted", zero_division=0
    )
    acc = accuracy_score(y_fault_test, y_pred_fault)
    cm = confusion_matrix(y_fault_test, y_pred_fault).tolist()
    
    # Per-class metrics
    class_metrics = {}
    prec_arr, rec_arr, f1_arr, supp_arr = precision_recall_fscore_support(
        y_fault_test, y_pred_fault, labels=range(len(FAULT_CLASSES)), zero_division=0
    )
    for idx, c_name in enumerate(FAULT_CLASSES):
        class_metrics[c_name] = {
            "precision": round(float(prec_arr[idx]), 4),
            "recall": round(float(rec_arr[idx]), 4),
            "f1_score": round(float(f1_arr[idx]), 4),
            "support": int(supp_arr[idx])
        }
        
    # Anomaly detector evaluation on test set
    raw_anomaly_scores = -iso_forest.score_samples(X_test_scaled)
    # Min-max scale raw scores for intuitive 0.0 - 1.0 range
    score_min, score_max = float(raw_anomaly_scores.min()), float(raw_anomaly_scores.max())
    norm_anomaly_scores = (raw_anomaly_scores - score_min) / (score_max - score_min + 1e-8)
    
    # RUL regression evaluation
    y_pred_rul = rul_model.predict(X_test_scaled)
    mae = mean_absolute_error(y_rul_test, y_pred_rul)
    rmse = root_mean_squared_error(y_rul_test, y_pred_rul)
    
    # Feature importances from Gradient Boosting
    feature_importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(ALL_MODEL_FEATURES, classifier.feature_importances_)
    }
    
    metadata = {
        "model_name": "MachinaSense Multi-Task Industrial Predictor",
        "version": "1.0.0",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "input_features": ALL_MODEL_FEATURES,
        "base_features": FEATURE_COLUMNS,
        "engineered_features": ENGINEERED_FEATURES,
        "fault_classes": FAULT_CLASSES,
        "anomaly_score_range": {"min": score_min, "max": score_max},
        "anomaly_threshold": 0.65,
        "metrics": {
            "test_accuracy": round(float(acc), 4),
            "weighted_precision": round(float(prec), 4),
            "weighted_recall": round(float(rec), 4),
            "weighted_f1": round(float(f1), 4),
            "confusion_matrix": cm,
            "class_metrics": class_metrics,
            "rul_mae_cycles": round(float(mae), 2),
            "rul_rmse_cycles": round(float(rmse), 2)
        },
        "feature_importances": feature_importances,
        "training_metadata": {
            "total_samples": len(df_full),
            "train_samples": len(df_train),
            "test_samples": len(df_test),
            "machines": list(df_full["machine_id"].unique())
        }
    }
    
    # Save artifacts
    joblib.dump(classifier, os.path.join(models_dir, "fault_classifier.joblib"))
    joblib.dump(iso_forest, os.path.join(models_dir, "anomaly_detector.joblib"))
    joblib.dump(rul_model, os.path.join(models_dir, "rul_regressor.joblib"))
    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    
    with open(os.path.join(models_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    # Generate demonstration sample files
    # 1. Healthy sample
    sample_healthy = df_test[df_test["fault_type"] == "NORMAL"].head(100)
    sample_healthy[FEATURE_COLUMNS + ["timestamp", "machine_id"]].to_csv(
        os.path.join(data_dir, "sample_healthy.csv"), index=False
    )
    
    # 2. Mixed operational batch with known faults
    sample_mixed = df_test.head(150)
    sample_mixed[FEATURE_COLUMNS + ["timestamp", "machine_id"]].to_csv(
        os.path.join(data_dir, "sample_mixed_operational.csv"), index=False
    )
    
    # 3. Noisy sample (sensor degradation stress test)
    sample_noisy = sample_mixed[FEATURE_COLUMNS + ["timestamp", "machine_id"]].copy()
    np.random.seed(99)
    sample_noisy["vibration_rms"] += np.random.normal(0, 0.8, len(sample_noisy))
    sample_noisy["acoustic_emission_db"] += np.random.normal(0, 5.0, len(sample_noisy))
    sample_noisy.to_csv(os.path.join(data_dir, "sample_noisy.csv"), index=False)
    
    # 4. Missing values sample (realistic data dropouts)
    sample_missing = sample_mixed[FEATURE_COLUMNS + ["timestamp", "machine_id"]].copy()
    mask_torque = np.random.rand(len(sample_missing)) < 0.08
    mask_acoustic = np.random.rand(len(sample_missing)) < 0.06
    sample_missing.loc[mask_torque, "torque_nm"] = np.nan
    sample_missing.loc[mask_acoustic, "acoustic_emission_db"] = np.nan
    sample_missing.to_csv(os.path.join(data_dir, "sample_missing_sensors.csv"), index=False)
    
    print("[MachinaSense ML] Model training and artifact serialization complete!")
    return metadata

if __name__ == "__main__":
    meta = train_and_export_models()
    print("Exported metadata:", json.dumps(meta["metrics"], indent=2))
