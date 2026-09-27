import re
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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
        elif "eggetarian" in q or "egg" in q and "vegetarian" in q:
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

class SemanticSearchEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.fitted = False
        self.corpus_ids = []
        self.tfidf_matrix = None

    def build_index(self, foods: List[Any]):
        """Build TF-IDF feature index for cosine similarity semantic food matching."""
        if not foods:
            return

        documents = []
        self.corpus_ids = []

        for f in foods:
            nutr = f.nutrition
            prot_desc = f"{nutr.protein_g}g protein high protein" if nutr and nutr.protein_g > 10 else "moderate protein"
            doc = (
                f"{f.name} {f.name} {f.category.name if f.category else ''} "
                f"{f.diet_type} {f.cuisine} {f.serving_description} {f.tags} {prot_desc} "
                f"{'plant-based' if f.diet_type in ['Vegan', 'Vegetarian'] else 'animal protein'}"
            )
            documents.append(doc.lower())
            self.corpus_ids.append(f.id)

        self.tfidf_matrix = self.vectorizer.fit_transform(documents)
        self.fitted = True

    def search(self, query: str, top_n: int = 8) -> List[Dict[str, Any]]:
        """Search query against index using Cosine Similarity (Section 30)."""
        if not self.fitted or self.tfidf_matrix is None:
            return []

        query_vec = self.vectorizer.transform([query.lower()])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        top_indices = np.argsort(similarities)[::-1][:top_n]
        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.05:
                results.append({
                    "food_id": self.corpus_ids[idx],
                    "similarity_score": round(score * 100, 1)
                })
        return results
