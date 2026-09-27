from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.entities import (
    User, Recommendation, RecommendationItem, RecommendationRule,
    RecommendationFeedback, FoodItem, ClientPreference
)
from app.schemas.schemas import (
    RecommendationResponse, RecommendationItemResponse,
    RecommendationFeedbackCreate, RecommendationRuleResponse
)
from app.routers.deps import get_current_user, require_role
from app.ai.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/", response_model=RecommendationResponse)
def get_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    query: Optional[str] = None,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    """
    Intelligent Protein Recommendation Endpoint (Sections 7, 8, 9, 10, 11).
    Hard-filtering -> Soft preference scoring -> Nutrition ranking -> Personalization -> Explainability
    """
    rec_engine = RecommendationEngine(db)
    scored_results = rec_engine.generate_recommendations(
        client_id=current_user.id,
        limit=limit,
        custom_query=query
    )

    # Record recommendation event
    session_id = str(uuid.uuid4())
    pref = db.query(ClientPreference).filter_by(client_id=current_user.id).first()
    context_snapshot = {
        "diet": pref.diet_type if pref else "Vegetarian",
        "cuisine": pref.preferred_cuisine if pref else "Indian",
        "fitness_goal": pref.fitness_goal if pref else "General fitness",
        "query": query
    }

    rec_record = Recommendation(
        client_id=current_user.id,
        session_id=session_id,
        prompt_query=query,
        context_snapshot=json.dumps(context_snapshot)
    )
    db.add(rec_record)
    db.flush()

    response_items = []
    for rank, item in enumerate(scored_results, start=1):
        f = item["food"]
        nutr = f.nutrition

        # Persist recommendation item
        rec_item = RecommendationItem(
            recommendation_id=rec_record.id,
            food_id=f.id,
            match_score=item["match_score"],
            diet_match_score=item["diet_match_score"],
            cuisine_match_score=item["cuisine_match_score"],
            preference_match_score=item["preference_match_score"],
            feedback_score=item["feedback_score"],
            nutrition_score=item["nutrition_score"],
            explanation_points=json.dumps(item["explanation_points"]),
            rank_order=rank
        )
        db.add(rec_item)
        db.flush()

        response_items.append({
            "id": rec_item.id,
            "food_id": f.id,
            "food_name": f.name,
            "category": f.category.name if f.category else "",
            "diet_type": f.diet_type,
            "cuisine": f.cuisine,
            "serving_description": f.serving_description,
            "protein_g": nutr.protein_g if nutr else 0.0,
            "carbs_g": nutr.carbs_g if nutr else 0.0,
            "fat_g": nutr.fat_g if nutr else 0.0,
            "calories": nutr.calories if nutr else 0.0,
            "source": nutr.source if nutr else "IFCT",
            "match_score": item["match_score"],
            "diet_match_score": item["diet_match_score"],
            "cuisine_match_score": item["cuisine_match_score"],
            "preference_match_score": item["preference_match_score"],
            "feedback_score": item["feedback_score"],
            "nutrition_score": item["nutrition_score"],
            "explanation_points": item["explanation_points"],
            "rank_order": rank,
            "user_feedback": item["user_feedback"],
            "is_favorite": item["is_favorite"]
        })

    db.commit()

    return {
        "recommendation_id": rec_record.id,
        "total_recommendations": len(response_items),
        "items": response_items,
        "context_applied": context_snapshot
    }

@router.post("/feedback")
def submit_feedback(
    payload: RecommendationFeedbackCreate,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    """
    User Feedback System (Section 16).
    Records 👍 / 👎 for a recommended food to calibrate future personalization.
    """
    # Check if feedback already submitted for this recommendation item
    existing = db.query(RecommendationFeedback).filter_by(
        recommendation_item_id=payload.recommendation_item_id,
        client_id=current_user.id
    ).first()

    if existing:
        existing.is_useful = payload.is_useful
        existing.feedback_text = payload.feedback_text
    else:
        fb = RecommendationFeedback(
            recommendation_item_id=payload.recommendation_item_id,
            client_id=current_user.id,
            food_id=payload.food_id,
            is_useful=payload.is_useful,
            feedback_text=payload.feedback_text
        )
        db.add(fb)

    db.commit()
    return {
        "message": "Feedback recorded. Your preference profile has been updated.",
        "is_useful": payload.is_useful
    }

@router.get("/rules", response_model=List[RecommendationRuleResponse])
def get_recommendation_rules(db: Session = Depends(get_db)):
    """Fetch configurable scoring rule weights (Section 9)."""
    return db.query(RecommendationRule).all()
