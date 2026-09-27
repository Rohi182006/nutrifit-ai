from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.entities import NutritionLog, FoodItem, User
from app.schemas.schemas import NutritionLogCreate, NutritionLogResponse
from app.routers.deps import get_current_user, require_role

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

@router.get("/", response_model=List[NutritionLogResponse])
def get_nutrition_logs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    logs = db.query(NutritionLog).filter_by(client_id=current_user.id).order_by(NutritionLog.log_date.desc()).offset(offset).limit(limit).all()
    results = []
    for l in logs:
        food_name = l.food_item.name if l.food_item else (l.custom_food_name or "Custom Food")
        results.append({
            "id": l.id,
            "meal_type": l.meal_type,
            "food_item_id": l.food_item_id,
            "food_name": food_name,
            "serving_quantity": l.serving_quantity,
            "serving_unit": l.serving_unit,
            "protein_g": l.protein_g,
            "calories": l.calories,
            "log_date": l.log_date,
            "notes": l.notes
        })
    return results

@router.post("/", response_model=NutritionLogResponse)
def log_meal(
    payload: NutritionLogCreate,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    food_name = payload.custom_food_name
    protein = payload.protein_g
    cals = payload.calories

    if payload.food_item_id:
        f = db.query(FoodItem).filter_by(id=payload.food_item_id).first()
        if f:
            food_name = f.name
            if f.nutrition:
                # scale with quantity
                protein = round(f.nutrition.protein_g * payload.serving_quantity, 1)
                cals = round(f.nutrition.calories * payload.serving_quantity, 1)

    nl = NutritionLog(
        client_id=current_user.id,
        meal_type=payload.meal_type,
        food_item_id=payload.food_item_id,
        custom_food_name=food_name,
        serving_quantity=payload.serving_quantity,
        serving_unit=payload.serving_unit,
        protein_g=protein,
        calories=cals,
        notes=payload.notes,
        log_date=payload.log_date or datetime.now(timezone.utc)
    )
    db.add(nl)
    db.commit()
    db.refresh(nl)

    return {
        "id": nl.id,
        "meal_type": nl.meal_type,
        "food_item_id": nl.food_item_id,
        "food_name": food_name or "Meal",
        "serving_quantity": nl.serving_quantity,
        "serving_unit": nl.serving_unit,
        "protein_g": nl.protein_g,
        "calories": nl.calories,
        "log_date": nl.log_date,
        "notes": nl.notes
    }

@router.delete("/{log_id}")
def delete_meal_log(
    log_id: int,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    log = db.query(NutritionLog).filter_by(id=log_id, client_id=current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log entry not found")
    db.delete(log)
    db.commit()
    return {"message": "Meal log deleted successfully."}
