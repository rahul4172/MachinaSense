# MachinaSense — Intelligent Industrial Fault Detection & Predictive Maintenance Platform
### Solution for PS 01: Intelligent Industrial Fault Detection and Predictive Maintenance

MachinaSense is a production-minded industrial analytics platform that continuously ingests time-series telemetry from rotating industrial equipment (CNC milling centers, centrifugal slurry pumps, hydraulic feed systems, and gas turbines). It couples physics-informed feature representations with a multi-task Machine Learning inference suite to perform real-time fault classification, zero-shot anomaly detection, Remaining Useful Life (RUL) degradation tracking, and evidence-backed maintenance alerts.

---

## 1. Architecture Overview

```
                      +-----------------------------------------+
                      |       Industrial Telemetry Sources      |
                      |  (CSV Upload / Live Replay / SSE Stream)|
                      +--------------------+--------------------+
                                           |
                                           v
                      +-----------------------------------------+
                      |        Ingestion & Imputer Layer        |
                      |   - Schema Compatibility Validation     |
                      |   - Baseline Normal Mean Imputation     |
                      +--------------------+--------------------+
                                           |
                                           v
                      +-----------------------------------------+
                      |     Physics Feature Engineering Layer   |
                      |  Delta T | Mech Power | Overstrain | Vib|
                      +--------------------+--------------------+
                                           |
                                           v
                      +-----------------------------------------+
                      |     Multi-Task ML Inference Engine      |
                      |  1. Gradient Boosting Fault Classifier  |
                      |  2. Isolation Forest Anomaly Detector   |
                      |  3. Random Forest RUL Regressor         |
                      |  4. Z-Score Sensor Evidence Attribution |
                      +--------------------+--------------------+
                                           |
                                           v
                      +-----------------------------------------+
                      |       FastAPI Backend & SQLite Store    |
                      |  - REST Contracts (CRUD, Status, Evals) |
                      |  - Telemetry SSE Stream Server          |
                      +--------------------+--------------------+
                                           |
                                           v
                      +-----------------------------------------+
                      |  MachinaSense Dark Industrial Frontend  |
                      |  - React + TypeScript + Vite + Tailwind |
                      |  - Recharts Synchronized Time-Series    |
                      +-----------------------------------------+
```

---

## 2. Model & Asset Inventory

| Component | Architecture / Algorithm | Purpose / Contract | Artifact File |
|-----------|-------------------------|---------------------|---------------|
| **Multi-Class Classifier** | Gradient Boosting (100 trees, depth=5) | Classifies failure modes: `NORMAL`, `TWF` (Tool Wear), `HDF` (Heat Dissipation), `PWF` (Power Failure), `OSF` (Overstrain), `BEARING_FAULT` | `backend/models/fault_classifier.joblib` |
| **Anomaly Detector** | Isolation Forest (contamination=5%) | Unsupervised zero-shot anomaly index $[0, 1]$ with decision threshold $0.65$ | `backend/models/anomaly_detector.joblib` |
| **RUL Regressor** | Random Forest Regressor (80 trees, depth=8) | Estimates Remaining Useful Life in operating cycles/minutes | `backend/models/rul_regressor.joblib` |
| **Feature Scaler** | Scikit-Learn `StandardScaler` | Normalized z-scaling fitted strictly on training data split | `backend/models/scaler.joblib` |
| **Metadata & Metrics** | JSON schema & weights descriptor | Model version, hyperparameters, class mappings, held-out test metrics | `backend/models/model_metadata.json` |

---

## 3. Physical Input Schema Contract

Every incoming telemetry sample or dataset record requires the following 7 continuous transducers:

| Sensor Channel | Description | Nominal Baseline | Standard Deviation | Physical Range |
|----------------|-------------|------------------|-------------------|----------------|
| `air_temperature_k` | Ambient Plant Air Temp | 298.15 K (25°C) | 2.0 K | 280.0 – 320.0 K |
| `process_temperature_k` | Spindle / Coolant Temp | 308.35 K (35.2°C) | 2.2 K | 285.0 – 335.0 K |
| `rotational_speed_rpm` | Spindle / Impeller Speed | 1530.0 RPM | 120.0 RPM | 800.0 – 3200.0 RPM |
| `torque_nm` | Mechanical Shaft Torque | 40.0 Nm | 10.0 Nm | 5.0 – 100.0 Nm |
| `tool_wear_min` | Cumulative Tool Usage | 100.0 min | 65.0 min | 0.0 – 350.0 min |
| `vibration_rms` | Vibration Velocity RMS | 1.35 mm/s | 0.35 mm/s | 0.2 – 15.0 mm/s |
| `acoustic_emission_db` | High-Frequency Acoustics | 48.0 dB | 4.5 dB | 25.0 – 120.0 dB |

### Physics-Engineered Features Computed Internally:
- `temp_difference_k`: $\Delta T = T_{\text{process}} - T_{\text{air}}$ (Heat Dissipation Failure triggers when $\Delta T < 8.6\text{K}$ at low speed).
- `mechanical_power_w`: $P = \tau \cdot \omega = \text{torque} \times (\text{speed} \times 2\pi / 60)$ (Power Failure triggers when $P < 3500\text{W}$ or $> 9000\text{W}$).
- `overstrain_factor`: $\text{tool\_wear} \times \text{torque}$ (Overstrain Failure triggers when structural product exceeds tolerance).
- `vibration_energy`: High-frequency harmonic interaction between vibration RMS and acoustic decibels.

---

## 4. Benchmark Datasets Included

Located in `backend/data/`:
1. `fleet_telemetry_full.csv`: 8,000 multi-machine operational records covering 5 assets.
2. `train.csv`: 80% training partition (chronologically separated by machine blocks).
3. `test_heldout.csv`: 20% held-out test partition used for evaluation.
4. `sample_healthy.csv`: 100 nominal operating cycles for zero-alert baseline verification.
5. `sample_mixed_operational.csv`: 150 mixed records containing intermittent bearing faults, tool wear, and thermal saturation.
6. `sample_noisy.csv`: Perturbed dataset with Gaussian noise added to vibration and acoustics.
7. `sample_missing_sensors.csv`: Realistic field sample with random torque and acoustic dropouts.

---

## 5. Prerequisites & Quick Start

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm (Tested on Node v24.13.0)

### Option A: Local Native Execution (Fastest)

#### 1. Backend Service
```powershell
# Open terminal 1
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be live at: **http://localhost:8000**
Interactive Swagger Documentation: **http://localhost:8000/docs**

#### 2. Frontend Application
```powershell
# Open terminal 2
cd frontend
npm run dev
```
MachinaSense UI will be live at: **http://localhost:3000**

#### Or use the one-click batch scripts (Windows):
- Double-click `start_backend.bat`
- Double-click `start_frontend.bat`

---

### Option B: Docker Compose Deployment

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 6. Running Automated Tests

A comprehensive test runner executes 6 automated test suites:
1. Model artifact verification (all 4 models loaded)
2. Single-sample inference contract & evidence extraction
3. Missing sensor imputation resilience
4. Reproducible held-out dataset evaluation
5. Robustness stress tests (5 complication scenarios)
6. FastAPI REST endpoint integration & alert lifecycle

```powershell
python backend/run_tests.py
```
Expected output:
```
ALL TESTS PASSED SUCCESSFULLY! (6/6 Suites)
```

---

## 7. Hackathon Judge Demonstration Walkthrough

Follow this step-by-step walkthrough to demonstrate all required capabilities:

### Step 1: Fleet Operations Dashboard (`Overview`)
1. Open `http://localhost:3000`.
2. Inspect the **Fleet Health Index**, registered asset counts, active critical alerts, and live vibration/torque area charts.
3. Observe that all statistics derive directly from backend SQLite records.

### Step 2: Machine Fleet Inspection (`Machine Fleet`)
1. Click **Machine Fleet** in the navigation bar.
2. Select asset `MCH-PUMP-102` (in CRITICAL condition) or `MCH-CNC-002`.
3. Inspect the live sensor transducers: Vibration RMS (e.g. 6.82 mm/s vs 1.35 mm/s baseline), Spindle Speed, Process Temp.
4. Review the historical alert timeline with sensor evidence tags (`vibration_rms: HIGH z=3.82`).

### Step 3: Live Telemetry Simulation (`Live Telemetry`)
1. Click **Live Telemetry**.
2. Select target asset `MCH-CNC-001` and scenario `BEARING_FAULT` or `RANDOM`.
3. Click **START TELEMETRY STREAM**.
4. Observe the real-time Server-Sent Events (SSE) scrolling line chart.
5. Watch the **Live Model Inference Verdict** card update instantaneously:
   - Classified Fault Class (`BEARING_FAULT`, `TWF`, etc.) with probability percentage.
   - Anomaly Index bar crossing into critical territory ($> 65\%$).
   - Dynamic alert notifications automatically streaming into the incident feed.
6. Test **PAUSE**, **SPEED (2x, 5x)**, and **STOP** controls.

### Step 4: Data Ingestion & CSV Validation (`Data Ingestion`)
1. Click **Data Ingestion**.
2. Click **Load Preset: Mixed Faults Batch** (or drag and drop `backend/data/sample_mixed_operational.csv`).
3. Click **Ingest & Validate CSV**.
4. Review the **Validation Report**:
   - 7/7 required sensor channels present check
   - Missing value imputation check
   - Timestamp chronological ordering check
   - Batch ML Inference summary showing classified fault breakdown and qualifying alerts created.

### Step 5: Alerts & Incident Management Center (`Alerts & Actions`)
1. Click **Alerts & Actions**.
2. Filter by `CRITICAL` severity.
3. Click on any critical alert in the list.
4. Inspect the **Sensor Deviation Attribution** table:
   - Displays exact recorded values, baseline means, units, and deviation z-scores.
   - Explains the physical root-cause (e.g., tool wear endurance exceeded).
5. Read the **Actionable Inspection Guidance** (e.g., *Schedule immediate milling tool insert replacement. Inspect spindle chuck dynamic balance*).
6. Transition status: Click **ACKNOWLEDGED** -> **INVESTIGATING** -> **RESOLVED**.
7. Add resolution notes: `"Spindle insert replaced. Dynamic balancing completed."` and observe audit persistence.

### Step 6: Held-Out Model Evaluation & Robustness (`Evaluation & Robustness`)
1. Click **Evaluation & Robustness**.
2. Click **RUN REPRODUCIBLE EVALUATION**.
3. Inspect authentic held-out test metrics:
   - Test Accuracy, Weighted Precision, Weighted Recall, Weighted F1 Score
   - ROC-AUC / PR-AUC
   - Multi-Class Confusion Matrix (6x6 grid)
   - Per-Class performance table with support counts
   - Inference Latency: $\approx 0.05\text{ ms}$ per sample ($\approx 19,000$ samples/sec throughput).
4. Scroll down to **Physical Complication & Robustness Stress Experiments**:
   - View baseline vs perturbed performance across:
     - Moderate Sensor Noise ($\sigma = 0.4$ mm/s)
     - Severe Sensor Noise ($\sigma = 0.9$ mm/s)
     - 10% Random Sensor Dropout
     - 25% Extreme Sensor Dropout
     - Operational Load Shift (+4K temperature, +12% speed)
   - Observe $\Delta F1$ retention percentage ($\approx 98.8\%$ Mean Resilience Grade A).

### Step 7: Early-Warning Lead-Time & RUL (`Early Warning (RUL)`)
1. Click **Early Warning (RUL)**.
2. Review the **Degradation Trajectory**: Observe tool wear accumulating over operating cycles with the first warning triggering at Cycle 115, providing 25 cycles of lead time before catastrophic failure at Cycle 140.
3. Review the **Lead-Time Verification Log**: Confirms lead times exceed the required 15-minute SLA.

---

## 8. REST API Reference

Interactive OpenAPI documentation is available at `/docs`. Key endpoints include:

- `GET /api/health` — Platform health, uptime, and ML model loaded status.
- `GET /api/model/info` — Model architecture, thresholds, input schemas, and known limitations.
- `GET /api/machines` — Machine fleet listing with status, category, and search query filters.
- `GET /api/machines/{machineId}` — Detailed machine view, telemetry readings, and alert timeline.
- `POST /api/datasets/upload` — Multipart CSV upload, validation report, and optional batch inference.
- `POST /api/inference/predict` — Real-time single-sample telemetry inference and alert triggering.
- `POST /api/inference/batch` — High-throughput batch inference.
- `GET /api/alerts` — Filterable maintenance alert records (`severity`, `status`, `machine_id`).
- `PATCH /api/alerts/{alertId}/status` — Update alert workflow status (`NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`) and resolution notes.
- `GET /api/alerts/summary` — Aggregate alert counts grouped by severity and fault class.
- `POST /api/evaluations/run` — Executes reproducible held-out evaluation and robustness stress testing.
- `GET /api/evaluations` — Historical evaluation run records.
- `POST /api/simulation/start` — Start telemetry simulation generator.
- `POST /api/simulation/stop` — Stop simulation.
- `GET /api/simulation/stream` — SSE endpoint streaming live telemetry ticks and model verdicts.

---

## 9. Operating Boundaries & Known Limitations

1. **Rotational Industrial Machinery**: The physical relationships and models are calibrated for continuous rotating equipment (spindles, pumps, turbines). Reciprocating machinery (e.g. stamping presses) requires domain-specific recalibration.
2. **Sampling Intervals**: Calibrated for 1 Hz to 1/60 Hz sampling. Higher-frequency vibration data should be pre-processed into RMS and spectral peak metrics before ingestion.
3. **Statistical Anomaly Index**: The Isolation Forest anomaly score represents statistical novelty and must be interpreted alongside the physical sensor evidence table.
