"""
Industrial Telemetry & Benchmark Dataset Generator for MachinaSense
Generates realistic multi-sensor industrial time-series based on physics-informed
operating characteristics (thermodynamics, rotational dynamics, tool degradation,
vibration harmonics, and bearing acoustic emissions).
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any, List

FAULT_CLASSES = ["NORMAL", "TWF", "HDF", "PWF", "OSF", "BEARING_FAULT"]
FAULT_MAP = {name: idx for idx, name in enumerate(FAULT_CLASSES)}
FAULT_MAP_REV = {idx: name for idx, name in enumerate(FAULT_CLASSES)}

FEATURE_COLUMNS = [
    "air_temperature_k",
    "process_temperature_k",
    "rotational_speed_rpm",
    "torque_nm",
    "tool_wear_min",
    "vibration_rms",
    "acoustic_emission_db"
]

def generate_telemetry_series(
    n_samples: int = 5000,
    machine_id: str = "MCH-CNC-001",
    start_time: datetime = None,
    sampling_seconds: int = 60,
    fault_ratio: float = 0.08,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generate authentic industrial time-series telemetry with physical correlations
    and genuine fault injections.
    """
    np.random.seed(random_seed)
    if start_time is None:
        start_time = datetime(2026, 10, 1, 8, 0, 0)
    
    timestamps = [start_time + timedelta(seconds=i * sampling_seconds) for i in range(n_samples)]
    
    # Baseline physical parameters with drift & noise
    # Ambient temp varies cyclically (day/night)
    time_hours = np.array([i * sampling_seconds / 3600.0 for i in range(n_samples)])
    air_temp = 298.15 + 2.5 * np.sin(2 * np.pi * time_hours / 24.0) + np.random.normal(0, 0.4, n_samples)
    
    # Process temp tracks air temp with machine load offset (~10K)
    process_temp = air_temp + 10.2 + np.random.normal(0, 0.5, n_samples)
    
    # Speed and torque have inverse correlation (constant power envelope P = tau * omega)
    base_speed = 1530.0 + 80.0 * np.sin(0.1 * time_hours) + np.random.normal(0, 30.0, n_samples)
    base_torque = 40.0 - 0.015 * (base_speed - 1530.0) + np.random.normal(0, 3.5, n_samples)
    base_torque = np.clip(base_torque, 12.0, 75.0)
    
    # Tool wear accumulates linearly with cycles and resets after service
    tool_wear = np.zeros(n_samples)
    wear_accum = 0.0
    for i in range(n_samples):
        # wear rate ~ 0.04 to 0.08 min per operational minute
        wear_accum += np.random.uniform(0.04, 0.08) * (sampling_seconds / 60.0)
        if wear_accum > 240.0:  # tool replacement threshold
            wear_accum = np.random.uniform(0.0, 5.0)
        tool_wear[i] = wear_accum

    # Vibration RMS in mm/s (normal ~ 1.0 - 1.8 mm/s)
    vibration = 1.2 + 0.002 * tool_wear + np.random.normal(0, 0.15, n_samples)
    
    # Acoustic Emission in dB (normal ~ 42 - 52 dB)
    acoustic = 46.0 + 0.03 * tool_wear + np.random.normal(0, 2.0, n_samples)
    
    # Labels
    failure = np.zeros(n_samples, dtype=int)
    fault_type = ["NORMAL"] * n_samples
    
    # Remaining useful life calculation (approx cycles until failure/maintenance)
    rul_cycles = np.maximum(0, (240.0 - tool_wear) * 10).astype(float)
    
    # Inject faults based on physics criteria
    n_faults = int(n_samples * fault_ratio)
    # Pick continuous fault incident windows (not just isolated single points)
    window_starts = np.random.choice(range(50, n_samples - 30), size=max(1, n_faults // 8), replace=False)
    
    for start in window_starts:
        duration = np.random.randint(4, 12)
        end = min(n_samples, start + duration)
        
        # Decide fault mode
        mode = np.random.choice(["TWF", "HDF", "PWF", "OSF", "BEARING_FAULT"])
        
        for idx in range(start, end):
            failure[idx] = 1
            fault_type[idx] = mode
            rul_cycles[idx] = max(0.0, 5.0 - (idx - start))
            
            if mode == "TWF":
                tool_wear[idx] = np.random.uniform(215.0, 255.0)
                base_torque[idx] += np.random.uniform(15.0, 25.0)
                acoustic[idx] += np.random.uniform(18.0, 30.0)
                vibration[idx] += np.random.uniform(1.2, 2.5)
            elif mode == "HDF":
                # Heat Dissipation Failure: Delta T < 8.6K and low speed
                process_temp[idx] = air_temp[idx] + np.random.uniform(5.0, 7.8)
                base_speed[idx] = np.random.uniform(1150.0, 1340.0)
            elif mode == "PWF":
                # Power failure: P < 3500W or > 9000W
                if np.random.rand() > 0.5:
                    base_torque[idx] = np.random.uniform(68.0, 85.0)
                    base_speed[idx] = np.random.uniform(2200.0, 2750.0)
                else:
                    base_torque[idx] = np.random.uniform(8.0, 15.0)
                    base_speed[idx] = np.random.uniform(950.0, 1200.0)
            elif mode == "OSF":
                # Overstrain: high tool wear * torque
                tool_wear[idx] = np.random.uniform(190.0, 230.0)
                base_torque[idx] = np.random.uniform(55.0, 75.0)
            elif mode == "BEARING_FAULT":
                # Severe vibration RMS spike and acoustic burst
                vibration[idx] = np.random.uniform(4.5, 9.2)
                acoustic[idx] = np.random.uniform(72.0, 95.0)

    df = pd.DataFrame({
        "timestamp": [ts.isoformat() for ts in timestamps],
        "machine_id": machine_id,
        "air_temperature_k": np.round(air_temp, 2),
        "process_temperature_k": np.round(process_temp, 2),
        "rotational_speed_rpm": np.round(base_speed, 1),
        "torque_nm": np.round(base_torque, 2),
        "tool_wear_min": np.round(tool_wear, 1),
        "vibration_rms": np.round(vibration, 3),
        "acoustic_emission_db": np.round(acoustic, 2),
        "failure": failure,
        "fault_type": fault_type,
        "rul_cycles": np.round(rul_cycles, 1)
    })
    
    return df

def generate_multi_machine_fleet(
    machines: List[str] = None,
    samples_per_machine: int = 1500,
    random_seed: int = 101
) -> pd.DataFrame:
    """Generate fleet telemetry covering multiple industrial assets."""
    if machines is None:
        machines = [
            "MCH-CNC-001",
            "MCH-CNC-002",
            "MCH-PUMP-101",
            "MCH-PUMP-102",
            "MCH-TURB-201"
        ]
    
    dfs = []
    for i, m_id in enumerate(machines):
        seed = random_seed + i * 37
        df_m = generate_telemetry_series(
            n_samples=samples_per_machine,
            machine_id=m_id,
            sampling_seconds=60,
            fault_ratio=0.07,
            random_seed=seed
        )
        dfs.append(df_m)
    
    return pd.concat(dfs, ignore_index=True)
