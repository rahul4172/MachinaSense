"""
Database Engine & Session Management for MachinaSense
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.db_models import Base, MachineModel
from datetime import datetime

# SQLite thread support
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed initial fleet machines if not present
    db = SessionLocal()
    try:
        count = db.query(MachineModel).count()
        if count == 0:
            initial_machines = [
                MachineModel(
                    id="MCH-CNC-001",
                    name="High-Precision 5-Axis Milling Center A1",
                    category="CNC_MILL",
                    status="OPERATIONAL",
                    location="Shop Floor 1 - Bay 04",
                    health_score=97.8,
                    last_seen=datetime.utcnow(),
                    latest_readings={
                        "air_temperature_k": 298.2,
                        "process_temperature_k": 308.4,
                        "rotational_speed_rpm": 1540.0,
                        "torque_nm": 39.5,
                        "tool_wear_min": 65.0,
                        "vibration_rms": 1.25,
                        "acoustic_emission_db": 47.2
                    }
                ),
                MachineModel(
                    id="MCH-CNC-002",
                    name="Vertical Machining Spindle Center B2",
                    category="CNC_MILL",
                    status="WARNING",
                    location="Shop Floor 1 - Bay 05",
                    health_score=82.4,
                    last_seen=datetime.utcnow(),
                    latest_readings={
                        "air_temperature_k": 299.1,
                        "process_temperature_k": 309.8,
                        "rotational_speed_rpm": 1420.0,
                        "torque_nm": 52.8,
                        "tool_wear_min": 218.0,
                        "vibration_rms": 2.45,
                        "acoustic_emission_db": 68.4
                    }
                ),
                MachineModel(
                    id="MCH-PUMP-101",
                    name="Centrifugal Cooling Slurry Pump 1",
                    category="CENTRIFUGAL_PUMP",
                    status="OPERATIONAL",
                    location="Cooling Station Beta",
                    health_score=95.1,
                    last_seen=datetime.utcnow(),
                    latest_readings={
                        "air_temperature_k": 297.8,
                        "process_temperature_k": 306.9,
                        "rotational_speed_rpm": 1780.0,
                        "torque_nm": 35.2,
                        "tool_wear_min": 42.0,
                        "vibration_rms": 1.18,
                        "acoustic_emission_db": 44.9
                    }
                ),
                MachineModel(
                    id="MCH-PUMP-102",
                    name="High-Pressure Hydraulic Feed Pump 2",
                    category="HYDRAULIC_PUMP",
                    status="CRITICAL",
                    location="Hydraulic Bay 3",
                    health_score=64.2,
                    last_seen=datetime.utcnow(),
                    latest_readings={
                        "air_temperature_k": 300.5,
                        "process_temperature_k": 314.2,
                        "rotational_speed_rpm": 2100.0,
                        "torque_nm": 68.4,
                        "tool_wear_min": 195.0,
                        "vibration_rms": 6.82,
                        "acoustic_emission_db": 84.1
                    }
                ),
                MachineModel(
                    id="MCH-TURB-201",
                    name="Cogeneration Auxiliary Gas Turbine Unit 1",
                    category="GAS_TURBINE",
                    status="OPERATIONAL",
                    location="Power Substation East",
                    health_score=98.9,
                    last_seen=datetime.utcnow(),
                    latest_readings={
                        "air_temperature_k": 296.5,
                        "process_temperature_k": 307.1,
                        "rotational_speed_rpm": 2850.0,
                        "torque_nm": 28.5,
                        "tool_wear_min": 30.0,
                        "vibration_rms": 1.10,
                        "acoustic_emission_db": 46.0
                    }
                )
            ]
            db.add_all(initial_machines)
            db.commit()
    finally:
        db.close()
