from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.entities import (
    User, UserRole, ClientProfile, CoachProfile, CoachClient,
    ClientPreference, Allergy, FoodCategory, FoodItem, FoodNutrition,
    FoodAllergen, Exercise, RecommendationRule, Goal, ActivityLog,
    NutritionLog, Workout, WorkoutExercise, FavoriteFood, DietPlanTemplate
)
from datetime import datetime, timezone, timedelta


def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).filter_by(email="admin@nutrifit.ai").first():
        print("Database already seeded. Verifying diet plans dataset...")
        seed_diet_plans(db)
        return

    print("Seeding database with verified IFCT/USDA nutrition dataset and demo users...")

    # 1. Allergies (Controlled List)
    allergies_data = [
        {"name": "Milk/Dairy", "description": "Lactose and milk protein allergy/intolerance"},
        {"name": "Eggs", "description": "Egg whites and yolk protein sensitivity"},
        {"name": "Fish", "description": "Fin fish protein allergy"},
        {"name": "Shellfish", "description": "Crustacean and molluscan shellfish allergy"},
        {"name": "Tree Nuts", "description": "Almonds, walnuts, cashews, pistachios"},
        {"name": "Peanuts", "description": "Groundnut allergy"},
        {"name": "Wheat/Gluten", "description": "Celiac and wheat gluten allergy"},
        {"name": "Soy", "description": "Soybeans and soy derivative protein allergy"},
        {"name": "Sesame", "description": "Sesame seeds and sesame oil sensitivity"},
        {"name": "Mustard", "description": "Mustard seed allergen"},
        {"name": "Sulfites", "description": "Preservative sensitivity"},
    ]
    allergy_map = {}
    for a in allergies_data:
        obj = Allergy(name=a["name"], description=a["description"])
        db.add(obj)
        db.flush()
        allergy_map[a["name"]] = obj.id

    # 2. Food Categories
    categories_data = [
        {"name": "Dairy", "description": "Milk, paneer, curd, yogurt, whey", "icon": "milk"},
        {"name": "Legumes", "description": "Chickpeas, rajma, black beans, peas", "icon": "bean"},
        {"name": "Pulses", "description": "Moong dal, masoor dal, urad dal, toor dal", "icon": "wheat"},
        {"name": "Soy", "description": "Soya chunks, tofu, edamame, tempeh, soy milk", "icon": "leaf"},
        {"name": "Nuts", "description": "Almonds, peanuts, walnuts, cashews", "icon": "nut"},
        {"name": "Seeds", "description": "Chia seeds, pumpkin seeds, flax seeds, sunflower seeds", "icon": "sparkles"},
        {"name": "Eggs", "description": "Whole eggs, egg whites", "icon": "egg"},
        {"name": "Meat", "description": "Chicken breast, lean poultry, turkey", "icon": "drumstick"},
        {"name": "Fish", "description": "Salmon, rohu, tuna, mackerel", "icon": "fish"},
        {"name": "Other", "description": "Grains, supplements, plant mixes", "icon": "apple"},
    ]
    category_map = {}
    for c in categories_data:
        obj = FoodCategory(name=c["name"], description=c["description"], icon=c["icon"])
        db.add(obj)
        db.flush()
        category_map[c["name"]] = obj.id

    # 3. Verified Nutrition Foods (IFCT primary, USDA secondary)
    foods_data = [
        {
            "name": "Paneer (Cottage Cheese)",
            "category": "Dairy",
            "food_type": "Whole Food",
            "diet_type": "Vegetarian",
            "cuisine": "Indian",
            "serving_description": "100g cubed",
            "serving_unit": "g",
            "tags": "high-protein,calcium-rich,vegetarian-staple",
            "protein_g": 18.3,
            "carbs_g": 1.2,
            "fat_g": 20.8,
            "calories": 265.0,
            "fiber_g": 0.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Milk/Dairy"]
        },
        {
            "name": "Chickpeas (Kabuli Chana)",
            "category": "Legumes",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Indian",
            "serving_description": "100g cooked/boiled",
            "serving_unit": "g",
            "tags": "plant-based,high-fiber,complex-carbs",
            "protein_g": 8.9,
            "carbs_g": 27.4,
            "fat_g": 2.6,
            "calories": 164.0,
            "fiber_g": 7.6,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Green Gram Dal (Moong Dal)",
            "category": "Pulses",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Indian",
            "serving_description": "100g cooked dal",
            "serving_unit": "g",
            "tags": "easy-digest,plant-protein,traditional",
            "protein_g": 7.1,
            "carbs_g": 19.1,
            "fat_g": 0.4,
            "calories": 105.0,
            "fiber_g": 4.2,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Red Lentils (Masoor Dal)",
            "category": "Pulses",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "North Indian",
            "serving_description": "100g cooked dal",
            "serving_unit": "g",
            "tags": "iron-rich,plant-protein,comfort-food",
            "protein_g": 9.0,
            "carbs_g": 20.1,
            "fat_g": 0.4,
            "calories": 116.0,
            "fiber_g": 3.9,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Black Gram (Urad Dal)",
            "category": "Pulses",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "South Indian",
            "serving_description": "100g cooked dal",
            "serving_unit": "g",
            "tags": "south-indian-staple,gut-health,rich-protein",
            "protein_g": 8.2,
            "carbs_g": 21.0,
            "fat_g": 0.5,
            "calories": 118.0,
            "fiber_g": 5.1,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Kidney Beans (Rajma)",
            "category": "Legumes",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "North Indian",
            "serving_description": "100g cooked",
            "serving_unit": "g",
            "tags": "high-protein,fiber-rich,heart-healthy",
            "protein_g": 8.7,
            "carbs_g": 22.8,
            "fat_g": 0.5,
            "calories": 127.0,
            "fiber_g": 6.4,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Soya Chunks (Defatted Soy)",
            "category": "Soy",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Indian",
            "serving_description": "100g dry chunks",
            "serving_unit": "g",
            "tags": "ultra-high-protein,lean-protein,plant-based",
            "protein_g": 52.0,
            "carbs_g": 33.0,
            "fat_g": 0.5,
            "calories": 345.0,
            "fiber_g": 13.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Soy"]
        },
        {
            "name": "Firm Tofu",
            "category": "Soy",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Continental",
            "serving_description": "100g drained",
            "serving_unit": "g",
            "tags": "calcium-set,vegan-staple,low-carb",
            "protein_g": 17.3,
            "carbs_g": 2.8,
            "fat_g": 8.7,
            "calories": 144.0,
            "fiber_g": 2.3,
            "source": "USDA FoodData Central",
            "allergens": ["Soy"]
        },
        {
            "name": "Steamed Edamame",
            "category": "Soy",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Mixed",
            "serving_description": "100g shelled pods",
            "serving_unit": "g",
            "tags": "complete-protein,antioxidants,snack",
            "protein_g": 11.9,
            "carbs_g": 8.9,
            "fat_g": 5.2,
            "calories": 122.0,
            "fiber_g": 5.2,
            "source": "USDA FoodData Central",
            "allergens": ["Soy"]
        },
        {
            "name": "Curd / Plain Dahi",
            "category": "Dairy",
            "food_type": "Whole Food",
            "diet_type": "Vegetarian",
            "cuisine": "Indian",
            "serving_description": "100g fresh bowl",
            "serving_unit": "g",
            "tags": "probiotic,gut-health,calcium",
            "protein_g": 3.7,
            "carbs_g": 4.4,
            "fat_g": 4.0,
            "calories": 68.0,
            "fiber_g": 0.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Milk/Dairy"]
        },
        {
            "name": "Greek Yogurt (Nonfat Plain)",
            "category": "Dairy",
            "food_type": "Whole Food",
            "diet_type": "Vegetarian",
            "cuisine": "Continental",
            "serving_description": "100g serving",
            "serving_unit": "g",
            "tags": "high-protein,low-fat,probiotic",
            "protein_g": 10.0,
            "carbs_g": 3.6,
            "fat_g": 0.4,
            "calories": 59.0,
            "fiber_g": 0.0,
            "source": "USDA FoodData Central",
            "allergens": ["Milk/Dairy"]
        },
        {
            "name": "Roasted Peanuts (Groundnuts)",
            "category": "Nuts",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Indian",
            "serving_description": "100g dry roasted",
            "serving_unit": "g",
            "tags": "energy-dense,healthy-fats,traditional",
            "protein_g": 25.8,
            "carbs_g": 16.1,
            "fat_g": 49.2,
            "calories": 567.0,
            "fiber_g": 8.5,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Peanuts"]
        },
        {
            "name": "Raw Almonds (Badam)",
            "category": "Nuts",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Mixed",
            "serving_description": "100g whole nuts",
            "serving_unit": "g",
            "tags": "vitamin-e,brain-food,healthy-fats",
            "protein_g": 21.2,
            "carbs_g": 10.5,
            "fat_g": 58.9,
            "calories": 655.0,
            "fiber_g": 12.2,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Tree Nuts"]
        },
        {
            "name": "Chia Seeds",
            "category": "Seeds",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Mixed",
            "serving_description": "100g dry seeds",
            "serving_unit": "g",
            "tags": "omega-3,high-fiber,superfood",
            "protein_g": 16.5,
            "carbs_g": 42.1,
            "fat_g": 30.7,
            "calories": 486.0,
            "fiber_g": 34.4,
            "source": "USDA FoodData Central",
            "allergens": []
        },
        {
            "name": "Shelled Pumpkin Seeds",
            "category": "Seeds",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Mixed",
            "serving_description": "100g roasted seeds",
            "serving_unit": "g",
            "tags": "zinc-rich,magnesium,plant-protein",
            "protein_g": 30.2,
            "carbs_g": 10.7,
            "fat_g": 49.1,
            "calories": 559.0,
            "fiber_g": 6.0,
            "source": "USDA FoodData Central",
            "allergens": []
        },
        {
            "name": "Whole Eggs (Boiled)",
            "category": "Eggs",
            "food_type": "Whole Food",
            "diet_type": "Eggetarian",
            "cuisine": "Mixed",
            "serving_description": "100g (approx 2 medium eggs)",
            "serving_unit": "g",
            "tags": "complete-protein,choline,bioavailable",
            "protein_g": 13.3,
            "carbs_g": 0.5,
            "fat_g": 13.3,
            "calories": 173.0,
            "fiber_g": 0.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Eggs"]
        },
        {
            "name": "Egg Whites (Cooked)",
            "category": "Eggs",
            "food_type": "Whole Food",
            "diet_type": "Eggetarian",
            "cuisine": "Mixed",
            "serving_description": "100g serving",
            "serving_unit": "g",
            "tags": "pure-protein,zero-fat,lean",
            "protein_g": 10.9,
            "carbs_g": 0.7,
            "fat_g": 0.2,
            "calories": 52.0,
            "fiber_g": 0.0,
            "source": "USDA FoodData Central",
            "allergens": ["Eggs"]
        },
        {
            "name": "Chicken Breast (Skinless Grilled)",
            "category": "Meat",
            "food_type": "Whole Food",
            "diet_type": "Non-Vegetarian",
            "cuisine": "Continental",
            "serving_description": "100g cooked breast",
            "serving_unit": "g",
            "tags": "lean-meat,high-protein,low-fat",
            "protein_g": 31.0,
            "carbs_g": 0.0,
            "fat_g": 3.6,
            "calories": 165.0,
            "fiber_g": 0.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Rohu Fish Fillet (Cooked)",
            "category": "Fish",
            "food_type": "Whole Food",
            "diet_type": "Non-Vegetarian",
            "cuisine": "Indian",
            "serving_description": "100g steamed/curry cut",
            "serving_unit": "g",
            "tags": "freshwater-fish,high-protein,omega-3",
            "protein_g": 16.6,
            "carbs_g": 4.4,
            "fat_g": 1.4,
            "calories": 97.0,
            "fiber_g": 0.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": ["Fish"]
        },
        {
            "name": "Wild Atlantic Salmon (Baked)",
            "category": "Fish",
            "food_type": "Whole Food",
            "diet_type": "Non-Vegetarian",
            "cuisine": "Continental",
            "serving_description": "100g fillet",
            "serving_unit": "g",
            "tags": "omega-3,heart-healthy,complete-protein",
            "protein_g": 25.4,
            "carbs_g": 0.0,
            "fat_g": 8.1,
            "calories": 182.0,
            "fiber_g": 0.0,
            "source": "USDA FoodData Central",
            "allergens": ["Fish"]
        },
        {
            "name": "Roasted Chana Sattu (Gram Flour)",
            "category": "Legumes",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "North Indian",
            "serving_description": "100g powder",
            "serving_unit": "g",
            "tags": "traditional-superfood,high-protein,cooling-drink",
            "protein_g": 20.6,
            "carbs_g": 65.2,
            "fat_g": 5.2,
            "calories": 387.0,
            "fiber_g": 9.8,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Sprouted Moong Salad",
            "category": "Pulses",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Indian",
            "serving_description": "100g fresh sprouts",
            "serving_unit": "g",
            "tags": "sprouts,enzyme-rich,high-fiber",
            "protein_g": 7.0,
            "carbs_g": 15.0,
            "fat_g": 0.5,
            "calories": 92.0,
            "fiber_g": 4.0,
            "source": "IFCT (Indian Food Composition Tables)",
            "allergens": []
        },
        {
            "name": "Whey Protein Isolate (Unflavored)",
            "category": "Dairy",
            "food_type": "Supplement",
            "diet_type": "Vegetarian",
            "cuisine": "Mixed",
            "serving_description": "1 scoop (30g)",
            "serving_unit": "g",
            "tags": "fast-absorbing,bcaa-rich,high-purity",
            "protein_g": 27.0,
            "carbs_g": 1.0,
            "fat_g": 0.5,
            "calories": 115.0,
            "fiber_g": 0.0,
            "source": "USDA FoodData Central",
            "allergens": ["Milk/Dairy"]
        },
        {
            "name": "Tempeh",
            "category": "Soy",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Continental",
            "serving_description": "100g cooked",
            "serving_unit": "g",
            "tags": "fermented-soy,gut-health,firm-texture",
            "protein_g": 20.3,
            "carbs_g": 7.6,
            "fat_g": 10.8,
            "calories": 192.0,
            "fiber_g": 5.0,
            "source": "USDA FoodData Central",
            "allergens": ["Soy"]
        },
        {
            "name": "Cooked Quinoa",
            "category": "Other",
            "food_type": "Whole Food",
            "diet_type": "Vegan",
            "cuisine": "Continental",
            "serving_description": "100g cooked",
            "serving_unit": "g",
            "tags": "gluten-free,complete-protein,ancient-grain",
            "protein_g": 4.4,
            "carbs_g": 21.3,
            "fat_g": 1.9,
            "calories": 120.0,
            "fiber_g": 2.8,
            "source": "USDA FoodData Central",
            "allergens": []
        }
    ]

    food_items_created = []
    for f in foods_data:
        cat_id = category_map[f["category"]]
        item = FoodItem(
            name=f["name"],
            category_id=cat_id,
            food_type=f["food_type"],
            diet_type=f["diet_type"],
            cuisine=f["cuisine"],
            serving_description=f["serving_description"],
            serving_unit=f["serving_unit"],
            tags=f["tags"],
            is_active=True
        )
        db.add(item)
        db.flush()

        nutrition = FoodNutrition(
            food_id=item.id,
            protein_g=f["protein_g"],
            carbs_g=f["carbs_g"],
            fat_g=f["fat_g"],
            calories=f["calories"],
            fiber_g=f["fiber_g"],
            source=f["source"],
            verified=True
        )
        db.add(nutrition)

        for allergen_name in f["allergens"]:
            if allergen_name in allergy_map:
                fa = FoodAllergen(food_id=item.id, allergy_id=allergy_map[allergen_name])
                db.add(fa)

        food_items_created.append(item)

    # 4. Controlled Exercises Catalog
    exercises_data = [
        {"name": "Bodyweight Squats", "category": "Strength", "muscle_group": "Quads & Glutes", "difficulty": "Beginner", "description": "Lower body strength exercise targeting glutes, quads, and hips."},
        {"name": "Push-ups", "category": "Strength", "muscle_group": "Chest, Shoulders & Triceps", "difficulty": "Beginner", "description": "Standard push-ups building upper body push strength."},
        {"name": "Dumbbell Overhead Shoulder Press", "category": "Strength", "muscle_group": "Shoulders & Core", "difficulty": "Medium", "description": "Vertical pressing for deltoids and scapular stability."},
        {"name": "Inverted Rows / Pull-ups", "category": "Strength", "muscle_group": "Upper Back & Biceps", "difficulty": "Medium", "description": "Upper body pull pattern for latissimus dorsi and rhomboids."},
        {"name": "Plank Hold", "category": "Mobility", "muscle_group": "Core & Lumbar", "difficulty": "Beginner", "description": "Isometric core engagement promoting spinal stability."},
        {"name": "Walking Lunges", "category": "Strength", "muscle_group": "Hamstrings & Glutes", "difficulty": "Beginner", "description": "Unilateral lower-body development and balance enhancement."},
        {"name": "Brisk Morning Walking", "category": "Cardio", "muscle_group": "Full Body Cardio", "difficulty": "Beginner", "description": "Low-impact cardiovascular conditioning for recovery and metabolic health."},
        {"name": "Outdoor Interval Jogging", "category": "Cardio", "muscle_group": "Cardiovascular & Legs", "difficulty": "Medium", "description": "Cardiorespiratory conditioning with alternating pace."},
        {"name": "Surya Namaskar (Sun Salutation)", "category": "Mobility", "muscle_group": "Full Body Flexibility", "difficulty": "Beginner", "description": "12-pose sequence enhancing flexibility, spinal mobility, and breathing."},
        {"name": "Stationary / Outdoor Cycling", "category": "Cardio", "muscle_group": "Quads & Calves", "difficulty": "Beginner", "description": "Joint-friendly aerobic endurance training."}
    ]
    exercise_map = {}
    for ex in exercises_data:
        e = Exercise(
            name=ex["name"],
            category=ex["category"],
            muscle_group=ex["muscle_group"],
            difficulty=ex["difficulty"],
            description=ex["description"]
        )
        db.add(e)
        db.flush()
        exercise_map[ex["name"]] = e.id

    # 5. Configurable Recommendation Rules (Section 9 & Section 26)
    rules_data = [
        {"name": "Diet Compatibility Weight", "rule_key": "diet_match_weight", "weight": 1.0, "is_active": True, "description": "Weight given to diet type match (e.g. Vegetarian, Vegan)"},
        {"name": "Preferred Cuisine Weight", "rule_key": "cuisine_match_weight", "weight": 0.8, "is_active": True, "description": "Weight given to user's selected regional cuisine"},
        {"name": "Category Preference Weight", "rule_key": "preference_match_weight", "weight": 0.9, "is_active": True, "description": "Weight given to preferred food categories and historical selections"},
        {"name": "User Feedback & Favorites Weight", "rule_key": "feedback_weight", "weight": 0.85, "is_active": True, "description": "Weight given to explicit 👍/👎 feedback and saved favorite items"},
        {"name": "Nutrition & Protein Density Weight", "rule_key": "nutrition_relevance_weight", "weight": 0.95, "is_active": True, "description": "Weight given to protein content per serving and macro suitability"}
    ]
    for r in rules_data:
        rr = RecommendationRule(
            rule_name=r["name"],
            rule_key=r["rule_key"],
            weight=r["weight"],
            is_active=r["is_active"],
            description=r["description"]
        )
        db.add(rr)

    # 6. Default Users (Admin, Coach, Clients)
    # Admin User
    admin = User(
        email="admin@nutrifit.ai",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Dr. Alex Rivera",
        role=UserRole.ADMIN.value,
        is_active=True
    )
    db.add(admin)

    # Coach User
    coach = User(
        email="coach.sarah@nutrifit.ai",
        hashed_password=get_password_hash("Coach@123"),
        full_name="Sarah Jenkins, CSCS",
        role=UserRole.COACH.value,
        is_active=True
    )
    db.add(coach)
    db.flush()

    coach_profile = CoachProfile(
        user_id=coach.id,
        specialization="Sports Performance & Plant-Forward Nutrition",
        bio="Certified Strength & Conditioning Specialist with 8+ years helping clients optimize recovery and protein distribution."
    )
    db.add(coach_profile)

    # Client 1: Rohith Kumar
    client1 = User(
        email="client.rohith@nutrifit.ai",
        hashed_password=get_password_hash("Client@123"),
        full_name="Rohith Kumar",
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db.add(client1)
    db.flush()

    client1_profile = ClientProfile(
        user_id=client1.id,
        age=28,
        preferred_language="English"
    )
    db.add(client1_profile)

    client1_pref = ClientPreference(
        client_id=client1.id,
        fitness_goal="General fitness",
        diet_type="Vegetarian",
        preferred_cuisine="Indian",
        activity_level="Moderate",
        notes="Prefers home-cooked Indian meals. Looking to boost daily protein safely without digestive discomfort."
    )
    db.add(client1_pref)

    # Client 2: Ananya Sharma
    client2 = User(
        email="client.ananya@nutrifit.ai",
        hashed_password=get_password_hash("Client@123"),
        full_name="Ananya Sharma",
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db.add(client2)
    db.flush()

    client2_profile = ClientProfile(
        user_id=client2.id,
        age=25,
        preferred_language="English"
    )
    db.add(client2_profile)

    client2_pref = ClientPreference(
        client_id=client2.id,
        fitness_goal="Strength development",
        diet_type="Vegan",
        preferred_cuisine="South Indian",
        activity_level="High",
        notes="Vegan athlete tracking plant-based leucine and protein diversity."
    )
    db.add(client2_pref)

    # 7. Coach-Client Assignment (Enforces Section 24 & 26 coach boundary!)
    # Sarah is explicitly assigned to Rohith Kumar
    assignment = CoachClient(
        coach_id=coach.id,
        client_id=client1.id,
        status="active",
        notes="Client onboarding completed. Targeting 65-75g daily vegetarian protein and consistent 4x weekly walks/strength."
    )
    db.add(assignment)

    # 8. Sample Tracking Data for Rohith (Client 1)
    # Workouts
    now = datetime.now(timezone.utc)
    w1 = Workout(
        client_id=client1.id,
        workout_type="Strength",
        duration_minutes=40,
        workout_date=now - timedelta(days=1),
        difficulty="Medium",
        notes="Completed 3 sets of pushups and bodyweight squats. Feeling energized."
    )
    db.add(w1)
    db.flush()

    we1 = WorkoutExercise(workout_id=w1.id, exercise_id=exercise_map["Push-ups"], sets=3, reps=12, weight_kg=0)
    we2 = WorkoutExercise(workout_id=w1.id, exercise_id=exercise_map["Bodyweight Squats"], sets=3, reps=15, weight_kg=0)
    db.add_all([we1, we2])

    # Activity Logs
    for i in range(5):
        day = now - timedelta(days=i)
        act = ActivityLog(
            client_id=client1.id,
            log_date=day,
            steps=7500 + (i * 450),
            active_minutes=35 + (i * 5),
            activity_type="Walking",
            distance_km=5.2 + (i * 0.3),
            calories_burned=280 + (i * 20),
            notes="Regular brisk walking commute and evening stroll."
        )
        db.add(act)

    # Nutrition Logs
    paneer_item = next((f for f in food_items_created if "Paneer" in f.name), food_items_created[0])
    chickpeas_item = next((f for f in food_items_created if "Chickpeas" in f.name), food_items_created[1])
    moong_item = next((f for f in food_items_created if "Moong Dal" in f.name), food_items_created[2])

    n1 = NutritionLog(
        client_id=client1.id,
        meal_type="Lunch",
        food_item_id=paneer_item.id,
        serving_quantity=1.0,
        serving_unit="100g",
        protein_g=18.3,
        calories=265.0,
        log_date=now - timedelta(days=1),
        notes="Tawa paneer with 2 rotis and mint salad"
    )
    n2 = NutritionLog(
        client_id=client1.id,
        meal_type="Dinner",
        food_item_id=chickpeas_item.id,
        serving_quantity=1.5,
        serving_unit="bowl",
        protein_g=13.3,
        calories=246.0,
        log_date=now - timedelta(days=1),
        notes="Chole masala with brown rice"
    )
    db.add_all([n1, n2])

    # Goals
    g1 = Goal(
        client_id=client1.id,
        title="Maintain 4x Weekly Workout Consistency",
        category="workout_consistency",
        target_value=4.0,
        current_value=3.0,
        unit="sessions/week",
        status="in_progress",
        created_by_id=coach.id
    )
    g2 = Goal(
        client_id=client1.id,
        title="Daily 8,000 Steps Target",
        category="activity_consistency",
        target_value=8000.0,
        current_value=7600.0,
        unit="steps",
        status="in_progress",
        created_by_id=client1.id
    )
    db.add_all([g1, g2])

    # Favorite Food
    fav = FavoriteFood(
        client_id=client1.id,
        food_id=paneer_item.id,
        created_at=now
    )
    db.add(fav)

    seed_diet_plans(db)

    db.commit()
    print("Database seeding completed successfully!")


def seed_diet_plans(db: Session):
    existing_count = db.query(DietPlanTemplate).count()
    if existing_count >= 24:
        print(f"Diet plan reference templates already seeded ({existing_count} records).")
        return

    print("Seeding Weight & Activity Diet Planning reference templates (PDF dataset)...")

    # Base templates for each activity directly transcribed from PDF pages 2–14
    activity_templates = [
        {
            "activity": "Cricket",
            "activity_type": "Sports",
            "activity_intensity": "Moderate–high",
            "nutrition_priority": "Carbohydrates + protein + hydration",
            "main_food_groups": "Rice/roti, eggs/chicken/paneer, dal, banana, curd, vegetables",
            "breakfast": "Oats/idli/dosa + eggs or paneer/tofu + fruit + milk/curd",
            "mid_morning": "Banana/apple/orange + a small portion of nuts",
            "lunch": "Rice/roti + dal + vegetables + eggs/chicken/fish/paneer/tofu + curd",
            "pre_training": "Banana + oats/bread or another easy-to-digest carbohydrate",
            "post_training": "Milk/curd + eggs/paneer/chicken/tofu + fruit or rice",
            "dinner": "Rice/roti + protein source + vegetables + curd",
            "hydration": "Water throughout the day; increase fluids during long/hot training sessions. Use electrolytes when appropriate for prolonged, sweaty sessions.",
            "app_personalization": "Use age, height, training frequency/duration, goal, dietary preference, allergies and other relevant inputs before calculating portions/calories.",
            "portion_logic": "Start with balanced portions and adjust using the user's goal, training load and progress; do not prescribe calories from weight alone.",
            "icon": "cricket",
            "base_cals": 1950,
            "base_prot": 100.0,
            "base_carbs": 250.0,
            "base_fat": 55.0,
        },
        {
            "activity": "Football",
            "activity_type": "Sports",
            "activity_intensity": "High",
            "nutrition_priority": "Carbohydrates + protein + electrolytes",
            "main_food_groups": "Rice, oats, potatoes, eggs/chicken/paneer, dal, fruits, curd",
            "breakfast": "Oats/idli/dosa + eggs or paneer/tofu + fruit + milk/curd",
            "mid_morning": "Banana/apple/orange + a small portion of nuts",
            "lunch": "Rice/roti + dal + vegetables + eggs/chicken/fish/paneer/tofu + curd",
            "pre_training": "Banana + oats/bread or another easy-to-digest carbohydrate",
            "post_training": "Milk/curd + eggs/paneer/chicken/tofu + fruit or rice",
            "dinner": "Rice/roti + protein source + vegetables + curd",
            "hydration": "Water throughout the day; increase fluids during long/hot training sessions. Use electrolytes when appropriate for prolonged, sweaty sessions.",
            "app_personalization": "Use age, height, training frequency/duration, goal, dietary preference, allergies and other relevant inputs before calculating portions/calories.",
            "portion_logic": "Start with balanced portions and adjust using the user's goal, training load and progress; do not prescribe calories from weight alone.",
            "icon": "football",
            "base_cals": 2150,
            "base_prot": 105.0,
            "base_carbs": 280.0,
            "base_fat": 60.0,
        },
        {
            "activity": "Volleyball",
            "activity_type": "Sports",
            "activity_intensity": "Moderate–high",
            "nutrition_priority": "Carbohydrates + protein + hydration",
            "main_food_groups": "Rice/roti, eggs/chicken/paneer, dal, banana, nuts, vegetables",
            "breakfast": "Oats/idli/dosa + eggs or paneer/tofu + fruit + milk/curd",
            "mid_morning": "Banana/apple/orange + a small portion of nuts",
            "lunch": "Rice/roti + dal + vegetables + eggs/chicken/fish/paneer/tofu + curd",
            "pre_training": "Banana + oats/bread or another easy-to-digest carbohydrate",
            "post_training": "Milk/curd + eggs/paneer/chicken/tofu + fruit or rice",
            "dinner": "Rice/roti + protein source + vegetables + curd",
            "hydration": "Water throughout the day; increase fluids during long/hot training sessions. Use electrolytes when appropriate for prolonged, sweaty sessions.",
            "app_personalization": "Use age, height, training frequency/duration, goal, dietary preference, allergies and other relevant inputs before calculating portions/calories.",
            "portion_logic": "Start with balanced portions and adjust using the user's goal, training load and progress; do not prescribe calories from weight alone.",
            "icon": "volleyball",
            "base_cals": 1900,
            "base_prot": 100.0,
            "base_carbs": 240.0,
            "base_fat": 55.0,
        },
        {
            "activity": "Hockey",
            "activity_type": "Sports",
            "activity_intensity": "High",
            "nutrition_priority": "Carbohydrates + protein + fluids",
            "main_food_groups": "Rice, oats, potatoes, eggs/chicken/fish/paneer, dal, fruits, curd",
            "breakfast": "Oats/idli/dosa + eggs or paneer/tofu + fruit + milk/curd",
            "mid_morning": "Banana/apple/orange + a small portion of nuts",
            "lunch": "Rice/roti + dal + vegetables + eggs/chicken/fish/paneer/tofu + curd",
            "pre_training": "Banana + oats/bread or another easy-to-digest carbohydrate",
            "post_training": "Milk/curd + eggs/paneer/chicken/tofu + fruit or rice",
            "dinner": "Rice/roti + protein source + vegetables + curd",
            "hydration": "Water throughout the day; increase fluids during long/hot training sessions. Use electrolytes when appropriate for prolonged, sweaty sessions.",
            "app_personalization": "Use age, height, training frequency/duration, goal, dietary preference, allergies and other relevant inputs before calculating portions/calories.",
            "portion_logic": "Start with balanced portions and adjust using the user's goal, training load and progress; do not prescribe calories from weight alone.",
            "icon": "hockey",
            "base_cals": 2150,
            "base_prot": 105.0,
            "base_carbs": 280.0,
            "base_fat": 60.0,
        },
        {
            "activity": "Badminton",
            "activity_type": "Sports",
            "activity_intensity": "Moderate–high",
            "nutrition_priority": "Balanced carbs + protein + hydration",
            "main_food_groups": "Rice/roti, oats, eggs/chicken/paneer, dal, fruit, curd, vegetables",
            "breakfast": "Oats/idli/dosa + eggs or paneer/tofu + fruit + milk/curd",
            "mid_morning": "Banana/apple/orange + a small portion of nuts",
            "lunch": "Rice/roti + dal + vegetables + eggs/chicken/fish/paneer/tofu + curd",
            "pre_training": "Banana + oats/bread or another easy-to-digest carbohydrate",
            "post_training": "Milk/curd + eggs/paneer/chicken/tofu + fruit or rice",
            "dinner": "Rice/roti + protein source + vegetables + curd",
            "hydration": "Water throughout the day; increase fluids during long/hot training sessions. Use electrolytes when appropriate for prolonged, sweaty sessions.",
            "app_personalization": "Use age, height, training frequency/duration, goal, dietary preference, allergies and other relevant inputs before calculating portions/calories.",
            "portion_logic": "Start with balanced portions and adjust using the user's goal, training load and progress; do not prescribe calories from weight alone.",
            "icon": "badminton",
            "base_cals": 1950,
            "base_prot": 100.0,
            "base_carbs": 250.0,
            "base_fat": 55.0,
        },
        {
            "activity": "Bodybuilding",
            "activity_type": "Bodybuilding",
            "activity_intensity": "Strength training",
            "nutrition_priority": "Protein + balanced carbohydrates + healthy fats",
            "main_food_groups": "Rice/roti/oats, eggs/chicken/fish/paneer/tofu, dal, milk/curd, nuts, vegetables",
            "breakfast": "Oats/idli/dosa + eggs or paneer/tofu + fruit + milk/curd",
            "mid_morning": "Banana/apple/orange + a small portion of nuts",
            "lunch": "Rice/roti + dal + vegetables + eggs/chicken/fish/paneer/tofu + curd",
            "pre_training": "Banana + oats/bread or another easy-to-digest carbohydrate",
            "post_training": "Milk/curd + eggs/paneer/chicken/tofu + fruit or rice",
            "dinner": "Rice/roti + protein source + vegetables + curd",
            "hydration": "Water throughout the day; increase fluids during long/hot training sessions. Use electrolytes when appropriate for prolonged, sweaty sessions.",
            "app_personalization": "Use age, height, training frequency/duration, goal, dietary preference, allergies and other relevant inputs before calculating portions/calories.",
            "portion_logic": "Start with balanced portions and adjust using the user's goal, training load and progress; do not prescribe calories from weight alone.",
            "icon": "dumbbell",
            "base_cals": 2050,
            "base_prot": 115.0,
            "base_carbs": 220.0,
            "base_fat": 65.0,
        },
    ]

    # 4 Weight Ranges with calibration offsets
    weight_ranges = [
        {"range": "50–60 kg", "min": 50.0, "max": 60.0, "cal_offset": 0, "prot_offset": 0.0, "water_min": 2.5, "water_max": 3.0},
        {"range": "60–70 kg", "min": 60.0, "max": 70.0, "cal_offset": 300, "prot_offset": 20.0, "water_min": 2.8, "water_max": 3.4},
        {"range": "70–80 kg", "min": 70.0, "max": 80.0, "cal_offset": 600, "prot_offset": 40.0, "water_min": 3.2, "water_max": 3.8},
        {"range": "80–90 kg", "min": 80.0, "max": 90.0, "cal_offset": 900, "prot_offset": 60.0, "water_min": 3.5, "water_max": 4.2},
    ]

    for wr in weight_ranges:
        for tpl in activity_templates:
            existing = db.query(DietPlanTemplate).filter_by(
                weight_range=wr["range"],
                activity=tpl["activity"]
            ).first()
            if existing:
                continue

            cal_maint = tpl["base_cals"] + wr["cal_offset"]
            cal_gain = round(cal_maint * 1.18 / 50) * 50
            cal_loss = round(cal_maint * 0.82 / 50) * 50
            prot = tpl["base_prot"] + wr["prot_offset"]
            carbs = tpl["base_carbs"] + (wr["cal_offset"] * 0.1)
            fat = tpl["base_fat"] + (wr["cal_offset"] * 0.02)

            plan = DietPlanTemplate(
                weight_range=wr["range"],
                weight_min_kg=wr["min"],
                weight_max_kg=wr["max"],
                activity_type=tpl["activity_type"],
                activity=tpl["activity"],
                activity_intensity=tpl["activity_intensity"],
                nutrition_priority=tpl["nutrition_priority"],
                main_food_groups=tpl["main_food_groups"],
                breakfast=tpl["breakfast"],
                mid_morning=tpl["mid_morning"],
                lunch=tpl["lunch"],
                pre_training=tpl["pre_training"],
                post_training=tpl["post_training"],
                dinner=tpl["dinner"],
                hydration=tpl["hydration"],
                app_personalization=tpl["app_personalization"],
                portion_logic=tpl["portion_logic"],
                calories_maintain=cal_maint,
                calories_gain=cal_gain,
                calories_loss=cal_loss,
                protein_target_g=prot,
                carbs_target_g=carbs,
                fat_target_g=fat,
                water_liters_min=wr["water_min"],
                water_liters_max=wr["water_max"],
                icon=tpl["icon"],
            )
            db.add(plan)

    db.commit()
    print("Seeded all 24 Diet Planning reference templates successfully!")

