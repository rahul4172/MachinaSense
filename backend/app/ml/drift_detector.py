"""
MachinaSense Drift Detection Engine
Detects covariate and sensor drift using 2-sample Kolmogorov-Smirnov tests,
Population Stability Index (PSI), and rolling baseline comparisons.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime
from scipy import stats

from app.core.config import settings
from app.ml.synthetic_gen import FEATURE_COLUMNS

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
    """Calculate Population Stability Index (PSI) between two numeric distributions."""
    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    # Create equal-frequency bins from expected
    percentiles = np.linspace(0, 100, num_buckets + 1)
    bin_edges = np.percentile(expected, percentiles)
    bin_edges[0] -= 1e-5
    bin_edges[-1] += 1e-5

    # Count occurrences
    expected_counts, _ = np.histogram(expected, bins=bin_edges)
    actual_counts, _ = np.histogram(actual, bins=bin_edges)

    # Convert to percentages with epsilon to prevent division by zero
    expected_pct = np.clip(expected_counts / len(expected), 1e-4, 1.0)
    actual_pct = np.clip(actual_counts / len(actual), 1e-4, 1.0)

    # Re-normalize
    expected_pct /= np.sum(expected_pct)
    actual_pct /= np.sum(actual_pct)

    psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(np.round(psi_value, 4))

class DriftDetectionService:
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or settings.DATA_DIR
        self.baseline_df = None
        self._load_baseline()

    def _load_baseline(self):
        train_path = os.path.join(self.data_dir, "train.csv")
        if os.path.exists(train_path):
            try:
                self.baseline_df = pd.read_csv(train_path)
            except Exception as e:
                print(f"[DriftDetector] Could not load train.csv: {e}")

    def analyze_drift(self, test_df: pd.DataFrame) -> Dict[str, Any]:
        """Compare input test DataFrame against the baseline training distribution."""
        if self.baseline_df is None:
            self._load_baseline()

        if self.baseline_df is None:
            raise RuntimeError("Baseline training data is unavailable for drift comparison.")

        channels = {}
        drifted_count = 0

        for col in FEATURE_COLUMNS:
            if col not in test_df.columns:
                continue

            base_vals = self.baseline_df[col].dropna().values
            curr_vals = test_df[col].dropna().values

            if len(curr_vals) < 5:
                continue

            # 1. 2-sample Kolmogorov-Smirnov test
            ks_res = stats.ks_2samp(base_vals, curr_vals)
            ks_stat = float(np.round(ks_res.statistic, 4))
            p_val = float(np.round(ks_res.pvalue, 6))

            # 2. Population Stability Index (PSI)
            psi_val = calculate_psi(base_vals, curr_vals)

            # 3. Descriptive moments
            b_mean = float(np.round(np.mean(base_vals), 2))
            c_mean = float(np.round(np.mean(curr_vals), 2))
            b_std = float(np.round(np.std(base_vals), 2))
            c_std = float(np.round(np.std(curr_vals), 2))

            # Drift qualification
            is_drifted = bool(p_val < 0.05 and (psi_val >= 0.10 or abs(c_mean - b_mean) > 1.5 * b_std))
            if is_drifted:
                drifted_count += 1

            if psi_val >= 0.25:
                severity = "SIGNIFICANT"
            elif psi_val >= 0.10:
                severity = "MODERATE"
            else:
                severity = "NEGLIGIBLE"

            channels[col] = {
                "channel": col,
                "ks_statistic": ks_stat,
                "p_value": p_val,
                "psi": psi_val,
                "baseline_mean": b_mean,
                "current_mean": c_mean,
                "baseline_std": b_std,
                "current_std": c_std,
                "is_drifted": is_drifted,
                "drift_severity": severity
            }

        # Overall health qualification
        if drifted_count >= 3:
            overall = "SEVERE_DRIFT"
            rec = "Multiple core sensor distributions have shifted significantly. Model recalibration and baseline re-centering strongly advised."
        elif drifted_count >= 1:
            overall = "MODERATE_DRIFT"
            rec = "Localized sensor distribution deviation detected. Verify transducer calibration and check for ambient thermal or load drift."
        else:
            overall = "HEALTHY"
            rec = "All telemetric distributions match nominal training regime within 95% statistical confidence bounds."

        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_records_evaluated": len(test_df),
            "overall_status": overall,
            "drifted_channels_count": drifted_count,
            "channels": channels,
            "recommendation": rec
        }

drift_service = DriftDetectionService()
