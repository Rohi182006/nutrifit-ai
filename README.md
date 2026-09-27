# NutriFit AI — Intelligent Fitness & Nutrition Recommendation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0+-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

A modern, production-ready, client-based intelligent fitness, nutrition, and protein food recommendation platform designed for functional wellness, meal tracking, and explainable AI-driven dietary guidance.

---

## 🌟 The Core Differentiator

> **"A personalized nutrition recommendation system that converts user preferences and verified nutrition composition data into explainable food recommendations."**

Unlike generic calorie counting apps or restrictive dieting software, NutriFit AI uses a **4-step hybrid recommendation engine** grounded strictly in verified nutritional tables (**IFCT** and **USDA**). Every suggestion includes transparent **Match Scores (%)** and explicit **"Why this food?"** reasonings.

```
CLIENT PROFILE → FITNESS DATA → FOOD PREFERENCES → NUTRITION ANALYSIS → AI RECOMMENDATION → PROTEIN FOOD SUGGESTIONS → PROGRESS TRACKING
```

---

## 🚀 Key Features & Architectural Highlights

1. **Verified Nutrition Dataset (No LLM Hallucinations)**:
   - Primary: **IFCT (Indian Food Composition Tables)** for Indian, South Indian, and North Indian regional staples.
   - Secondary: **USDA FoodData Central** for continental, global, and supplement items.
   - Traceable `source` tagging on every food composition entry.

2. **4-Step Hybrid Recommendation Pipeline**:
   - **Step 1 (Hard Filtering)**: Strict sequential removal of foods violating dietary boundaries (*Vegan*, *Vegetarian*, *Eggetarian*, *Non-Vegetarian*, or *Other* exclusions), structured allergen intersections (*food_allergens* junction table), and explicit food avoidances.
   - **Step 2 (Preference Filtering)**: Cuisine matching and historical meal affinity.
   - **Step 3 (Nutrition Density)**: Protein content per serving and macro suitability.
   - **Step 4 (Personalization Engine)**: Priority-weighted signals (*Favorites [1.0]* > *Feedback 👍/👎 [0.85]* > *Food Logs [0.6]* > *Search History [0.3]*).

3. **Transparent Configurable Scoring Formula (Section 9 & 26)**:
   - Dynamic formula weights loaded from the `recommendation_rules` database table:
     $$\text{Match Score} = \frac{(\text{Diet} \times W_{\text{diet}}) + (\text{Cuisine} \times W_{\text{cuisine}}) + (\text{Preference} \times W_{\text{pref}}) + (\text{Feedback} \times W_{\text{fb}}) + (\text{Nutrition} \times W_{\text{nutr}})}{\sum W}$$
   - Tunable in real-time by administrators via `/admin/recommendation-rules`.

4. **Multi-Role RBAC with Strict API-Level Coach Boundaries**:
   - **Client**: Multi-step onboarding, workout & meal logging, protein suggestions, favorite foods, habit goals, 7-chart wellness analytics.
   - **Coach**: Strictly constrained by the `coach_clients` mapping table. **Accessing or querying an unassigned client returns HTTP 403 Forbidden at the API layer**, preventing unauthorized data leaks.
   - **Admin**: Food catalog editor, coach-to-client allocator, rule weight tuning, audit logging.

5. **NLP & Semantic Food Search (TF-IDF Cosine Similarity)**:
   - Parses natural queries (e.g. *"South Indian protein sources"*, *"high protein vegetarian food without dairy"*), extracts structured entity filters, and computes cosine similarity against food feature vectors.

6. **RAG-Based AI Nutrition Assistant**:
   - Retrieval-augmented chatbot querying the platform's verified food database.
   - Built-in clinical boundary guardrails redirecting medical condition queries (diabetes, cures, hypertension) to licensed physicians and registered dietitians.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Login)

The system automatically seeds demo accounts for immediate role evaluation:

| Role | Email | Password | Details |
|---|---|---|---|
| **Client** | `client.rohith@nutrifit.ai` | `Client@123` | Rohith Kumar (Vegetarian, Indian, General Fitness) |
| **Client (Vegan)** | `client.ananya@nutrifit.ai` | `Client@123` | Ananya Sharma (Vegan athlete, South Indian, Strength) |
| **Fitness Coach** | `coach.sarah@nutrifit.ai` | `Coach@123` | Sarah Jenkins, CSCS (Assigned explicitly to Rohith) |
| **Administrator** | `admin@nutrifit.ai` | `Admin@123` | Dr. Alex Rivera (Platform administrator) |

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, Bcrypt, Scikit-Learn (TF-IDF Vectorizer & Cosine Similarity)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Zustand, Axios
- **Database**: PostgreSQL (Production/Docker) with SQLite automatic fallback for local plug-and-play
- **Cache/Session**: Redis (for token blacklist & recommendation caching)
- **Containerization**: Multi-stage Dockerfiles + Docker Compose

---

## 📂 Project Architecture

```
fit-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI lifespan, CORS, and versioned router mount
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings and secrets
│   │   │   ├── database.py          # SQLAlchemy engine, session, Base
│   │   │   └── security.py          # JWT, rotating refresh tokens, password hashing
│   │   ├── models/
│   │   │   └── entities.py          # Complete 27 database tables conforming to Section 26
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic v2 validation schemas
│   │   ├── ai/
│   │   │   ├── recommendation_engine.py # 4-step hybrid recommendation pipeline
│   │   │   ├── nlp_service.py       # Intent & entity filter extraction
│   │   │   ├── semantic_search.py   # TF-IDF Cosine Similarity semantic search
│   │   │   └── rag_assistant.py     # RAG chatbot with clinical guardrails
│   │   ├── routers/
│   │   │   ├── auth.py              # Register, login, refresh rotation, logout
│   │   │   ├── clients.py           # Onboarding, profile, client dashboard
│   │   │   ├── foods.py             # Food discovery, comparison, favorites
│   │   │   ├── recommendations.py   # AI recommendations & 👍/👎 feedback
│   │   │   ├── workouts.py          # Workout logger with exercise catalog
│   │   │   ├── activity.py          # Steps, active minutes, movement logs
│   │   │   ├── nutrition.py         # Meal tracking with macro calculations
│   │   │   ├── goals.py             # Habit consistency goals
│   │   │   ├── analytics.py         # 7-chart wellness metrics
│   │   │   ├── coaches.py           # Strictly scoped coach-client endpoints
│   │   │   ├── admin.py             # Users, assignments, rule weights, audit logs
│   │   │   └── assistant.py         # RAG chatbot and NLP search endpoints
│   │   └── seeds/
│   │       └── seed_data.py         # Verified IFCT/USDA nutrition seed data
│   ├── alembic/                     # Alembic migration revisions
│   ├── tests/
│   │   └── test_api.py              # Automated pytest suite (6 tests)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts            # Axios with rotating refresh token interceptor
│   │   ├── store/useStore.ts        # Zustand global state store
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Role-aware responsive navigation
│   │   │   └── Layout.tsx           # Layout with health boundary footer & toast
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Interactive hero with 1-click role switcher
│   │   │   ├── LoginPage.tsx        # Authentication with demo quick-fill
│   │   │   ├── RegisterPage.tsx     # Client onboarding registration
│   │   │   ├── OnboardingPage.tsx   # 6-step client personalization wizard
│   │   │   ├── ClientDashboard.tsx  # Overview, recommendations, active goals
│   │   │   ├── RecommendationsPage.tsx # AI suggestions with "Why this food?"
│   │   │   ├── FoodDiscoveryPage.tsx# Catalog search with multi-filter & badges
│   │   │   ├── FoodComparisonPage.tsx # Side-by-side macro matrix & bar chart
│   │   │   ├── WorkoutsPage.tsx     # Workout tracking with exercise catalog
│   │   │   ├── NutritionPage.tsx    # Meal logger with macro scaling
│   │   │   ├── GoalsPage.tsx        # Functional goal progress tracker
│   │   │   ├── AnalyticsPage.tsx    # 7 Recharts wellness graphs
│   │   │   ├── FavoritesPage.tsx    # Saved foods with priority weighting
│   │   │   ├── AssistantPage.tsx    # RAG assistant & NLP semantic search
│   │   │   ├── CoachDashboard.tsx   # Coach overview
│   │   │   ├── CoachClientsPage.tsx # Scoped assigned client dossiers & 403 test
│   │   │   ├── AdminDashboard.tsx   # Platform metrics & audit logs
│   │   │   ├── AdminFoodsPage.tsx   # Food catalog management
│   │   │   ├── AdminUsersPage.tsx   # Users & coach allocation
│   │   │   └── AdminRecommendationRulesPage.tsx # Algorithm weights tuner
│   │   ├── types/index.ts
│   │   ├── App.tsx                  # React Router with protected route guards
│   │   └── index.css                # Custom glassmorphism & typography
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🏃 Quick Start Guide

### Option 0: 100% Offline 1-Click Launch (Browser URL Link)
**No internet connection required. Zero npm or node runtime needed.**
- Simply double-click [`Launch NutriFit AI (Offline Browser).bat`](file:///d:/Porject  #/fit tracker/Launch NutriFit AI (Offline Browser).bat) in the project folder.
- Or open [`NutriFit AI Offline URL.url`](file:///d:/Porject  #/fit tracker/NutriFit AI Offline URL.url) (Windows Internet Shortcut).
- The offline service automatically starts the local backend and serves the application at **`http://localhost:3000`** in your default web browser.

### Option 1: Local Development (Instant Plug & Play)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*The database automatically creates and seeds `nutrifit.db` with verified IFCT/USDA items, exercises, and demo users.*

#### 2. Run Backend Tests
```bash
# In backend/ with active venv:
python -m pytest tests/test_api.py -v
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

### Option 2: Run with Docker Compose

Run the entire full-stack application (Frontend + Backend + PostgreSQL + Redis) in one command:

```bash
docker compose up --build
```

Access services:
- **Frontend Web Application**: `http://localhost:3000`
- **Backend Swagger API Docs**: `http://localhost:8000/docs`
- **PostgreSQL Database**: `localhost:5432` (`nutrifit_db`)
- **Redis Cache**: `localhost:6379`

---

## 🎯 Interview Briefing & Answers

### Question: "What is your project?"
> *"I developed an AI-powered Fitness and Nutrition Recommendation Platform called **NutriFit AI** that helps clients discover suitable protein-source foods based on their dietary preferences, food preferences, activity patterns, and wellness goals.*
>
> *The system uses a **hybrid recommendation engine** that combines rule-based hard filtering (diet exclusions, structured allergen matching, and explicit food avoidance) with soft preference matching and content-based protein density ranking, scored through a configurable weighted formula stored in database rules.*
>
> *I also implemented semantic food search using NLP embeddings and TF-IDF cosine similarity, allowing users to search using natural language, and a retrieval-augmented (RAG) chat assistant that strictly draws from verified IFCT and USDA composition tables rather than letting the LLM hallucinate nutrition facts.*
>
> *The platform is built using React 19, TypeScript, FastAPI, and PostgreSQL with role-based access for clients, coaches, and administrators, including strict coach-to-client assignment boundary enforcement at the API layer."*

---

## 🛡️ Health & Safety Boundaries (Section 38)
NutriFit AI is a general wellness, functional fitness, and protein recommendation platform. It does not provide medical diagnoses, treatment plans, or clinical prescriptions. When clinical condition terms are detected, users are directed to consult a licensed physician or registered dietitian.
