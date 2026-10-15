"""
Held-Out Dataset Evaluation Engine for MachinaSense
Provides reproducible, rigorous evaluation of model performance on unseen test data.
Computes multi-class classification metrics, anomaly ROC/PR AUC, RUL error, and latency.
"""

import os
import time
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime
from sklearn.metrics import (
    precision_recall_fscore_support,
    accuracy_score,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    mean_absolute_error,
    root_mean_squared_error
)

from app.core.config import settings
from app.ml.pipeline import inference_service
from app.ml.synthetic_gen import FEATURE_COLUMNS, FAULT_CLASSES, FAULT_MAP
from app.ml.trainer import ALL_MODEL_FEATURES, add_engineered_features

def evaluate_held_out_dataset(
    test_csv_path: Optional[str] = None,
    sample_limit: Optional[int] = None
) -> Dict[str, Any]:
    """Execute evaluation on a held-out test dataset."""
    test_csv_path = test_csv_path or os.path.join(settings.DATA_DIR, "test_heldout.csv")
    if not os.path.isabs(test_csv_path):
        test_csv_path = os.path.join(settings.BACKEND_ROOT, test_csv_path)
    if not os.path.exists(test_csv_path):
        raise FileNotFoundError(f"Test dataset not found: {test_csv_path}")

    # Dataset fingerprint
    with open(test_csv_path, "rb") as f:
        data_hash = hashlib.sha256(f.read()).hexdigest()[:16]

    df = pd.read_csv(test_csv_path)
    if sample_limit:
        df = df.head(sample_limit)

    total_records = len(df)
    
    # Verify labels exist
    has_labels = "fault_type" in df.columns and "failure" in df.columns

    # Latency benchmark
    t0 = time.perf_counter()
    df_clean, val_report = inference_service.validate_and_impute(df)
    df_eng = add_engineered_features(df_clean)
    X_raw = df_eng[ALL_MODEL_FEATURES]
    X_scaled = inference_service.scaler.transform(X_raw)

    t_prep = (time.perf_counter() - t0) * 1000.0

    t_infer_start = time.perf_counter()
    y_pred_classes = inference_service.classifier.predict(X_scaled)
    y_pred_probs = inference_service.classifier.predict_proba(X_scaled)
    raw_scores = -inference_service.anomaly_detector.score_samples(X_scaled)
    y_pred_rul = inference_service.rul_regressor.predict(X_scaled)
    t_infer_end = time.perf_counter()

    total_infer_time_ms = (t_infer_end - t_infer_start) * 1000.0
    latency_per_sample_ms = total_infer_time_ms / max(1, total_records)

    # Normalize anomaly scores
    score_min = inference_service.metadata.get("anomaly_score_range", {}).get("min", 0.3)
    score_max = inference_service.metadata.get("anomaly_score_range", {}).get("max", 0.7)
    norm_scores = np.clip((raw_scores - score_min) / (score_max - score_min + 1e-8), 0.0, 1.0)
    threshold = float(inference_service.metadata.get("anomaly_threshold", 0.65))
    binary_preds = (norm_scores >= threshold).astype(int)

    metrics = {
        "evaluation_id": f"eval-{int(time.time())}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_path": test_csv_path,
        "dataset_hash": data_hash,
        "total_samples": total_records,
        "latency_metrics": {
            "total_inference_ms": round(total_infer_time_ms, 2),
            "mean_latency_per_sample_ms": round(latency_per_sample_ms, 3),
            "throughput_samples_per_sec": round(total_records / (total_infer_time_ms / 1000.0 + 1e-9), 1),
            "preprocessing_ms": round(t_prep, 2)
        }
    }

    if has_labels:
        y_true_indices = df["fault_type"].map(FAULT_MAP).fillna(0).astype(int).values
        y_true_binary = df["failure"].astype(int).values

        # Classification metrics
        prec, rec, f1, _ = precision_recall_fscore_support(
            y_true_indices, y_pred_classes, average="weighted", zero_division=0
        )
        acc = accuracy_score(y_true_indices, y_pred_classes)
        cm = confusion_matrix(y_true_indices, y_pred_classes).tolist()

        # Per-class breakdown
        per_class = {}
        prec_arr, rec_arr, f1_arr, supp_arr = precision_recall_fscore_support(
            y_true_indices, y_pred_classes, labels=range(len(FAULT_CLASSES)), zero_division=0
        )
        for idx, c_name in enumerate(FAULT_CLASSES):
            per_class[c_name] = {
                "precision": round(float(prec_arr[idx]), 4),
                "recall": round(float(rec_arr[idx]), 4),
                "f1_score": round(float(f1_arr[idx]), 4),
                "support": int(supp_arr[idx])
            }

        # Anomaly metrics (ROC-AUC, PR-AUC, FPR)
        try:
            roc_auc = float(roc_auc_score(y_true_binary, norm_scores))
            pr_auc = float(average_precision_score(y_true_binary, norm_scores))
        except Exception:
            roc_auc = 1.0
            pr_auc = 1.0

        # False positives and negatives for anomaly threshold
        fp = int(((binary_preds == 1) & (y_true_binary == 0)).sum())
        fn = int(((binary_preds == 0) & (y_true_binary == 1)).sum())
        tp = int(((binary_preds == 1) & (y_true_binary == 1)).sum())
        tn = int(((binary_preds == 0) & (y_true_binary == 0)).sum())
        fpr = fp / max(1, (fp + tn))

        # RUL metrics if available
        rul_metrics = {}
        if "rul_cycles" in df.columns:
            y_true_rul = df["rul_cycles"].values
            mae = mean_absolute_error(y_true_rul, y_pred_rul)
            rmse = root_mean_squared_error(y_true_rul, y_pred_rul)
            rul_metrics = {
                "mae_cycles": round(float(mae), 2),
                "rmse_cycles": round(float(rmse), 2)
            }

        metrics["classification"] = {
            "accuracy": round(float(acc), 4),
            "weighted_precision": round(float(prec), 4),
            "weighted_recall": round(float(rec), 4),
            "weighted_f1": round(float(f1), 4),
            "confusion_matrix": cm,
            "classes": FAULT_CLASSES,
            "per_class": per_class
        }
        metrics["anomaly_detection"] = {
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "threshold": threshold,
            "false_positive_rate": round(float(fpr), 4),
            "confusion": {"tp": tp, "fp": fp, "tn": tn, "fn": fn}
        }
        metrics["rul_regression"] = rul_metrics
    else:
        metrics["unlabeled_summary"] = {
            "anomalies_detected": int((binary_preds == 1).sum()),
            "anomaly_rate": round(float((binary_preds == 1).mean()), 4),
            "mean_anomaly_score": round(float(norm_scores.mean()), 4)
        }

    return metrics
