"""
Simulation Control & Live Streaming Endpoints
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.models.schemas import SimulationControl
from app.services.simulation_engine import sim_engine

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/start")
async def start_simulation(payload: SimulationControl):
    return sim_engine.start(
        machine_id=payload.machine_id or "MCH-CNC-001",
        speed=payload.playback_speed or 1.0,
        scenario=payload.fault_scenario or "RANDOM"
    )

@router.post("/pause")
async def pause_simulation():
    return sim_engine.pause()

@router.post("/resume")
async def resume_simulation():
    return sim_engine.resume()

@router.post("/stop")
async def stop_simulation():
    return sim_engine.stop()

@router.get("/status")
async def get_simulation_status():
    return sim_engine.get_status()

@router.get("/stream")
async def stream_telemetry():
    """Server-Sent Events (SSE) streaming live telemetry and real-time inference."""
    if sim_engine.state == "STOPPED":
        sim_engine.start(machine_id="MCH-CNC-001", speed=1.0, scenario="RANDOM")

    queue = sim_engine.add_listener()

    async def event_generator():
        try:
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            sim_engine.remove_listener(queue)
        finally:
            sim_engine.remove_listener(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
