"""
MachinaSense Automated API & End-to-End Integration Tests
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, init_db
from app.models.db_models import AlertModel, MachineModel

@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["model_loaded"] is True

def test_model_info(client):
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACTIVE"
    assert "capabilities" in data

def test_list_machines(client):
    response = client.get("/api/machines")
    assert response.status_code == 200
    machines = response.json()
    assert isinstance(machines, list)
    assert len(machines) >= 1

def test_single_inference_and_alert_generation(client):
    # Submit critical bearing fault telemetry
    critical_sample = {
        "machine_id": "MCH-CNC-001",
        "timestamp": "2026-10-15T13:00:00Z",
        "air_temperature_k": 298.5,
        "process_temperature_k": 308.8,
        "rotational_speed_rpm": 1500.0,
        "torque_nm": 42.0,
        "tool_wear_min": 120.0,
        "vibration_rms": 8.5,            # Critical vibration
        "acoustic_emission_db": 92.0      # Critical acoustic spike
    }
    response = client.post("/api/inference/predict", json=critical_sample)
    assert response.status_code == 200
    pred = response.json()
    assert pred["fault_class"] == "BEARING_FAULT"
    assert pred["severity"] == "CRITICAL"
    assert len(pred["sensor_evidence"]) > 0

    # Verify alert was created in alerts endpoint
    alerts_res = client.get("/api/alerts?machine_id=MCH-CNC-001")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert any(a["fault_class"] == "BEARING_FAULT" for a in alerts)

def test_alert_status_lifecycle(client):
    # Get any alert
    alerts = client.get("/api/alerts").json()
    if alerts:
        a_id = alerts[0]["id"]
        # Acknowledge alert
        patch_res = client.patch(
            f"/api/alerts/{a_id}/status",
            json={"status": "INVESTIGATING", "resolution_notes": "Technician dispatched to inspect spindle."}
        )
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert updated["status"] == "INVESTIGATING"
        assert "Technician dispatched" in updated["resolution_notes"]

def test_evaluations_run(client):
    response = client.post("/api/evaluations/run", json={"dataset_path": "data/test_heldout.csv", "sample_limit": 100})
    assert response.status_code == 200
    data = response.json()
    assert "evaluation_id" in data
    assert "metrics" in data
    assert "robustness" in data

def test_simulation_controls(client):
    # Start
    res_start = client.post("/api/simulation/start", json={"action": "start", "playback_speed": 2.0})
    assert res_start.status_code == 200
    assert res_start.json()["state"] == "RUNNING"

    # Status
    res_status = client.get("/api/simulation/status")
    assert res_status.status_code == 200
    assert res_status.json()["state"] == "RUNNING"

    # Stop
    res_stop = client.post("/api/simulation/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["state"] == "STOPPED"
