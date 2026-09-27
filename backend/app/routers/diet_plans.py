from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.entities import DietPlanTemplate, NutritionLog, User
from app.schemas.schemas import DietPlanResponse, DietPlanLogMealRequest, NutritionLogResponse
from app.routers.deps import get_optional_current_user, require_role

router = APIRouter(prefix="/diet-plans", tags=["Diet Plans"])

def normalize_weight_range(weight_kg: float) -> str:
    if weight_kg < 60.0:
        return "50–60 kg"
    elif weight_kg < 70.0:
        return "60–70 kg"
    elif weight_kg < 80.0:
        return "70–80 kg"
    else:
        return "80–90 kg"

def format_plan_response(plan: DietPlanTemplate, goal: str = "Maintain") -> DietPlanResponse:
    goal_clean = (goal or "Maintain").capitalize()
    if goal_clean in ("Gain", "Muscle"):
        active_goal = "Gain"
        calories = plan.calories_gain
        protein = round(plan.protein_target_g * 1.1, 1)
        carbs = round(plan.carbs_target_g * 1.15, 1)
        fat = plan.fat_target_g
        guidance = "Caloric surplus (+15–20%) focused on high muscle protein synthesis and glycogen loading."
    elif goal_clean in ("Loss", "Fat loss", "Cut"):
        active_goal = "Loss"
        calories = plan.calories_loss
        protein = round(plan.protein_target_g * 1.05, 1)  # preserve muscle during cut
        carbs = round(plan.carbs_target_g * 0.75, 1)
        fat = round(plan.fat_target_g * 0.85, 1)
        guidance = "Moderate caloric deficit (-15–20%) preserving lean athletic muscle with prioritized fibrous vegetables and lean proteins."
    else:
        active_goal = "Maintain"
        calories = plan.calories_maintain
        protein = plan.protein_target_g
        carbs = plan.carbs_target_g
        fat = plan.fat_target_g
        guidance = "Maintenance energy equilibrium matched to sport training expenditure and cognitive alertness."

    return DietPlanResponse(
        id=plan.id,
        weight_range=plan.weight_range,
        weight_min_kg=plan.weight_min_kg,
        weight_max_kg=plan.weight_max_kg,
        activity_type=plan.activity_type,
        activity=plan.activity,
        activity_intensity=plan.activity_intensity,
        nutrition_priority=plan.nutrition_priority,
        main_food_groups=plan.main_food_groups,
        breakfast=plan.breakfast,
        mid_morning=plan.mid_morning,
        lunch=plan.lunch,
        pre_training=plan.pre_training,
        post_training=plan.post_training,
        dinner=plan.dinner,
        hydration=plan.hydration,
        app_personalization=plan.app_personalization,
        portion_logic=plan.portion_logic,
        active_goal=active_goal,
        target_calories=calories,
        target_protein_g=protein,
        target_carbs_g=carbs,
        target_fat_g=fat,
        water_liters_min=plan.water_liters_min,
        water_liters_max=plan.water_liters_max,
        goal_guidance=guidance,
        icon=plan.icon
    )

@router.get("/categories")
def get_diet_plan_categories():
    """
    Returns reference metadata, weight categories, available activities,
    and goal definitions as specified in the PDF reference dataset (Pages 1–14).
    """
    return {
        "weight_categories": [
            {
                "range": "50–60 kg",
                "min_kg": 50.0,
                "max_kg": 60.0,
                "label": "50–60 kg",
                "badge": "Lightweight / Agile",
                "baseline_calories": "1900–2150 kcal"
            },
            {
                "range": "60–70 kg",
                "min_kg": 60.0,
                "max_kg": 70.0,
                "label": "60–70 kg",
                "badge": "Standard Athletic",
                "baseline_calories": "2200–2450 kcal"
            },
            {
                "range": "70–80 kg",
                "min_kg": 70.0,
                "max_kg": 80.0,
                "label": "70–80 kg",
                "badge": "Strength / Power",
                "baseline_calories": "2500–2750 kcal"
            },
            {
                "range": "80–90 kg",
                "min_kg": 80.0,
                "max_kg": 90.0,
                "label": "80–90 kg",
                "badge": "Heavyweight / High Energy",
                "baseline_calories": "2800–3100 kcal"
            }
        ],
        "activities": [
            {
                "name": "Cricket",
                "type": "Sports",
                "intensity": "Moderate–high",
                "icon": "cricket",
                "priority": "Carbohydrates + protein + hydration"
            },
            {
                "name": "Football",
                "type": "Sports",
                "intensity": "High",
                "icon": "football",
                "priority": "Carbohydrates + protein + electrolytes"
            },
            {
                "name": "Volleyball",
                "type": "Sports",
                "intensity": "Moderate–high",
                "icon": "volleyball",
                "priority": "Carbohydrates + protein + hydration"
            },
            {
                "name": "Hockey",
                "type": "Sports",
                "intensity": "High",
                "icon": "hockey",
                "priority": "Carbohydrates + protein + fluids"
            },
            {
                "name": "Badminton",
                "type": "Sports",
                "intensity": "Moderate–high",
                "icon": "badminton",
                "priority": "Balanced carbs + protein + hydration"
            },
            {
                "name": "Bodybuilding",
                "type": "Bodybuilding",
                "intensity": "Strength training",
                "icon": "dumbbell",
                "priority": "Protein + balanced carbohydrates + healthy fats"
            }
        ],
        "goals": [
            {
                "id": "Gain",
                "label": "Muscle Gain / Surplus",
                "description": "+15–20% caloric surplus, progressive protein and complex carbohydrate loading"
            },
            {
                "id": "Maintain",
                "label": "Athletic Maintenance",
                "description": "Equilibrium calories matched to daily training load for peak endurance and agility"
            },
            {
                "id": "Loss",
                "label": "Fat Loss / Caloric Deficit",
                "description": "-15–20% caloric deficit while preserving lean athletic mass with elevated protein"
            }
        ],
        "dataset_meta": {
            "title": "Fitness Tracking App – Weight & Activity Diet Data",
            "logic": "Weight → Activity → Goal → Personalized meal plan",
            "source": "PDF Reference Dataset (Pages 1–14)"
        }
    }

@router.get("/", response_model=List[DietPlanResponse])
def get_diet_plans(
    weight_range: Optional[str] = Query(None, description="Weight category range e.g. '50–60 kg'"),
    weight_kg: Optional[float] = Query(None, description="Exact weight in kg to auto-categorize"),
    activity: Optional[str] = Query(None, description="Sport or activity name e.g. 'Cricket', 'Bodybuilding'"),
    activity_type: Optional[str] = Query(None, description="'Sports' or 'Bodybuilding'"),
    goal: Optional[str] = Query("Maintain", description="'Gain', 'Maintain', or 'Loss'"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Fetch diet plans divided by weight category and activity type according to the PDF reference dataset.
    """
    query = db.query(DietPlanTemplate)

    # 1. Determine weight range
    selected_range = weight_range if isinstance(weight_range, str) else None
    if not selected_range and isinstance(weight_kg, (int, float)):
        selected_range = normalize_weight_range(weight_kg)

    if selected_range:
        # Handle variations like "50-60", "50–60", "50-60 kg", "50–60 kg"
        clean_range = selected_range.replace(" ", "").replace("-", "–")
        query = query.filter(
            (DietPlanTemplate.weight_range == selected_range) |
            (DietPlanTemplate.weight_range.ilike(f"%{clean_range[:5]}%"))
        )

    # 2. Filter by Activity
    if activity and isinstance(activity, str) and activity.lower() != "all":
        query = query.filter(DietPlanTemplate.activity.ilike(activity.strip()))

    # 3. Filter by Activity Type
    if activity_type and isinstance(activity_type, str) and activity_type.lower() != "all":
        query = query.filter(DietPlanTemplate.activity_type.ilike(activity_type.strip()))

    # Default order by weight range and activity
    plans = query.order_by(DietPlanTemplate.weight_min_kg.asc(), DietPlanTemplate.activity.asc()).all()

    active_goal_str = goal if isinstance(goal, str) else "Maintain"
    return [format_plan_response(p, goal=active_goal_str) for p in plans]

@router.get("/{plan_id}", response_model=DietPlanResponse)
def get_diet_plan_detail(
    plan_id: int,
    goal: Optional[str] = Query("Maintain"),
    db: Session = Depends(get_db)
):
    """
    Retrieve single diet plan template by ID with tailored goal metrics.
    """
    plan = db.query(DietPlanTemplate).filter_by(id=plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diet plan template with ID {plan_id} not found."
        )
    active_goal_str = goal if isinstance(goal, str) else "Maintain"
    return format_plan_response(plan, goal=active_goal_str)


@router.post("/log-meal", response_model=NutritionLogResponse)
def log_diet_plan_meal(
    payload: DietPlanLogMealRequest,
    current_user: User = Depends(require_role(["client", "coach", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Instantly log a meal recommendation from the active diet plan into the user's daily Nutrition Log.
    """
    plan = db.query(DietPlanTemplate).filter_by(id=payload.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diet plan with ID {payload.plan_id} not found."
        )

    meal_name = payload.custom_food_name or f"{plan.activity} Plan {payload.meal_type}"

    new_log = NutritionLog(
        client_id=current_user.id,
        meal_type=payload.meal_type,
        food_item_id=None,
        custom_food_name=meal_name,
        serving_quantity=payload.serving_quantity,
        serving_unit=payload.serving_unit,
        protein_g=round(payload.protein_g, 1),
        calories=round(payload.calories, 1),
        log_date=datetime.now(timezone.utc),
        notes=payload.notes or f"Logged from {plan.weight_range} {plan.activity} Diet Plan"
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "id": new_log.id,
        "meal_type": new_log.meal_type,
        "food_item_id": new_log.food_item_id,
        "food_name": new_log.custom_food_name,
        "serving_quantity": new_log.serving_quantity,
        "serving_unit": new_log.serving_unit,
        "protein_g": new_log.protein_g,
        "calories": new_log.calories,
        "log_date": new_log.log_date,
        "notes": new_log.notes
    }
