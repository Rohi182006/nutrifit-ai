from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import FoodItem, ClientPreference, ClientAllergy, ClientFoodAvoidance
from app.ai.recommendation_engine import RecommendationEngine
from app.ai.semantic_search import NLPService, SemanticSearchEngine

MEDICAL_KEYWORDS = [
    "cure", "disease", "treatment", "medicine", "prescribe", "diagnosis",
    "diabetes", "hypertension", "cancer", "kidney failure", "thyroid disease",
    "extreme fasting", "starvation", "anorexia", "bulimia"
]

MEDICAL_DISCLAIMER = (
    "NutriFit AI is a general wellness, fitness, and nutrition information platform. "
    "We do not provide medical diagnosis, treatment, or clinical prescriptions. "
    "For condition-specific management, medical concerns, or clinical diets, please consult a licensed physician or registered dietitian."
)

class RAGAssistant:
    def __init__(self, db: Session):
        self.db = db
        self.rec_engine = RecommendationEngine(db)

    def process_chat(
        self,
        client_id: int,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Retrieval-Augmented Assistant (Section 13):
        1. Checks for medical condition queries & safely redirects.
        2. Retrieves user's dietary profile & hard-filtered verified food items.
        3. Formulates transparent, verified nutrition guidance based strictly on DB facts.
        """
        msg_lower = user_message.lower()

        # 1. Health & Safety Boundary Check (Section 38)
        for med_word in MEDICAL_KEYWORDS:
            if med_word in msg_lower:
                return {
                    "reply": (
                        f"I noticed you mentioned a medical or clinical topic ('{med_word}'). "
                        "As a wellness and nutrition platform, I cannot provide medical advice, diagnosis, or disease-specific treatment plans. "
                        "I strongly encourage you to speak with a qualified physician or registered clinical dietitian who can evaluate your unique medical history."
                    ),
                    "recommended_foods": [],
                    "disclaimer": MEDICAL_DISCLAIMER
                }

        # 2. Fetch Client Profile & Restrictions
        pref = self.db.query(ClientPreference).filter_by(client_id=client_id).first()
        diet_type = pref.diet_type if pref else "Vegetarian"
        pref_cuisine = pref.preferred_cuisine if pref else "Indian"

        client_allergies = self.db.query(ClientAllergy).filter_by(client_id=client_id).all()
        client_allergy_ids = {ca.allergy_id for ca in client_allergies}
        client_avoidances = {fa.avoidance_item for fa in self.db.query(ClientFoodAvoidance).filter_by(client_id=client_id).all()}

        # 3. Retrieve verified candidate foods passing hard filters
        all_foods = self.db.query(FoodItem).filter_by(is_active=True).all()
        safe_foods = self.rec_engine.step1_hard_filter(
            candidate_foods=all_foods,
            diet_type=diet_type,
            custom_diet_exclusions=pref.custom_diet_exclusions if pref else None,
            client_allergy_ids=client_allergy_ids,
            client_avoidances=client_avoidances
        )

        # 4. Use NLP & Semantic Search to match against safe candidates
        semantic_search = SemanticSearchEngine()
        semantic_search.build_index(safe_foods)
        semantic_results = semantic_search.search(user_message, top_n=4)

        matched_food_ids = [r["food_id"] for r in semantic_results]
        matched_foods = [f for f in safe_foods if f.id in matched_food_ids]

        if not matched_foods:
            # Fallback to top safe protein recommendations
            matched_foods = sorted(
                safe_foods,
                key=lambda f: f.nutrition.protein_g if f.nutrition else 0,
                reverse=True
            )[:3]

        # 5. Build grounded, verified response
        food_summaries = []
        rec_cards = []
        for f in matched_foods[:3]:
            nutr = f.nutrition
            prot = f"{nutr.protein_g}g" if nutr else "good source"
            cals = f"{nutr.calories} kcal" if nutr else "balanced"
            src = nutr.source if nutr else "Verified DB"
            summary_line = f"• **{f.name}** ({f.category.name}): Provides **{prot} protein** and {cals} per {f.serving_description} [{f.diet_type}, {f.cuisine} cuisine, Sourced from {src}]."
            food_summaries.append(summary_line)

            rec_cards.append({
                "id": f.id,
                "name": f.name,
                "category": f.category.name if f.category else "",
                "diet_type": f.diet_type,
                "cuisine": f.cuisine,
                "serving_description": f.serving_description,
                "protein_g": nutr.protein_g if nutr else 0.0,
                "calories": nutr.calories if nutr else 0.0,
                "source": src
            })

        foods_text = "\n".join(food_summaries)

        reply_text = (
            f"Based on your **{diet_type}** preference and **{pref_cuisine}** cuisine profile, "
            f"here are verified, protein-rich options retrieved from our nutrition database:\n\n"
            f"{foods_text}\n\n"
            f"**Why these foods?**\n"
            f"Each of these choices respects your dietary boundary, eliminates registered allergens, "
            f"and supplies high protein density to support your wellness goals without restrictive dieting."
        )

        return {
            "reply": reply_text,
            "recommended_foods": rec_cards,
            "disclaimer": MEDICAL_DISCLAIMER
        }
