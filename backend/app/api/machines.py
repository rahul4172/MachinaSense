"""
Machine Fleet Monitoring Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import MachineModel, AlertModel
from app.models.schemas import MachineSchema, AlertSchema

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=List[MachineSchema])
def list_machines(
    status: Optional[str] = Query(None, description="Filter by status (OPERATIONAL, WARNING, CRITICAL, MAINTENANCE)"),
    category: Optional[str] = Query(None, description="Filter by equipment category"),
    search: Optional[str] = Query(None, description="Search by ID or Name"),
    db: Session = Depends(get_db)
):
    query = db.query(MachineModel)
    if status:
        query = query.filter(MachineModel.status == status.upper())
    if category:
        query = query.filter(MachineModel.category == category)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter((MachineModel.id.ilike(search_fmt)) | (MachineModel.name.ilike(search_fmt)))
    
    return query.order_by(MachineModel.health_score.asc()).all()

@router.get("/{machine_id}")
def get_machine_detail(
    machine_id: str,
    db: Session = Depends(get_db)
):
    machine = db.query(MachineModel).filter(MachineModel.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")

    recent_alerts = db.query(AlertModel).filter(
        AlertModel.machine_id == machine_id
    ).order_by(AlertModel.timestamp.desc()).limit(15).all()

    return {
        "machine": MachineSchema.from_orm(machine),
        "recent_alerts": [AlertSchema.from_orm(a) for a in recent_alerts],
        "operational_context": {
            "installation_date": "2024-03-15",
            "lubrication_schedule": "Bi-weekly synthetic ISO VG 460",
            "rated_power_kw": 18.5,
            "max_spindle_rpm": 3200.0,
            "recommended_inspection_interval_hours": 720
        }
    }
