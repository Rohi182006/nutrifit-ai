from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.entities import Goal, User
from app.schemas.schemas import GoalCreate, GoalUpdate, GoalResponse
from app.routers.deps import get_current_user, require_role

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("/", response_model=List[GoalResponse])
def get_goals(
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    goals = db.query(Goal).filter_by(client_id=current_user.id).all()
    results = []
    for g in goals:
        pct = round(min(100.0, (g.current_value / g.target_value * 100.0) if g.target_value > 0 else 0.0), 1)
        results.append({
            "id": g.id,
            "client_id": g.client_id,
            "title": g.title,
            "category": g.category,
            "target_value": g.target_value,
            "current_value": g.current_value,
            "unit": g.unit,
            "progress_percentage": pct,
            "status": g.status,
            "start_date": g.start_date,
            "target_date": g.target_date
        })
    return results

@router.post("/", response_model=GoalResponse)
def create_goal(
    payload: GoalCreate,
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    g = Goal(
        client_id=current_user.id,
        title=payload.title,
        category=payload.category,
        target_value=payload.target_value,
        current_value=payload.current_value,
        unit=payload.unit,
        target_date=payload.target_date,
        status="in_progress",
        created_by_id=current_user.id
    )
    db.add(g)
    db.commit()
    db.refresh(g)

    pct = round(min(100.0, (g.current_value / g.target_value * 100.0) if g.target_value > 0 else 0.0), 1)
    return {
        "id": g.id,
        "client_id": g.client_id,
        "title": g.title,
        "category": g.category,
        "target_value": g.target_value,
        "current_value": g.current_value,
        "unit": g.unit,
        "progress_percentage": pct,
        "status": g.status,
        "start_date": g.start_date,
        "target_date": g.target_date
    }

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    g = db.query(Goal).filter_by(id=goal_id, client_id=current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")

    if payload.current_value is not None:
        g.current_value = payload.current_value
    if payload.status:
        g.status = payload.status
    if payload.title:
        g.title = payload.title
    if payload.target_value is not None:
        g.target_value = payload.target_value

    db.commit()
    db.refresh(g)

    pct = round(min(100.0, (g.current_value / g.target_value * 100.0) if g.target_value > 0 else 0.0), 1)
    return {
        "id": g.id,
        "client_id": g.client_id,
        "title": g.title,
        "category": g.category,
        "target_value": g.target_value,
        "current_value": g.current_value,
        "unit": g.unit,
        "progress_percentage": pct,
        "status": g.status,
        "start_date": g.start_date,
        "target_date": g.target_date
    }
