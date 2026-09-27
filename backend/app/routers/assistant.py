from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.core.database import get_db
from app.models.entities import User, FoodItem, SearchHistory
from app.schemas.schemas import ChatQueryRequest, ChatQueryResponse, SemanticSearchRequest
from app.routers.deps import get_current_user, require_role
from app.ai.rag_assistant import RAGAssistant
from app.ai.nlp_service import NLPService
from app.ai.semantic_search import SemanticSearchEngine
import json

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=ChatQueryResponse)
def chat_with_assistant(
    payload: ChatQueryRequest,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    """
    RAG-Based AI Nutrition Assistant (Section 13 & 38).
    Retrieves strictly from verified DB tables, respects client allergies and diet,
    provides non-medical disclaimers, and explains recommendations clearly.
    """
    assistant = RAGAssistant(db)
    result = assistant.process_chat(
        client_id=current_user.id,
        user_message=payload.message,
        conversation_history=payload.conversation_history
    )
    return result

@router.post("/search")
def intelligent_food_search(
    payload: SemanticSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Food Search & Semantic Similarity (Section 12 & 30).
    Pipeline: Query -> NLP intent extraction -> Filter extraction -> Semantic Cosine Similarity
    """
    # 1. Extract intent & filters
    nlp_filters = NLPService.extract_intent_and_filters(payload.query)

    # 2. Record search history for personalization weighting (signal 4 in Section 17)
    if current_user.role == "client":
        sh = SearchHistory(
            client_id=current_user.id,
            query=payload.query,
            intent_extracted=nlp_filters.get("diet") or "general_search",
            filters_used=json.dumps(nlp_filters)
        )
        db.add(sh)
        db.commit()

    # 3. Fetch active foods
    all_foods = db.query(FoodItem).filter_by(is_active=True).all()

    # 4. Perform Cosine Similarity Semantic Search
    semantic_engine = SemanticSearchEngine()
    semantic_engine.build_index(all_foods)
    results = semantic_engine.search(payload.query, top_n=payload.limit)

    matched_food_map = {f.id: f for f in all_foods}
    matched_items = []
    for r in results:
        f = matched_food_map.get(r["food_id"])
        if not f:
            continue
        nutr = f.nutrition
        allergen_names = [fa.allergy.name for fa in f.allergens if fa.allergy]
        matched_items.append({
            "id": f.id,
            "name": f.name,
            "category": f.category.name if f.category else "",
            "diet_type": f.diet_type,
            "cuisine": f.cuisine,
            "serving_description": f.serving_description,
            "protein_g": nutr.protein_g if nutr else 0.0,
            "carbs_g": nutr.carbs_g if nutr else 0.0,
            "fat_g": nutr.fat_g if nutr else 0.0,
            "calories": nutr.calories if nutr else 0.0,
            "source": nutr.source if nutr else "IFCT",
            "similarity_score": r["similarity_score"],
            "allergens": allergen_names
        })

    return {
        "nlp_analysis": nlp_filters,
        "results_count": len(matched_items),
        "results": matched_items
    }
