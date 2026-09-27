from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    User, ClientProfile, ClientPreference, ClientAllergy, ClientFoodAvoidance,
    Allergy, ActivityLog, NutritionLog, Workout, Goal, FoodItem, CoachClient
)
from app.schemas.schemas import CompleteOnboardingRequest, ClientProfileDetailResponse
from app.routers.deps import get_current_user, require_role
from app.ai.recommendation_engine import RecommendationEngine
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.post("/onboarding")
def complete_onboarding(
    payload: CompleteOnboardingRequest,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    """
    Multi-Step Onboarding (Section 4):
    Step 1: Age & Language
    Step 2: Fitness Goal
    Step 3: Dietary Preference & Custom Exclusions
    Step 4: Preferred Cuisine
    Step 5: Food Restrictions (Allergies & Avoidance items)
    Step 6: Activity Level (collected once only)
    """
    # 1. Update ClientProfile
    profile = db.query(ClientProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        profile = ClientProfile(user_id=current_user.id)
        db.add(profile)
    profile.age = payload.age
    profile.preferred_language = payload.preferred_language

    # 2. Update ClientPreferences
    pref = db.query(ClientPreference).filter_by(client_id=current_user.id).first()
    if not pref:
        pref = ClientPreference(client_id=current_user.id)
        db.add(pref)
    pref.fitness_goal = payload.fitness_goal
    pref.diet_type = payload.diet_type
    pref.custom_diet_exclusions = payload.custom_diet_exclusions
    pref.preferred_cuisine = payload.preferred_cuisine
    pref.activity_level = payload.activity_level
    pref.notes = payload.personal_notes

    # 3. Update ClientAllergies
    db.query(ClientAllergy).filter_by(client_id=current_user.id).delete()
    if payload.allergy_ids:
        valid_allergy_ids = {a.id for a in db.query(Allergy.id).all()}
        for aid in payload.allergy_ids:
            if aid in valid_allergy_ids:
                ca = ClientAllergy(client_id=current_user.id, allergy_id=aid)
                db.add(ca)

    # 4. Update ClientFoodAvoidance
    db.query(ClientFoodAvoidance).filter_by(client_id=current_user.id).delete()
    for item in payload.avoidance_items:
        clean_item = item.strip()
        if clean_item:
            cfa = ClientFoodAvoidance(client_id=current_user.id, avoidance_item=clean_item)
            db.add(cfa)

    # Automatically initialize default starter goals based on their fitness goal
    existing_goals = db.query(Goal).filter_by(client_id=current_user.id).all()
    if not existing_goals:
        goal_title = f"{payload.fitness_goal} Consistency"
        g1 = Goal(
            client_id=current_user.id,
            title=goal_title,
            category="workout_consistency",
            target_value=4.0,
            current_value=0.0,
            unit="workouts/week",
            status="in_progress"
        )
        g2 = Goal(
            client_id=current_user.id,
            title="Balanced Protein Food Discovery",
            category="balanced_food",
            target_value=100.0,
            current_value=25.0,
            unit="%",
            status="in_progress"
        )
        db.add_all([g1, g2])

    db.commit()
    return {"message": "Onboarding completed successfully!", "has_completed_onboarding": True}

@router.get("/profile", response_model=ClientProfileDetailResponse)
def get_client_profile(
    current_user: User = Depends(require_role(["client", "coach", "admin"])),
    db: Session = Depends(get_db)
):
    profile = db.query(ClientProfile).filter_by(user_id=current_user.id).first()
    pref = db.query(ClientPreference).filter_by(client_id=current_user.id).first()

    client_allergies = db.query(ClientAllergy).filter_by(client_id=current_user.id).all()
    allergies = [
        ca.allergy.name for ca in client_allergies if ca.allergy
    ]
    allergy_ids = [
        ca.allergy_id for ca in client_allergies
    ]
    avoidances = [
        cfa.avoidance_item for cfa in db.query(ClientFoodAvoidance).filter_by(client_id=current_user.id).all()
    ]

    # Check assigned coach
    assigned_mapping = db.query(CoachClient).filter_by(client_id=current_user.id, status="active").first()
    assigned_coach_data = None
    if assigned_mapping and assigned_mapping.coach:
        assigned_coach_data = {
            "id": assigned_mapping.coach.id,
            "name": assigned_mapping.coach.full_name,
            "email": assigned_mapping.coach.email,
            "specialization": assigned_mapping.coach.coach_profile.specialization if assigned_mapping.coach.coach_profile else "Nutrition & Wellness"
        }

    return {
        "id": profile.id if profile else 0,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "age": profile.age if profile else None,
        "preferred_language": profile.preferred_language if profile else "English",
        "preferences": pref,
        "allergies": allergies,
        "allergy_ids": allergy_ids,
        "avoidances": avoidances,
        "assigned_coach": assigned_coach_data
    }

@router.get("/dashboard")
def get_client_dashboard(
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    """
    Client Dashboard (Section 5):
    - Greeting, Today's Activity, Workout Status, Nutrition Logs
    - Protein Food Suggestions (Top 4), Active Goals, Weekly Progress
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # Today's activity
    today_activity = db.query(ActivityLog).filter(
        ActivityLog.client_id == current_user.id,
        ActivityLog.log_date >= today_start
    ).first()

    # Recent workout
    recent_workout = db.query(Workout).filter(
        Workout.client_id == current_user.id
    ).order_by(Workout.workout_date.desc()).first()

    # Today's nutrition logs
    today_meals = db.query(NutritionLog).filter(
        NutritionLog.client_id == current_user.id,
        NutritionLog.log_date >= today_start
    ).all()

    total_protein_today = sum(m.protein_g for m in today_meals)
    total_calories_today = sum(m.calories for m in today_meals)

    # Active Goals
    active_goals = db.query(Goal).filter_by(client_id=current_user.id, status="in_progress").all()
    goals_data = []
    for g in active_goals:
        pct = round(min(100.0, (g.current_value / g.target_value * 100.0) if g.target_value > 0 else 0.0), 1)
        goals_data.append({
            "id": g.id,
            "title": g.title,
            "category": g.category,
            "target": g.target_value,
            "current": g.current_value,
            "unit": g.unit,
            "progress_percentage": pct
        })

    # AI Protein Recommendations preview
    rec_engine = RecommendationEngine(db)
    recommendations = rec_engine.generate_recommendations(client_id=current_user.id, limit=4)

    formatted_recs = []
    for r in recommendations:
        f = r["food"]
        formatted_recs.append({
            "id": f.id,
            "name": f.name,
            "category": f.category.name if f.category else "",
            "diet_type": f.diet_type,
            "cuisine": f.cuisine,
            "serving_description": f.serving_description,
            "protein_g": f.nutrition.protein_g if f.nutrition else 0.0,
            "calories": f.nutrition.calories if f.nutrition else 0.0,
            "match_score": r["match_score"],
            "explanation_points": r["explanation_points"],
            "is_favorite": r["is_favorite"]
        })

    return {
        "greeting": f"Good Day, {current_user.full_name} 👋",
        "today_overview": {
            "steps": today_activity.steps if today_activity else 0,
            "active_minutes": today_activity.active_minutes if today_activity else 0,
            "calories_burned": today_activity.calories_burned if today_activity else 0.0,
            "protein_consumed_g": round(total_protein_today, 1),
            "calories_consumed": round(total_calories_today, 1),
            "meals_logged_count": len(today_meals),
            "recent_workout": {
                "type": recent_workout.workout_type,
                "duration": recent_workout.duration_minutes,
                "date": recent_workout.workout_date
            } if recent_workout else None
        },
        "protein_suggestions": formatted_recs,
        "goals": goals_data,
        "recent_meals": [
            {
                "id": m.id,
                "meal_type": m.meal_type,
                "food_name": m.food_item.name if m.food_item else (m.custom_food_name or "Meal"),
                "protein_g": m.protein_g,
                "calories": m.calories,
                "serving": f"{m.serving_quantity} {m.serving_unit}"
            } for m in today_meals[:5]
        ]
    }
