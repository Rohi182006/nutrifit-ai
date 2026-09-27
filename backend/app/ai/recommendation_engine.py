from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from app.models.entities import (
    FoodItem, FoodCategory, FoodNutrition, FoodAllergen, ClientPreference,
    ClientAllergy, ClientFoodAvoidance, RecommendationRule, RecommendationFeedback,
    FavoriteFood, NutritionLog, SearchHistory, User
)

class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_active_weights(self) -> Dict[str, float]:
        """Load configurable weights from recommendation_rules table (Section 9 & 26)."""
        rules = self.db.query(RecommendationRule).filter_by(is_active=True).all()
        default_weights = {
            "diet_match_weight": 1.0,
            "cuisine_match_weight": 0.8,
            "preference_match_weight": 0.9,
            "feedback_weight": 0.85,
            "nutrition_relevance_weight": 0.95,
        }
        for r in rules:
            default_weights[r.rule_key] = r.weight
        return default_weights

    def step1_hard_filter(
        self,
        candidate_foods: List[FoodItem],
        diet_type: str,
        custom_diet_exclusions: Optional[str],
        client_allergy_ids: Set[int],
        client_avoidances: Set[str]
    ) -> List[FoodItem]:
        """
        Step 1: Hard Filtering (Section 8)
        1. Dietary preference exclusion
        2. Structured allergy intersection (via food_allergens junction table)
        3. Explicit food avoidance list
        """
        filtered_foods = []
        diet_lower = diet_type.lower() if diet_type else "vegetarian"
        custom_excl = [e.strip().lower() for e in (custom_diet_exclusions or "").split(",") if e.strip()]
        client_avoid_lower = {a.strip().lower() for a in client_avoidances if a.strip()}

        for food in candidate_foods:
            food_cat_name = food.category.name.lower() if food.category else ""
            food_diet_lower = food.diet_type.lower() if food.diet_type else ""
            food_name_lower = food.name.lower()

            # --- Rule 1: Diet Exclusions ---
            if diet_lower == "vegan":
                # Vegan excludes all animal products: meat, fish, eggs, dairy, honey, ghee
                if food_cat_name in ["dairy", "eggs", "meat", "fish"]:
                    continue
                if food_diet_lower in ["vegetarian", "eggetarian", "non-vegetarian"]:
                    continue
            elif diet_lower == "vegetarian":
                # Vegetarian excludes meat, fish, eggs (dairy is allowed)
                if food_cat_name in ["meat", "fish", "eggs"]:
                    continue
                if food_diet_lower in ["eggetarian", "non-vegetarian"]:
                    continue
            elif diet_lower == "eggetarian":
                # Eggetarian excludes meat, fish (dairy and eggs allowed)
                if food_cat_name in ["meat", "fish"]:
                    continue
                if food_diet_lower in ["non-vegetarian"]:
                    continue
            elif diet_lower == "other":
                # Check custom user exclusions
                is_excluded = False
                for excl in custom_excl:
                    if excl in food_cat_name or excl in food_name_lower or excl in (food.tags or "").lower():
                        is_excluded = True
                        break
                if is_excluded:
                    continue

            # --- Rule 2: Allergies (Food Allergens junction table match) ---
            if client_allergy_ids:
                food_allergy_ids = {fa.allergy_id for fa in food.allergens}
                if client_allergy_ids.intersection(food_allergy_ids):
                    # Direct allergen violation
                    continue

            # --- Rule 3: Explicit Food Restrictions / Avoidance ---
            is_avoided = False
            for avoid_term in client_avoid_lower:
                if (avoid_term in food_name_lower) or (avoid_term in (food.tags or "").lower()) or (avoid_term in food_cat_name):
                    is_avoided = True
                    break
            if is_avoided:
                continue

            filtered_foods.append(food)

        return filtered_foods

    def calculate_scores_and_explanations(
        self,
        foods: List[FoodItem],
        client_id: int,
        preferences: Optional[ClientPreference],
        weights: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Step 2, 3, 4: Soft Filtering, Nutrition relevance, Personalization & Explainability
        Signal priority (Section 17): Favorites > Feedback > Food Logs > Search History
        """
        # Collect client context signals
        user_favorites = {f.food_id for f in self.db.query(FavoriteFood).filter_by(client_id=client_id).all()}
        
        # User feedback history
        feedbacks = self.db.query(RecommendationFeedback).filter_by(client_id=client_id).all()
        useful_food_ids = {fb.food_id for fb in feedbacks if fb.is_useful}
        not_useful_food_ids = {fb.food_id for fb in feedbacks if not fb.is_useful}

        # Nutrition logs (historical food choices)
        logged_food_ids = {nl.food_item_id for nl in self.db.query(NutritionLog).filter_by(client_id=client_id).all() if nl.food_item_id}

        # Search history
        searches = [s.query.lower() for s in self.db.query(SearchHistory).filter_by(client_id=client_id).all()]

        pref_cuisine = preferences.preferred_cuisine.lower() if preferences and preferences.preferred_cuisine else "indian"
        pref_goal = preferences.fitness_goal.lower() if preferences and preferences.fitness_goal else "general fitness"
        diet_type = preferences.diet_type if preferences and preferences.diet_type else "Vegetarian"

        scored_results = []

        w_diet = weights.get("diet_match_weight", 1.0)
        w_cuisine = weights.get("cuisine_match_weight", 0.8)
        w_pref = weights.get("preference_match_weight", 0.9)
        w_fb = weights.get("feedback_weight", 0.85)
        w_nutr = weights.get("nutrition_relevance_weight", 0.95)
        total_weight = w_diet + w_cuisine + w_pref + w_fb + w_nutr

        for food in foods:
            explanations = []

            # 1. Diet Compatibility (100% since survived hard filter)
            diet_score = 100.0
            explanations.append(f"✓ Matches your {diet_type} dietary preference")

            # 2. Cuisine Match
            cuisine_score = 50.0
            food_cuisine = (food.cuisine or "").lower()
            if pref_cuisine in food_cuisine or food_cuisine in pref_cuisine or pref_cuisine == "mixed":
                cuisine_score = 100.0
                explanations.append(f"✓ Matches your preferred {food.cuisine} cuisine style")
            elif "indian" in pref_cuisine and ("north indian" in food_cuisine or "south indian" in food_cuisine or "indian" in food_cuisine):
                cuisine_score = 90.0
                explanations.append(f"✓ Fits your Indian cuisine profile ({food.cuisine})")
            else:
                cuisine_score = 65.0

            # 3. Preference Match (Categories & Historical)
            pref_score = 70.0
            if food.id in logged_food_ids:
                pref_score += 15.0
                explanations.append(f"✓ Aligns with your previously logged meals")
            
            # Check search history relevance
            for query in searches[-5:]:
                if (food.name.lower() in query) or (food.category.name.lower() in query):
                    pref_score += 10.0
                    break
            pref_score = min(100.0, pref_score)

            # 4. Feedback & Favorites (Section 17 priority)
            feedback_score = 75.0
            if food.id in user_favorites:
                feedback_score = 100.0
                explanations.append(f"✓ Saved in your favorite foods")
            elif food.id in useful_food_ids:
                feedback_score = 95.0
                explanations.append(f"✓ Previously rated useful by you")
            elif food.id in not_useful_food_ids:
                feedback_score = 35.0  # de-prioritize

            # 5. Nutrition Relevance (Protein Content & Quality)
            nutr = food.nutrition
            nutrition_score = 60.0
            if nutr:
                protein = nutr.protein_g
                # Protein density scoring
                if protein >= 25.0:
                    nutrition_score = 100.0
                    explanations.append(f"✓ Ultra-high protein density ({protein}g per {food.serving_description})")
                elif protein >= 15.0:
                    nutrition_score = 92.0
                    explanations.append(f"✓ High protein source ({protein}g per {food.serving_description})")
                elif protein >= 8.0:
                    nutrition_score = 80.0
                    explanations.append(f"✓ Quality protein source ({protein}g per {food.serving_description})")
                else:
                    nutrition_score = 68.0

                if "strength" in pref_goal and protein >= 15.0:
                    explanations.append("✓ Ideal for your Strength Development recovery targets")
                elif "endurance" in pref_goal and nutr.carbs_g >= 15.0:
                    explanations.append("✓ Balanced macro profile supporting sustained Endurance")
                elif "fitness consistency" in pref_goal or "general fitness" in pref_goal:
                    explanations.append("✓ Wholesome nutrient-dense option supporting General Fitness")

                if nutr.source:
                    explanations.append(f"✓ Verified from {nutr.source}")

            # Calculate Configurable Recommendation Match Score
            raw_score = (
                (diet_score * w_diet) +
                (cuisine_score * w_cuisine) +
                (pref_score * w_pref) +
                (feedback_score * w_fb) +
                (nutrition_score * w_nutr)
            ) / total_weight

            # Keep between 60.0 and 99.0 for presentation
            match_score = round(min(99.0, max(55.0, raw_score)), 1)

            scored_results.append({
                "food": food,
                "match_score": match_score,
                "diet_match_score": round(diet_score, 1),
                "cuisine_match_score": round(cuisine_score, 1),
                "preference_match_score": round(pref_score, 1),
                "feedback_score": round(feedback_score, 1),
                "nutrition_score": round(nutrition_score, 1),
                "explanation_points": explanations[:5],
                "is_favorite": food.id in user_favorites,
                "user_feedback": True if food.id in useful_food_ids else (False if food.id in not_useful_food_ids else None)
            })

        # Rank by match_score descending, then protein_g descending
        scored_results.sort(
            key=lambda x: (x["match_score"], x["food"].nutrition.protein_g if x["food"].nutrition else 0),
            reverse=True
        )

        return scored_results

    def generate_recommendations(
        self,
        client_id: int,
        limit: int = 10,
        custom_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Main recommendation orchestration pipeline."""
        # 1. Fetch Client Profile & Preferences
        pref = self.db.query(ClientPreference).filter_by(client_id=client_id).first()
        diet_type = pref.diet_type if pref else "Vegetarian"
        custom_diet_exclusions = pref.custom_diet_exclusions if pref else None

        # Fetch client allergies
        client_allergies = self.db.query(ClientAllergy).filter_by(client_id=client_id).all()
        client_allergy_ids = {ca.allergy_id for ca in client_allergies}

        # Fetch client avoidances
        client_avoidances = {fa.avoidance_item for fa in self.db.query(ClientFoodAvoidance).filter_by(client_id=client_id).all()}

        # 2. Fetch candidate foods
        all_active_foods = self.db.query(FoodItem).filter_by(is_active=True).all()

        # Step 1: Hard Filtering
        valid_foods = self.step1_hard_filter(
            candidate_foods=all_active_foods,
            diet_type=diet_type,
            custom_diet_exclusions=custom_diet_exclusions,
            client_allergy_ids=client_allergy_ids,
            client_avoidances=client_avoidances
        )

        # 3. Load dynamic weights from recommendation_rules
        weights = self.get_active_weights()

        # 4. Soft filter, score, and generate explanations
        scored = self.calculate_scores_and_explanations(
            foods=valid_foods,
            client_id=client_id,
            preferences=pref,
            weights=weights
        )

        return scored[:limit]
