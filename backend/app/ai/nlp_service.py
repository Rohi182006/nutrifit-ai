from typing import Dict, Any

class NLPService:
    @staticmethod
    def extract_intent_and_filters(query: str) -> Dict[str, Any]:
        """
        Extract user intent and structured filters from natural language queries (Section 12).
        Examples:
        - 'high protein vegetarian food' -> diet: 'Vegetarian', min_protein: 15
        - 'South Indian protein sources' -> cuisine: 'South Indian'
        - 'protein foods without dairy' -> exclude_category: 'Dairy'
        - 'vegan snacks' -> diet: 'Vegan', tag: 'snack'
        """
        q = query.lower()
        extracted = {
            "query": query,
            "diet": None,
            "cuisine": None,
            "exclude_category": None,
            "min_protein": None,
            "keywords": []
        }

        # Diet extraction
        if "vegan" in q:
            extracted["diet"] = "Vegan"
        elif "eggetarian" in q or ("egg" in q and "vegetarian" in q):
            extracted["diet"] = "Eggetarian"
        elif "vegetarian" in q or "veg" in q:
            extracted["diet"] = "Vegetarian"
        elif "non-veg" in q or "non veg" in q or "chicken" in q or "fish" in q or "meat" in q:
            extracted["diet"] = "Non-Vegetarian"

        # Cuisine extraction
        if "south indian" in q:
            extracted["cuisine"] = "South Indian"
        elif "north indian" in q:
            extracted["cuisine"] = "North Indian"
        elif "indian" in q:
            extracted["cuisine"] = "Indian"
        elif "continental" in q or "western" in q:
            extracted["cuisine"] = "Continental"

        # Exclusion extraction
        if "without dairy" in q or "no milk" in q or "dairy free" in q or "dairy-free" in q:
            extracted["exclude_category"] = "Dairy"
        elif "without soy" in q or "no soy" in q or "soy free" in q:
            extracted["exclude_category"] = "Soy"
        elif "without nuts" in q or "nut free" in q:
            extracted["exclude_category"] = "Nuts"

        # Protein threshold extraction
        if "ultra high protein" in q or "very high protein" in q or "max protein" in q:
            extracted["min_protein"] = 25.0
        elif "high protein" in q or "protein rich" in q or "protein-rich" in q:
            extracted["min_protein"] = 15.0

        return extracted
