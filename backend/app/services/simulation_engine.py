"""
Industrial Telemetry Simulator & Hardware Adapter Interface
Supports replay of authentic test records or real-time physics-based synthesis.
Emits live telemetry, real-time ML inference results, and alert notifications.
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np

from app.ml.pipeline import inference_service, SENSOR_BASELINES
from app.core.database import SessionLocal
from app.services.alert_service import process_prediction_and_alert

class SimulationEngine:
    def __init__(self):
        self.state: str = "STOPPED"  # RUNNING, PAUSED, STOPPED
        self.machine_id: str = "MCH-CNC-001"
        self.playback_speed: float = 1.0
        self.fault_scenario: str = "RANDOM"
        self.tick_counter: int = 0
        self.tool_wear_tracker: float = 45.0
        self.listeners: List[asyncio.Queue] = []
        self._task: Optional[asyncio.Task] = None
        self.history_buffer: List[Dict[str, Any]] = []
        self.max_buffer_size: int = 100

    def get_status(self) -> Dict[str, Any]:
        return {
            "state": self.state,
            "machine_id": self.machine_id,
            "playback_speed": self.playback_speed,
            "fault_scenario": self.fault_scenario,
            "tick_counter": self.tick_counter,
            "connected_clients": len(self.listeners),
            "adapter_support": {
                "protocols": ["SSE_STREAM", "REST_POLL", "MQTT_ADAPTER_STUB", "OPC_UA_STUB", "MODBUS_TCP_STUB"],
                "active_protocol": "SYNTHETIC_SIMULATOR_SSE"
            }
        }

    def start(self, machine_id: str = "MCH-CNC-001", speed: float = 1.0, scenario: str = "RANDOM") -> Dict[str, Any]:
        self.machine_id = machine_id
        self.playback_speed = max(0.2, min(10.0, speed))
        self.fault_scenario = scenario
        self.state = "RUNNING"
        try:
            loop = asyncio.get_running_loop()
            if self._task is None or self._task.done():
                self._task = loop.create_task(self._simulation_loop())
        except RuntimeError:
            pass
        return self.get_status()

    def pause(self) -> Dict[str, Any]:
        if self.state == "RUNNING":
            self.state = "PAUSED"
        return self.get_status()

    def resume(self) -> Dict[str, Any]:
        if self.state == "PAUSED":
            self.state = "RUNNING"
        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        self.state = "STOPPED"
        if self._task and not self._task.done():
            self._task.cancel()
        return self.get_status()

    def add_listener(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=50)
        self.listeners.append(q)
        return q

    def remove_listener(self, q: asyncio.Queue):
        if q in self.listeners:
            self.listeners.remove(q)

    def _generate_tick_reading(self) -> Dict[str, Any]:
        """Generate physics-consistent sensor reading for current simulation tick."""
        self.tick_counter += 1
        t_now = datetime.utcnow().isoformat() + "Z"
        
        # Tool wear linearly increments
        self.tool_wear_tracker += 0.25 * self.playback_speed
        if self.tool_wear_tracker > 250.0:
            self.tool_wear_tracker = 5.0  # retool reset

        # Nominal baselines
        air_t = 298.15 + 1.5 * np.sin(self.tick_counter * 0.05) + np.random.normal(0, 0.2)
        proc_t = air_t + 10.2 + np.random.normal(0, 0.3)
        rpm = 1530.0 + 40.0 * np.sin(self.tick_counter * 0.1) + np.random.normal(0, 15.0)
        torque = 40.0 - 0.012 * (rpm - 1530.0) + np.random.normal(0, 2.0)
        vib = 1.25 + 0.002 * self.tool_wear_tracker + np.random.normal(0, 0.08)
        acoust = 46.5 + 0.03 * self.tool_wear_tracker + np.random.normal(0, 1.2)

        # Trigger faults based on scenario
        trigger_fault = False
        active_mode = self.fault_scenario

        if self.fault_scenario == "RANDOM":
            # 10% chance every 20 ticks to trigger a fault phase
            if (self.tick_counter % 25) in [18, 19, 20, 21, 22]:
                trigger_fault = True
                active_mode = "BEARING_FAULT" if (self.tick_counter // 25) % 2 == 0 else "HDF"
        elif self.fault_scenario != "NORMAL":
            # Force selected scenario every 15 ticks
            if (self.tick_counter % 15) in [10, 11, 12, 13, 14]:
                trigger_fault = True
                active_mode = self.fault_scenario

        if trigger_fault:
            if active_mode == "TWF":
                self.tool_wear_tracker = 235.0
                torque += np.random.uniform(16.0, 26.0)
                acoust += np.random.uniform(20.0, 32.0)
                vib += np.random.uniform(1.5, 2.8)
            elif active_mode == "HDF":
                proc_t = air_t + np.random.uniform(4.5, 7.5)
                rpm = np.random.uniform(1180.0, 1320.0)
            elif active_mode == "PWF":
                torque = np.random.uniform(70.0, 88.0)
                rpm = np.random.uniform(2250.0, 2800.0)
            elif active_mode == "OSF":
                self.tool_wear_tracker = 210.0
                torque = np.random.uniform(62.0, 80.0)
            elif active_mode == "BEARING_FAULT":
                vib = np.random.uniform(5.2, 9.5)
                acoust = np.random.uniform(76.0, 96.0)

        return {
            "timestamp": t_now,
            "machine_id": self.machine_id,
            "air_temperature_k": round(float(air_t), 2),
            "process_temperature_k": round(float(proc_t), 2),
            "rotational_speed_rpm": round(float(rpm), 1),
            "torque_nm": round(float(torque), 2),
            "tool_wear_min": round(float(self.tool_wear_tracker), 1),
            "vibration_rms": round(float(vib), 3),
            "acoustic_emission_db": round(float(acoust), 2),
            "simulated": True
        }

    async def _simulation_loop(self):
        """Continuous background loop generating readings, running ML inference, and notifying clients."""
        while self.state in ["RUNNING", "PAUSED"]:
            if self.state == "RUNNING":
                try:
                    reading = self._generate_tick_reading()
                    
                    # Real ML Inference
                    pred = inference_service.predict_single(reading)
                    
                    # Persistence & Alert Triggering
                    db = SessionLocal()
                    new_alert_obj = None
                    try:
                        alert = process_prediction_and_alert(db, pred, reading)
                        if alert:
                            new_alert_obj = {
                                "id": alert.id,
                                "fault_class": alert.fault_class,
                                "severity": alert.severity,
                                "recommendation": alert.recommendation,
                                "detected_at": alert.detected_at.isoformat() + "Z"
                            }
                    finally:
                        db.close()

                    event_payload = {
                        "telemetry": reading,
                        "prediction": pred,
                        "alert": new_alert_obj,
                        "timestamp": reading["timestamp"]
                    }

                    # Maintain history buffer
                    self.history_buffer.append(event_payload)
                    if len(self.history_buffer) > self.max_buffer_size:
                        self.history_buffer.pop(0)

                    # Broadcast to SSE queues
                    dead_queues = []
                    for q in self.listeners:
                        try:
                            q.put_nowait(event_payload)
                        except asyncio.QueueFull:
                            # Drop oldest and add
                            try:
                                q.get_nowait()
                                q.put_nowait(event_payload)
                            except Exception:
                                dead_queues.append(q)

                    for dq in dead_queues:
                        self.remove_listener(dq)

                except Exception as e:
                    print(f"[SimulationEngine] Error during simulation tick: {e}")

            # Sleep interval adjusted by playback speed (1.0 = 1 sec per tick)
            sleep_sec = max(0.1, 1.0 / self.playback_speed)
            await asyncio.sleep(sleep_sec)

# Global simulation singleton
sim_engine = SimulationEngine()
