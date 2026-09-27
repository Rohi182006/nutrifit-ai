from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
from app.core.database import get_db
from app.models.entities import (
    User, UserRole, CoachClient, FoodItem, FoodNutrition, FoodCategory,
    FoodAllergen, Allergy, RecommendationRule, RecommendationFeedback,
    Recommendation, AuditLog, Exercise
)
from app.schemas.schemas import (
    FoodItemCreate, RecommendationRuleResponse, RecommendationRuleUpdate,
    CoachClientAssignRequest, SystemAnalyticsResponse, ExerciseCreate
)
from app.routers.deps import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Admin"])

def log_admin_action(db: Session, user_id: int, action: str, entity_type: str, entity_id: Optional[int], details: str):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(audit)
    db.commit()

@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if role:
        q = q.filter_by(role=role)
    users = q.offset(offset).limit(limit).all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "diet_type": u.client_preferences.diet_type if u.client_preferences else None,
            "fitness_goal": u.client_preferences.fitness_goal if u.client_preferences else None
        } for u in users
    ]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: Dict[str, str],
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = payload.get("role")
    if new_role not in [UserRole.CLIENT.value, UserRole.COACH.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    old_role = target.role
    target.role = new_role
    db.commit()

    log_admin_action(
        db, current_user.id, "UPDATE_USER_ROLE", "User", user_id,
        f"Changed role of {target.email} from {old_role} to {new_role}"
    )
    return {"message": "User role updated successfully", "new_role": new_role}

# --- COACH-CLIENT ASSIGNMENT MANAGEMENT ---
@router.get("/coach-assignments")
def get_coach_assignments(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    assignments = db.query(CoachClient).all()
    results = []
    for a in assignments:
        results.append({
            "id": a.id,
            "coach_id": a.coach_id,
            "coach_name": a.coach.full_name if a.coach else "",
            "coach_email": a.coach.email if a.coach else "",
            "client_id": a.client_id,
            "client_name": a.client.full_name if a.client else "",
            "client_email": a.client.email if a.client else "",
            "assigned_at": a.assigned_at,
            "status": a.status,
            "notes": a.notes
        })
    return results

@router.post("/coach-assignments")
def assign_coach_to_client(
    payload: CoachClientAssignRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    coach = db.query(User).filter_by(id=payload.coach_id, role=UserRole.COACH.value).first()
    if not coach:
        raise HTTPException(status_code=400, detail="Specified coach ID does not exist or is not a coach.")

    client = db.query(User).filter_by(id=payload.client_id, role=UserRole.CLIENT.value).first()
    if not client:
        raise HTTPException(status_code=400, detail="Specified client ID does not exist or is not a client.")

    existing = db.query(CoachClient).filter_by(client_id=payload.client_id, status="active").first()
    if existing:
        existing.status = "reassigned"

    assignment = CoachClient(
        coach_id=payload.coach_id,
        client_id=payload.client_id,
        notes=payload.notes,
        status="active"
    )
    db.add(assignment)
    db.commit()

    log_admin_action(
        db, current_user.id, "ASSIGN_COACH_CLIENT", "CoachClient", assignment.id,
        f"Assigned coach {coach.full_name} to client {client.full_name}"
    )
    return {"message": "Coach successfully assigned to client!", "assignment_id": assignment.id}

# --- RECOMMENDATION RULE WEIGHTS CONFIGURATION (Section 9 & 26) ---
@router.get("/recommendation-rules", response_model=List[RecommendationRuleResponse])
def get_recommendation_rules(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(RecommendationRule).all()

@router.put("/recommendation-rules/{rule_id}")
def update_recommendation_rule(
    rule_id: int,
    payload: RecommendationRuleUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    rule = db.query(RecommendationRule).filter_by(id=rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Recommendation rule not found")

    old_weight = rule.weight
    rule.weight = payload.weight
    rule.is_active = payload.is_active
    db.commit()

    log_admin_action(
        db, current_user.id, "UPDATE_RECOMMENDATION_RULE", "RecommendationRule", rule.id,
        f"Updated weight for '{rule.rule_name}' from {old_weight} to {payload.weight}, active={payload.is_active}"
    )
    return {"message": "Rule weight updated successfully", "rule": rule}

# --- FOOD DATABASE MANAGEMENT ---
@router.post("/foods")
def create_food_item(
    payload: FoodItemCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    category = db.query(FoodCategory).filter_by(id=payload.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid food category")

    food = FoodItem(
        name=payload.name,
        category_id=payload.category_id,
        food_type=payload.food_type,
        diet_type=payload.diet_type,
        cuisine=payload.cuisine,
        serving_description=payload.serving_description,
        serving_unit=payload.serving_unit,
        tags=payload.tags,
        is_active=True
    )
    db.add(food)
    db.flush()

    nutrition = FoodNutrition(
        food_id=food.id,
        protein_g=payload.protein_g,
        carbs_g=payload.carbs_g,
        fat_g=payload.fat_g,
        calories=payload.calories,
        fiber_g=payload.fiber_g,
        source=payload.source,
        verified=True
    )
    db.add(nutrition)

    # Link structured allergens junction table
    for aid in payload.allergy_ids:
        fa = FoodAllergen(food_id=food.id, allergy_id=aid)
        db.add(fa)

    db.commit()

    log_admin_action(
        db, current_user.id, "CREATE_FOOD", "FoodItem", food.id,
        f"Created verified food item '{food.name}' sourced from {payload.source}"
    )
    return {"message": "Food item created successfully", "food_id": food.id}

@router.delete("/foods/{food_id}")
def delete_food_item(
    food_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    food = db.query(FoodItem).filter_by(id=food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    food.is_active = False
    db.commit()

    log_admin_action(
        db, current_user.id, "DEACTIVATE_FOOD", "FoodItem", food_id,
        f"Deactivated food item '{food.name}'"
    )
    return {"message": "Food item deactivated."}

# --- SYSTEM ANALYTICS & AUDIT LOGS ---
@router.get("/system-analytics")
def get_system_analytics(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_clients = db.query(User).filter_by(role=UserRole.CLIENT.value).count()
    total_coaches = db.query(User).filter_by(role=UserRole.COACH.value).count()
    total_foods = db.query(FoodItem).filter_by(is_active=True).count()
    total_recs = db.query(Recommendation).count()

    feedbacks = db.query(RecommendationFeedback).all()
    accepted = sum(1 for fb in feedbacks if fb.is_useful)
    acceptance_rate = round((accepted / max(1, len(feedbacks))) * 100.0, 1)

    # Top Food Categories
    categories = db.query(FoodCategory).all()
    cat_counts = []
    for c in categories:
        count = len(c.foods)
        cat_counts.append({
            "category": c.name,
            "count": count
        })
    cat_counts.sort(key=lambda x: x["count"], reverse=True)

    # Preference distribution
    veg_count = db.query(FoodItem).filter_by(diet_type="Vegetarian", is_active=True).count()
    vegan_count = db.query(FoodItem).filter_by(diet_type="Vegan", is_active=True).count()
    eggetarian_count = db.query(FoodItem).filter_by(diet_type="Eggetarian", is_active=True).count()
    nonveg_count = db.query(FoodItem).filter_by(diet_type="Non-Vegetarian", is_active=True).count()

    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_coaches": total_coaches,
        "total_food_items": total_foods,
        "recommendations_generated": total_recs,
        "recommendation_acceptance_rate": acceptance_rate,
        "active_users": total_users,
        "top_categories": cat_counts[:6],
        "diet_distribution": {
            "Vegetarian": veg_count,
            "Vegan": vegan_count,
            "Eggetarian": eggetarian_count,
            "Non-Vegetarian": nonveg_count
        }
    }

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_email": l.user.email if l.user else "System",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "created_at": l.created_at
        } for l in logs
    ]
