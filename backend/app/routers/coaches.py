from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.entities import (
    User, CoachClient, ClientProfile, ClientPreference, Workout,
    ActivityLog, NutritionLog, Goal, Recommendation, FavoriteFood, RecommendationFeedback
)
from app.schemas.schemas import GoalCreate, GoalResponse
from app.routers.deps import get_current_user, require_role, verify_coach_client_assignment

router = APIRouter(prefix="/coaches", tags=["Coaches"])

@router.get("/clients")
def get_assigned_clients(
    current_user: User = Depends(require_role(["coach"])),
    db: Session = Depends(get_db)
):
    """
    Coach can view ONLY clients explicitly assigned to them via coach_clients table (Section 2 & 24).
    """
    assignments = db.query(CoachClient).filter_by(coach_id=current_user.id, status="active").all()
    results = []
    for a in assignments:
        client_user = a.client
        if not client_user:
            continue
        pref = client_user.client_preferences
        recent_rec = db.query(Recommendation).filter_by(client_id=client_user.id).order_by(Recommendation.created_at.desc()).first()

        results.append({
            "assignment_id": a.id,
            "client_id": client_user.id,
            "name": client_user.full_name,
            "email": client_user.email,
            "diet_type": pref.diet_type if pref else "Not set",
            "fitness_goal": pref.fitness_goal if pref else "Not set",
            "preferred_cuisine": pref.preferred_cuisine if pref else "Not set",
            "activity_level": pref.activity_level if pref else "Not set",
            "assigned_at": a.assigned_at,
            "coach_notes": a.notes,
            "recent_recommendation_date": recent_rec.created_at if recent_rec else None
        })
    return results

@router.get("/clients/{client_id}")
def get_assigned_client_detail(
    client_id: int,
    current_user: User = Depends(require_role(["coach"])),
    db: Session = Depends(get_db)
):
    """
    Coach view client profile, activity, workouts, nutrition, recommendations, and goals.
    Strictly enforces coach_clients assignment boundary; raises 403 Forbidden if not assigned!
    """
    # Enforce strict coach_clients mapping at API layer
    assignment = verify_coach_client_assignment(coach_id=current_user.id, client_id=client_id, db=db)

    client_user = db.query(User).filter_by(id=client_id).first()
    if not client_user:
        raise HTTPException(status_code=404, detail="Client user not found")

    profile = client_user.client_profile
    pref = client_user.client_preferences
    allergies = [ca.allergy.name for ca in client_user.client_allergies if ca.allergy]
    avoidances = [cfa.avoidance_item for cfa in client_user.client_food_avoidance]

    workouts = db.query(Workout).filter_by(client_id=client_id).order_by(Workout.workout_date.desc()).limit(10).all()
    activities = db.query(ActivityLog).filter_by(client_id=client_id).order_by(ActivityLog.log_date.desc()).limit(14).all()
    meals = db.query(NutritionLog).filter_by(client_id=client_id).order_by(NutritionLog.log_date.desc()).limit(15).all()
    goals = db.query(Goal).filter_by(client_id=client_id).all()
    recs = db.query(Recommendation).filter_by(client_id=client_id).order_by(Recommendation.created_at.desc()).limit(5).all()
    favs = db.query(FavoriteFood).filter_by(client_id=client_id).all()

    return {
        "client": {
            "id": client_user.id,
            "name": client_user.full_name,
            "email": client_user.email,
            "age": profile.age if profile else None,
            "preferred_language": profile.preferred_language if profile else "English",
            "diet_type": pref.diet_type if pref else "Vegetarian",
            "fitness_goal": pref.fitness_goal if pref else "General fitness",
            "cuisine": pref.preferred_cuisine if pref else "Indian",
            "activity_level": pref.activity_level if pref else "Moderate",
            "allergies": allergies,
            "avoidances": avoidances,
            "notes": assignment.notes
        },
        "workouts": [
            {
                "id": w.id,
                "type": w.workout_type,
                "duration": w.duration_minutes,
                "difficulty": w.difficulty,
                "date": w.workout_date,
                "notes": w.notes
            } for w in workouts
        ],
        "activities": [
            {
                "id": a.id,
                "steps": a.steps,
                "active_minutes": a.active_minutes,
                "distance_km": a.distance_km,
                "calories": a.calories_burned,
                "date": a.log_date
            } for a in activities
        ],
        "nutrition_logs": [
            {
                "id": m.id,
                "meal_type": m.meal_type,
                "food_name": m.food_item.name if m.food_item else (m.custom_food_name or "Meal"),
                "protein_g": m.protein_g,
                "calories": m.calories,
                "date": m.log_date
            } for m in meals
        ],
        "goals": [
            {
                "id": g.id,
                "title": g.title,
                "target": g.target_value,
                "current": g.current_value,
                "unit": g.unit,
                "status": g.status
            } for g in goals
        ],
        "favorite_foods": [
            {
                "id": f.food.id,
                "name": f.food.name,
                "category": f.food.category.name if f.food.category else "",
                "diet_type": f.food.diet_type,
                "protein_g": f.food.nutrition.protein_g if f.food.nutrition else 0.0
            } for f in favs if f.food
        ]
    }

@router.post("/clients/{client_id}/goals", response_model=GoalResponse)
def coach_create_client_goal(
    client_id: int,
    payload: GoalCreate,
    current_user: User = Depends(require_role(["coach"])),
    db: Session = Depends(get_db)
):
    """Coach assigns a goal to an assigned client."""
    verify_coach_client_assignment(coach_id=current_user.id, client_id=client_id, db=db)

    goal = Goal(
        client_id=client_id,
        title=payload.title,
        category=payload.category,
        target_value=payload.target_value,
        current_value=payload.current_value,
        unit=payload.unit,
        target_date=payload.target_date,
        status="in_progress",
        created_by_id=current_user.id
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    pct = round(min(100.0, (goal.current_value / goal.target_value * 100.0) if goal.target_value > 0 else 0.0), 1)
    return {
        "id": goal.id,
        "client_id": goal.client_id,
        "title": goal.title,
        "category": goal.category,
        "target_value": goal.target_value,
        "current_value": goal.current_value,
        "unit": goal.unit,
        "progress_percentage": pct,
        "status": goal.status,
        "start_date": goal.start_date,
        "target_date": goal.target_date
    }

@router.post("/clients/{client_id}/notes")
def coach_update_client_notes(
    client_id: int,
    payload: Dict[str, str],
    current_user: User = Depends(require_role(["coach"])),
    db: Session = Depends(get_db)
):
    assignment = verify_coach_client_assignment(coach_id=current_user.id, client_id=client_id, db=db)
    assignment.notes = payload.get("notes", "")
    db.commit()
    return {"message": "Coach notes updated successfully.", "notes": assignment.notes}
