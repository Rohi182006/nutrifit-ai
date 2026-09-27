from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.models.entities import ActivityLog, User
from app.schemas.schemas import ActivityLogCreate, ActivityLogResponse
from app.routers.deps import get_current_user, require_role

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("/", response_model=List[ActivityLogResponse])
def get_activity_logs(
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    return db.query(ActivityLog).filter_by(client_id=current_user.id).order_by(ActivityLog.log_date.desc()).offset(offset).limit(limit).all()

@router.post("/", response_model=ActivityLogResponse)
def log_activity(
    payload: ActivityLogCreate,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    act = ActivityLog(
        client_id=current_user.id,
        steps=payload.steps,
        active_minutes=payload.active_minutes,
        activity_type=payload.activity_type,
        distance_km=payload.distance_km,
        calories_burned=payload.calories_burned,
        notes=payload.notes,
        log_date=payload.log_date or datetime.now(timezone.utc)
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act

@router.get("/summary")
def get_activity_summary(
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    # Today
    today_logs = db.query(ActivityLog).filter(
        ActivityLog.client_id == current_user.id,
        ActivityLog.log_date >= today_start
    ).all()

    # Week
    week_logs = db.query(ActivityLog).filter(
        ActivityLog.client_id == current_user.id,
        ActivityLog.log_date >= week_start
    ).all()

    # Month
    month_logs = db.query(ActivityLog).filter(
        ActivityLog.client_id == current_user.id,
        ActivityLog.log_date >= month_start
    ).all()

    return {
        "today": {
            "steps": sum(l.steps for l in today_logs),
            "active_minutes": sum(l.active_minutes for l in today_logs),
            "distance_km": round(sum(l.distance_km for l in today_logs), 2),
            "calories_burned": round(sum(l.calories_burned for l in today_logs), 1)
        },
        "weekly": {
            "total_steps": sum(l.steps for l in week_logs),
            "avg_steps": int(sum(l.steps for l in week_logs) / max(1, len(week_logs))),
            "total_active_minutes": sum(l.active_minutes for l in week_logs),
            "total_distance_km": round(sum(l.distance_km for l in week_logs), 2)
        },
        "monthly": {
            "total_steps": sum(l.steps for l in month_logs),
            "avg_steps": int(sum(l.steps for l in month_logs) / max(1, len(month_logs))),
            "total_active_minutes": sum(l.active_minutes for l in month_logs),
            "total_distance_km": round(sum(l.distance_km for l in month_logs), 2)
        }
    }
