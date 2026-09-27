from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.entities import (
    FoodItem, FoodCategory, FoodNutrition, FoodAllergen, Allergy, FavoriteFood, User
)
from app.schemas.schemas import (
    FoodItemResponse, FoodCategoryResponse, AllergyResponse, FoodComparisonRequest
)
from app.routers.deps import get_current_user

router = APIRouter(prefix="/foods", tags=["Foods"])

@router.get("/", response_model=List[FoodItemResponse])
def get_foods(
    query: Optional[str] = None,
    category_id: Optional[int] = None,
    diet_type: Optional[str] = None,
    cuisine: Optional[str] = None,
    min_protein: Optional[float] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    q = db.query(FoodItem).filter(FoodItem.is_active == True)

    if query:
        search_fmt = f"%{query}%"
        q = q.filter(
            (FoodItem.name.ilike(search_fmt)) |
            (FoodItem.tags.ilike(search_fmt)) |
            (FoodItem.cuisine.ilike(search_fmt))
        )
    if category_id:
        q = q.filter(FoodItem.category_id == category_id)
    if diet_type:
        q = q.filter(FoodItem.diet_type.ilike(diet_type))
    if cuisine:
        q = q.filter(FoodItem.cuisine.ilike(f"%{cuisine}%"))

    foods = q.offset(offset).limit(limit).all()

    # User favorites
    fav_ids = set()
    if current_user:
        fav_ids = {f.food_id for f in db.query(FavoriteFood).filter_by(client_id=current_user.id).all()}

    results = []
    for f in foods:
        nutr = f.nutrition
        if min_protein and nutr and nutr.protein_g < min_protein:
            continue

        allergen_names = [fa.allergy.name for fa in f.allergens if fa.allergy]
        results.append({
            "id": f.id,
            "name": f.name,
            "category_id": f.category_id,
            "category_name": f.category.name if f.category else "",
            "food_type": f.food_type,
            "diet_type": f.diet_type,
            "cuisine": f.cuisine,
            "serving_description": f.serving_description,
            "serving_unit": f.serving_unit,
            "tags": f.tags,
            "image_url": f.image_url,
            "is_active": f.is_active,
            "nutrition": nutr,
            "allergens": allergen_names,
            "is_favorite": f.id in fav_ids
        })

    return results

@router.get("/categories", response_model=List[FoodCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(FoodCategory).all()

@router.get("/allergies", response_model=List[AllergyResponse])
def get_allergies(db: Session = Depends(get_db)):
    return db.query(Allergy).all()

@router.get("/favorites", response_model=List[FoodItemResponse])
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favs = db.query(FavoriteFood).filter_by(client_id=current_user.id).all()
    food_ids = [f.food_id for f in favs]
    foods = db.query(FoodItem).filter(FoodItem.id.in_(food_ids)).all()

    results = []
    for f in foods:
        allergen_names = [fa.allergy.name for fa in f.allergens if fa.allergy]
        results.append({
            "id": f.id,
            "name": f.name,
            "category_id": f.category_id,
            "category_name": f.category.name if f.category else "",
            "food_type": f.food_type,
            "diet_type": f.diet_type,
            "cuisine": f.cuisine,
            "serving_description": f.serving_description,
            "serving_unit": f.serving_unit,
            "tags": f.tags,
            "image_url": f.image_url,
            "is_active": f.is_active,
            "nutrition": f.nutrition,
            "allergens": allergen_names,
            "is_favorite": True
        })
    return results

@router.post("/favorites/{food_id}")
def add_favorite(
    food_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    food = db.query(FoodItem).filter_by(id=food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    existing = db.query(FavoriteFood).filter_by(client_id=current_user.id, food_id=food_id).first()
    if not existing:
        fav = FavoriteFood(client_id=current_user.id, food_id=food_id)
        db.add(fav)
        db.commit()
    return {"message": "Food saved to favorites!", "is_favorite": True}

@router.delete("/favorites/{food_id}")
def remove_favorite(
    food_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(FavoriteFood).filter_by(client_id=current_user.id, food_id=food_id).delete()
    db.commit()
    return {"message": "Food removed from favorites.", "is_favorite": False}

@router.post("/compare")
def compare_foods(payload: FoodComparisonRequest, db: Session = Depends(get_db)):
    """Compare up to 4 foods side-by-side (Section 14)."""
    if len(payload.food_ids) < 2 or len(payload.food_ids) > 4:
        raise HTTPException(status_code=400, detail="Please select between 2 and 4 foods to compare.")

    foods = db.query(FoodItem).filter(FoodItem.id.in_(payload.food_ids)).all()
    comparison = []
    for f in foods:
        nutr = f.nutrition
        allergen_names = [fa.allergy.name for fa in f.allergens if fa.allergy]
        comparison.append({
            "id": f.id,
            "name": f.name,
            "category": f.category.name if f.category else "",
            "food_type": f.food_type,
            "diet_type": f.diet_type,
            "cuisine": f.cuisine,
            "serving_description": f.serving_description,
            "protein_g": nutr.protein_g if nutr else 0.0,
            "carbs_g": nutr.carbs_g if nutr else 0.0,
            "fat_g": nutr.fat_g if nutr else 0.0,
            "calories": nutr.calories if nutr else 0.0,
            "fiber_g": nutr.fiber_g if nutr else 0.0,
            "source": nutr.source if nutr else "IFCT",
            "allergens": allergen_names
        })
    return {"comparison": comparison}

@router.get("/{food_id}", response_model=FoodItemResponse)
def get_food_detail(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    food = db.query(FoodItem).filter_by(id=food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")

    is_fav = False
    if current_user:
        is_fav = bool(db.query(FavoriteFood).filter_by(client_id=current_user.id, food_id=food.id).first())

    allergen_names = [fa.allergy.name for fa in food.allergens if fa.allergy]
    return {
        "id": food.id,
        "name": food.name,
        "category_id": food.category_id,
        "category_name": food.category.name if food.category else "",
        "food_type": food.food_type,
        "diet_type": food.diet_type,
        "cuisine": food.cuisine,
        "serving_description": food.serving_description,
        "serving_unit": food.serving_unit,
        "tags": food.tags,
        "image_url": food.image_url,
        "is_active": food.is_active,
        "nutrition": food.nutrition,
        "allergens": allergen_names,
        "is_favorite": is_fav
    }
