import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.seeds.seed_data import seed_database
from app.models.entities import User, FoodItem, Allergy, FoodAllergen, ClientPreference, CoachClient

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite with StaticPool so all connections share the same DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_client():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "client.rohith@nutrifit.ai", "password": "Client@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "client.rohith@nutrifit.ai"
    assert data["user"]["role"] == "client"

def test_refresh_token_rotation():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "client.rohith@nutrifit.ai", "password": "Client@123"}
    )
    refresh_token = login_res.json()["refresh_token"]

    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["refresh_token"] != refresh_token  # Token rotated

    # Attempting to reuse old refresh token should fail
    old_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert old_res.status_code == 401

def test_recommendation_hard_filtering_and_vegan_exclusion():
    # Login as vegan client Ananya
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "client.ananya@nutrifit.ai", "password": "Client@123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/recommendations/?limit=20", headers=headers)
    assert res.status_code == 200
    data = res.json()
    items = data["items"]
    assert len(items) > 0

    # Ensure NO dairy (Paneer, Curd, Milk) or meat/eggs are recommended to Vegan
    for item in items:
        assert item["diet_type"] == "Vegan", f"Expected Vegan food for Ananya, got {item['food_name']} ({item['diet_type']})"
        assert item["category"].lower() not in ["dairy", "meat", "eggs", "fish"]
        assert "paneer" not in item["food_name"].lower()
        assert "egg" not in item["food_name"].lower()

def test_coach_strict_client_boundary():
    # Login as Sarah (Coach)
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "coach.sarah@nutrifit.ai", "password": "Coach@123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Sarah is assigned to Rohith (id=3 in seed). Should succeed.
    assigned_res = client.get("/api/v1/coaches/clients/3", headers=headers)
    assert assigned_res.status_code == 200
    assert assigned_res.json()["client"]["name"] == "Rohith Kumar"

    # Sarah is NOT assigned to Ananya (id=4 in seed). Should be rejected with 403 Forbidden!
    unassigned_res = client.get("/api/v1/coaches/clients/4", headers=headers)
    assert unassigned_res.status_code == 403
    assert "Access forbidden" in unassigned_res.json()["detail"]

def test_ai_assistant_medical_safety_boundary():
    # Login as client
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "client.rohith@nutrifit.ai", "password": "Client@123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ask a medical question
    res = client.post(
        "/api/v1/assistant/chat",
        headers=headers,
        json={"message": "Can you prescribe a cure or medicine for my diabetes?"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "medical" in data["reply"].lower() or "physician" in data["reply"].lower()
    assert "do not provide medical diagnosis" in data["disclaimer"].lower()
    assert len(data["recommended_foods"]) == 0

def test_biomechanics_profiles_and_form_analysis():
    # 1. Fetch profiles without auth (catalog is public for biomechanics studio)
    bio_res = client.get("/api/v1/workouts/biomechanics/profiles")
    assert bio_res.status_code == 200
    profiles = bio_res.json()
    assert len(profiles) >= 5
    squat = next(p for p in profiles if "Squat" in p["exercise_name"])
    assert "Quadriceps" in squat["primary_muscles"]
    assert len(squat["errors"]) >= 3
    assert any(e["id"] == "ERR_SQUAT_VALGUS" for e in squat["errors"])

    # 2. Login client to test form analysis
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "client.rohith@nutrifit.ai", "password": "Client@123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Analyze form with simulated fault
    analysis_res = client.post(
        "/api/v1/workouts/analyze-form",
        headers=headers,
        json={
            "exercise_name": "Bodyweight Squats",
            "simulated_fault": "ERR_SQUAT_VALGUS",
            "rep_count": 12
        }
    )
    assert analysis_res.status_code == 200
    data = analysis_res.json()
    assert data["exercise_name"] == "Bodyweight Squats"
    assert len(data["detected_errors"]) >= 1
    assert data["detected_errors"][0]["id"] == "ERR_SQUAT_VALGUS"
    assert "valgus" in data["detected_errors"][0]["error_name"].lower()
    assert len(data["corrective_cues"]) >= 1
    assert data["protein_target_g"] > 20
    assert len(data["recommended_foods"]) >= 1

