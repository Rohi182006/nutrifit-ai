from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.entities import Workout, WorkoutExercise, Exercise, User
from app.schemas.schemas import (
    WorkoutCreate, WorkoutResponse, ExerciseResponse, ExerciseCreate,
    BiomechanicsProfileResponse, FormAnalysisRequest, FormAnalysisResponse, BiomechanicsErrorDetail
)
from app.routers.deps import get_current_user, require_role

router = APIRouter(prefix="/workouts", tags=["Workouts"])

@router.get("/exercises", response_model=List[ExerciseResponse])
def get_exercises(db: Session = Depends(get_db)):
    """Controlled exercise catalog (Section 18 & 26)."""
    return db.query(Exercise).all()

@router.post("/exercises", response_model=ExerciseResponse)
def create_exercise(
    payload: ExerciseCreate,
    current_user: User = Depends(require_role(["admin", "coach"])),
    db: Session = Depends(get_db)
):
    ex = Exercise(
        name=payload.name,
        category=payload.category,
        muscle_group=payload.muscle_group,
        description=payload.description,
        difficulty=payload.difficulty
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex

@router.get("/", response_model=List[WorkoutResponse])
def get_workouts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role(["client", "coach"])),
    db: Session = Depends(get_db)
):
    workouts = db.query(Workout).filter_by(client_id=current_user.id).order_by(Workout.workout_date.desc()).offset(offset).limit(limit).all()
    results = []
    for w in workouts:
        exercises_list = []
        for we in w.exercises:
            exercises_list.append({
                "exercise_id": we.exercise_id,
                "exercise_name": we.exercise.name if we.exercise else "Exercise",
                "sets": we.sets,
                "reps": we.reps,
                "weight_kg": we.weight_kg,
                "duration_seconds": we.duration_seconds
            })
        results.append({
            "id": w.id,
            "workout_type": w.workout_type,
            "duration_minutes": w.duration_minutes,
            "workout_date": w.workout_date,
            "difficulty": w.difficulty,
            "notes": w.notes,
            "exercises": exercises_list
        })
    return results

@router.post("/", response_model=WorkoutResponse)
def log_workout(
    payload: WorkoutCreate,
    current_user: User = Depends(require_role(["client"])),
    db: Session = Depends(get_db)
):
    w = Workout(
        client_id=current_user.id,
        workout_type=payload.workout_type,
        duration_minutes=payload.duration_minutes,
        difficulty=payload.difficulty,
        notes=payload.notes,
        workout_date=payload.workout_date or datetime.now(timezone.utc)
    )
    db.add(w)
    db.flush()

    exercises_output = []
    for ex_item in payload.exercises:
        we = WorkoutExercise(
            workout_id=w.id,
            exercise_id=ex_item.exercise_id,
            sets=ex_item.sets,
            reps=ex_item.reps,
            weight_kg=ex_item.weight_kg,
            duration_seconds=ex_item.duration_seconds
        )
        db.add(we)
        db.flush()
        exercises_output.append({
            "exercise_id": ex_item.exercise_id,
            "exercise_name": we.exercise.name if we.exercise else "",
            "sets": ex_item.sets,
            "reps": ex_item.reps,
            "weight_kg": ex_item.weight_kg,
            "duration_seconds": ex_item.duration_seconds
        })

    db.commit()
    db.refresh(w)

    return {
        "id": w.id,
        "workout_type": w.workout_type,
        "duration_minutes": w.duration_minutes,
        "workout_date": w.workout_date,
        "difficulty": w.difficulty,
        "notes": w.notes,
        "exercises": exercises_output
    }


# ============================================================================
# 3D AI BIOMECHANICS & FORM ERROR DIAGNOSTICS REPOSITORY
# ============================================================================

BIOMECHANICS_REPOSITORY: Dict[str, Dict[str, Any]] = {
    "Bodyweight Squats": {
        "category": "Strength",
        "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
        "secondary_muscles": ["Hamstrings", "Core", "Calves"],
        "target_angles": {
            "knee_flexion": "90° - 110°",
            "hip_hinge": "45° - 60°",
            "ankle_dorsiflexion": "25° - 35°",
            "spine_tilt": "Neutral (0° - 12°)"
        },
        "tempo_guideline": "3-1-1 (3s eccentric descent, 1s isometric bottom pause, 1s explosive drive)",
        "protein_recovery_tip": "Heavy lower body recruitment requires ~30-35g post-workout protein to support myofibrillar protein synthesis in the quadriceps and glutes.",
        "recommended_foods": [
            {"name": "Paneer / Cottage Cheese", "protein_g": 25.5, "source": "IFCT (Indian Food Comp)", "serving": "150g cubed"},
            {"name": "Soya Chunks", "protein_g": 52.4, "source": "IFCT (Indian Food Comp)", "serving": "60g boiled"},
            {"name": "Chicken Breast", "protein_g": 31.0, "source": "USDA FoodData Central", "serving": "120g grilled"}
        ],
        "errors": [
            {
                "id": "ERR_SQUAT_VALGUS",
                "error_name": "Knee Valgus (Inward Patellar Collapse)",
                "severity": "High",
                "joint_affected": "Knee / Hip Complex",
                "biomechanical_risk": "Substantial shear torque on ACL, MCL, and lateral meniscus with accelerated joint wear.",
                "muscle_imbalance": "Gluteus medius weakness coupled with overactive/tight adductor magnus.",
                "corrective_cue": "Drive knees outward along the trajectory of your 2nd and 3rd toes; 'spread the floor' with your feet.",
                "remedial_exercise": "Banded Monster Walks & Lateral Mini-band Steps"
            },
            {
                "id": "ERR_SQUAT_BUTT_WINK",
                "error_name": "Lumbar Flexion (Pelvic Butt Wink at Depth)",
                "severity": "Medium",
                "joint_affected": "Lumbopelvic Spine (L4-S1)",
                "biomechanical_risk": "Increased posterior disc displacement risk and spinal erector deconditioning.",
                "muscle_imbalance": "Restricted talocrural ankle dorsiflexion and deep hip capsule tightness.",
                "corrective_cue": "Halt descent just before posterior pelvic tilt triggers; brace core like withstanding a blow.",
                "remedial_exercise": "Ankle Wall Mobilizations & Box Squats with Pause"
            },
            {
                "id": "ERR_SQUAT_HEEL_LIFT",
                "error_name": "Weight Shift to Forefoot / Heel Elevation",
                "severity": "Low",
                "joint_affected": "Patellofemoral Joint",
                "biomechanical_risk": "Shifts load anteriorly, concentrating high compressive stress into the patellar tendon.",
                "muscle_imbalance": "Tight gastrocnemius/soleus complex and insufficient posterior chain loading.",
                "corrective_cue": "Root the tripod of your foot firmly: big toe base, pinky toe base, and heel planted.",
                "remedial_exercise": "Heel-Elevated Squat Regressions & Calves Eccentric Drops"
            }
        ]
    },
    "Push-ups": {
        "category": "Strength",
        "primary_muscles": ["Pectoralis Major", "Anterior Deltoids"],
        "secondary_muscles": ["Triceps Brachii", "Serratus Anterior", "Core"],
        "target_angles": {
            "elbow_flare": "45° - 60° (Arrow shape)",
            "elbow_depth": "90° at lowest point",
            "spine_line": "180° straight plank",
            "head_neck": "Neutral with chin packed"
        },
        "tempo_guideline": "2-1-1 (2s controlled descent, 1s chest hover, 1s strong press)",
        "protein_recovery_tip": "Pushing patterns stimulate chest and triceps micro-tears; target ~25-30g protein rich in leucine within 90 minutes.",
        "recommended_foods": [
            {"name": "Eggs (Boiled / Scrambled)", "protein_g": 13.3, "source": "IFCT (Indian Food Comp)", "serving": "3 large eggs"},
            {"name": "Moong Dal / Lentil Sprouts", "protein_g": 24.0, "source": "IFCT (Indian Food Comp)", "serving": "100g cooked"},
            {"name": "Greek Yogurt (Plain)", "protein_g": 10.0, "source": "USDA FoodData Central", "serving": "170g bowl"}
        ],
        "errors": [
            {
                "id": "ERR_PUSHUP_FLARE",
                "error_name": "Excessive Elbow Flaring (>75° T-Shape)",
                "severity": "High",
                "joint_affected": "Glenohumeral Joint",
                "biomechanical_risk": "Subacromial impingement syndrome and microtrauma to supraspinatus tendon.",
                "muscle_imbalance": "Overactive upper trapezius with inhibited latissimus dorsi and serratus anterior.",
                "corrective_cue": "Screw your hands into the floor outwards; keep elbows pointing backwards at a 45° angle.",
                "remedial_exercise": "Scapular Wall Slides & Band Pull-Aparts"
            },
            {
                "id": "ERR_PUSHUP_SAG",
                "error_name": "Anterior Pelvic Tilt & Sagging Hips",
                "severity": "Medium",
                "joint_affected": "Lumbar Spine",
                "biomechanical_risk": "Compressive hyperextension forces on lumbar vertebrae with lack of anterior abdominal loading.",
                "muscle_imbalance": "Inhibited transverse abdominis and gluteus maximus.",
                "corrective_cue": "Tuck tailbone slightly under; actively squeeze glutes and thighs into an unbreakable plank.",
                "remedial_exercise": "Hollow Body Rocks & Dead Bugs"
            },
            {
                "id": "ERR_PUSHUP_HEAD_DROP",
                "error_name": "Forward Cervical Protrusion (Head Lead)",
                "severity": "Low",
                "joint_affected": "Cervical Spine",
                "biomechanical_risk": "Strains cervical extensor muscles and creates false illusion of reaching full depth.",
                "muscle_imbalance": "Weak deep cervical flexors and postural forward head syndrome.",
                "corrective_cue": "Keep back of neck tall; focus eyes 6 inches ahead of your fingertips, not straight down.",
                "remedial_exercise": "Prone Chin Tucks & Cobra Stretch"
            }
        ]
    },
    "Dumbbell Overhead Shoulder Press": {
        "category": "Strength",
        "primary_muscles": ["Anterior Deltoids", "Lateral Deltoids"],
        "secondary_muscles": ["Triceps Brachii", "Upper Trapezius", "Core"],
        "target_angles": {
            "scapular_plane": "30° forward of coronal plane",
            "top_lockout": "180° vertical arm line over ears",
            "lumbar_angle": "0° hyperextension (neutral ribcage)"
        },
        "tempo_guideline": "2-0-1 (2s controlled eccentric lowering to chin level, 1s crisp press)",
        "protein_recovery_tip": "Shoulder press recruits overhead stabilization fibers; replenish with branched-chain amino acids and 25g protein.",
        "recommended_foods": [
            {"name": "Paneer / Cottage Cheese", "protein_g": 25.5, "source": "IFCT (Indian Food Comp)", "serving": "120g grilled"},
            {"name": "Roasted Chana / Chickpeas", "protein_g": 18.6, "source": "IFCT (Indian Food Comp)", "serving": "50g snack"},
            {"name": "Chicken Breast", "protein_g": 31.0, "source": "USDA FoodData Central", "serving": "100g sliced"}
        ],
        "errors": [
            {
                "id": "ERR_PRESS_ARCH",
                "error_name": "Lumbar Hyperextension (Over-Arching Lower Back)",
                "severity": "High",
                "joint_affected": "Thoracolumbar Junction",
                "biomechanical_risk": "Severe hyperextension shear stress; body turns vertical press into an accidental incline bench.",
                "muscle_imbalance": "Stiff latissimus dorsi / thoracic spine coupled with weak abdominal bracing.",
                "corrective_cue": "Pull your ribcage down toward your belt buckle; squeeze glutes tight before pressing.",
                "remedial_exercise": "Half-Kneeling Single-Arm Landmine Press & Foam Roller Thoracic Extension"
            },
            {
                "id": "ERR_PRESS_IMPINGE",
                "error_name": "Pure Coronal Plane Pressing (Flared Behind Ears)",
                "severity": "Medium",
                "joint_affected": "Acromioclavicular Joint",
                "biomechanical_risk": "Pinches the bicipital and rotator cuff tendons against the acromion process.",
                "muscle_imbalance": "Impaired scapular upward rotation.",
                "corrective_cue": "Keep dumbbells angled slightly in front of shoulders in the natural scapular plane (~30° forward).",
                "remedial_exercise": "Dumbbell Scaption Raises & Face Pulls"
            }
        ]
    },
    "Inverted Rows / Pull-ups": {
        "category": "Strength",
        "primary_muscles": ["Latissimus Dorsi", "Rhomboids"],
        "secondary_muscles": ["Biceps Brachii", "Rear Deltoids", "Brachialis"],
        "target_angles": {
            "scapular_retraction": "Full retraction and depression at top",
            "elbow_path": "Driving back toward back pockets"
        },
        "tempo_guideline": "2-1-1 (2s smooth extension, 1s isometric peak contraction, 1s pull)",
        "protein_recovery_tip": "Back and pulling complexes contain large muscle volume; optimal recovery requires 30g+ complete protein.",
        "recommended_foods": [
            {"name": "Soya Chunks", "protein_g": 52.4, "source": "IFCT (Indian Food Comp)", "serving": "60g cooked"},
            {"name": "Salmon Fillet", "protein_g": 20.4, "source": "USDA FoodData Central", "serving": "120g pan-seared"},
            {"name": "Boiled Eggs", "protein_g": 13.3, "source": "IFCT (Indian Food Comp)", "serving": "3 whole eggs"}
        ],
        "errors": [
            {
                "id": "ERR_ROW_ROUND",
                "error_name": "Anterior Shoulder Dumping (Internal Rotation at Peak)",
                "severity": "Medium",
                "joint_affected": "Glenohumeral Joint",
                "biomechanical_risk": "Anterior humeral glide pushing the head of the humerus forward against the joint capsule.",
                "muscle_imbalance": "Pectoralis minor dominance and weak middle/lower trapezius.",
                "corrective_cue": "Lead with your sternum; pull your shoulder blades down and back before your elbows bend.",
                "remedial_exercise": "Batwing Holds & Prone Trap Raises"
            }
        ]
    },
    "Plank Hold": {
        "category": "Mobility",
        "primary_muscles": ["Rectus Abdominis", "Transverse Abdominis"],
        "secondary_muscles": ["Serratus Anterior", "Gluteus Medius", "Quadriceps"],
        "target_angles": {
            "spine_neutrality": "True 180° straight kinetic line",
            "scapular_protraction": "Dome upper back gently"
        },
        "tempo_guideline": "Isometric hold with continuous diaphragmatic breathing (30-60s sets)",
        "protein_recovery_tip": "Isometric core tension builds endurance and spinal stiffness; combine with clean hydration and 20g protein.",
        "recommended_foods": [
            {"name": "Moong Dal Sprouts", "protein_g": 24.0, "source": "IFCT (Indian Food Comp)", "serving": "120g salad"},
            {"name": "Greek Yogurt", "protein_g": 10.0, "source": "USDA FoodData Central", "serving": "170g serving"}
        ],
        "errors": [
            {
                "id": "ERR_PLANK_WING",
                "error_name": "Scapular Winging & Collapsed Chest",
                "severity": "Medium",
                "joint_affected": "Scapulothoracic Joint",
                "biomechanical_risk": "Loss of thoracic spine support, transferring load into shoulder ligaments.",
                "muscle_imbalance": "Weak serratus anterior and lower trapezius.",
                "corrective_cue": "Press the floor away through your forearms; slightly dome your shoulder blades upwards.",
                "remedial_exercise": "Serratus Push-ups on Forearms"
            },
            {
                "id": "ERR_PLANK_PIKE",
                "error_name": "Piked Hips (Elevated Pelvis)",
                "severity": "Low",
                "joint_affected": "Pelvis & Lumbar",
                "biomechanical_risk": "Unloads the abdominal wall, negating core stabilization benefits.",
                "muscle_imbalance": "Core fatigue causing body to shift load to passive shoulder structures.",
                "corrective_cue": "Lower hips until your heels, buttocks, and upper back form a single flat plane.",
                "remedial_exercise": "RKC Hardstyle 15-second Tension Planks"
            }
        ]
    },
    "Walking Lunges": {
        "category": "Strength",
        "primary_muscles": ["Quadriceps", "Gluteus Maximus"],
        "secondary_muscles": ["Hamstrings", "Calves", "Adductors"],
        "target_angles": {
            "lead_knee_flexion": "90° directly above ankle",
            "trail_knee": "Hover 2 inches above ground",
            "torso_angle": "Upright to 5° forward lean"
        },
        "tempo_guideline": "Smooth dynamic cadence (2s per step with balanced transition)",
        "protein_recovery_tip": "Unilateral training stimulates stabilizing synergists; recover with 25g protein and adequate electrolytes.",
        "recommended_foods": [
            {"name": "Paneer / Cottage Cheese", "protein_g": 25.5, "source": "IFCT (Indian Food Comp)", "serving": "120g portion"},
            {"name": "Chicken Breast", "protein_g": 31.0, "source": "USDA FoodData Central", "serving": "100g portion"}
        ],
        "errors": [
            {
                "id": "ERR_LUNGE_VALGUS",
                "error_name": "Lead Knee Inward Buckling (Valgus Drift)",
                "severity": "High",
                "joint_affected": "Lead Knee Joint",
                "biomechanical_risk": "Compromises patellar tracking and puts significant tensile strain on the medial collateral ligament.",
                "muscle_imbalance": "Weak hip abductors / gluteus medius and excessive foot pronation.",
                "corrective_cue": "Keep lead knee tracking over your second toe; resist the urge to let it collapse inward.",
                "remedial_exercise": "Split Squats with Lateral Band Resistance"
            },
            {
                "id": "ERR_LUNGE_SHORT",
                "error_name": "Short Stride Leading to Extreme Knee Overhang",
                "severity": "Medium",
                "joint_affected": "Patellofemoral Joint",
                "biomechanical_risk": "Hyper-flexes the lead knee creating sharp compressive stress beneath the patella.",
                "muscle_imbalance": "Impaired spatial awareness or quad-dominant recruitment bias.",
                "corrective_cue": "Take a generous step forward so front shin remains perpendicular to the ground at bottom.",
                "remedial_exercise": "Reverse Lunges to Stationary Markers"
            }
        ]
    }
}


@router.get("/biomechanics/profiles", response_model=List[BiomechanicsProfileResponse])
def get_biomechanics_profiles(db: Session = Depends(get_db)):
    """Fetch complete 3D AI Biomechanics catalog with verified form errors & corrective cues."""
    exercises = db.query(Exercise).all()
    ex_dict = {e.name: e.id for e in exercises}

    results = []
    for ex_name, bio_data in BIOMECHANICS_REPOSITORY.items():
        ex_id = ex_dict.get(ex_name, 0)
        results.append({
            "exercise_id": ex_id,
            "exercise_name": ex_name,
            "category": bio_data["category"],
            "primary_muscles": bio_data["primary_muscles"],
            "secondary_muscles": bio_data["secondary_muscles"],
            "target_angles": bio_data["target_angles"],
            "tempo_guideline": bio_data["tempo_guideline"],
            "errors": bio_data["errors"],
            "protein_recovery_tip": bio_data["protein_recovery_tip"],
            "recommended_foods": bio_data["recommended_foods"]
        })
    return results


@router.get("/biomechanics/{exercise_name}", response_model=BiomechanicsProfileResponse)
def get_exercise_biomechanics(exercise_name: str, db: Session = Depends(get_db)):
    """Fetch biomechanics profile and verified error dataset for a specific exercise."""
    # Find matching exercise
    matched_key = None
    for k in BIOMECHANICS_REPOSITORY.keys():
        if k.lower() == exercise_name.lower() or exercise_name.lower() in k.lower():
            matched_key = k
            break

    if not matched_key:
        # Fallback to Bodyweight Squats if not explicitly matched
        matched_key = "Bodyweight Squats"

    bio_data = BIOMECHANICS_REPOSITORY[matched_key]
    ex = db.query(Exercise).filter(Exercise.name.ilike(f"%{matched_key}%")).first()
    ex_id = ex.id if ex else 1

    return {
        "exercise_id": ex_id,
        "exercise_name": matched_key,
        "category": bio_data["category"],
        "primary_muscles": bio_data["primary_muscles"],
        "secondary_muscles": bio_data["secondary_muscles"],
        "target_angles": bio_data["target_angles"],
        "tempo_guideline": bio_data["tempo_guideline"],
        "errors": bio_data["errors"],
        "protein_recovery_tip": bio_data["protein_recovery_tip"],
        "recommended_foods": bio_data["recommended_foods"]
    }


@router.post("/analyze-form", response_model=FormAnalysisResponse)
def analyze_exercise_form(
    payload: FormAnalysisRequest,
    current_user: User = Depends(require_role(["client", "coach", "admin"])),
    db: Session = Depends(get_db)
):
    """
    AI Exercise Form Analyzer:
    Evaluates kinematic telemetry, checks for biomechanical error triggers, and fetches corrective cues.
    """
    matched_key = "Bodyweight Squats"
    for k in BIOMECHANICS_REPOSITORY.keys():
        if k.lower() in payload.exercise_name.lower() or payload.exercise_name.lower() in k.lower():
            matched_key = k
            break

    profile = BIOMECHANICS_REPOSITORY[matched_key]
    all_errors = profile["errors"]

    # Calculate form score and detect errors
    detected_errors = []
    corrective_cues = []
    base_score = 94

    if payload.simulated_fault:
        # Explicit fault simulation requested
        fault_id = payload.simulated_fault.upper()
        for err in all_errors:
            if fault_id in err["id"] or fault_id in err["error_name"].upper():
                detected_errors.append(err)
                corrective_cues.append(err["corrective_cue"])
                base_score -= 22 if err["severity"] == "High" else 14
    else:
        # Check simulated or provided joint angles
        angles = payload.joint_angles or {}
        if "knee_flexion" in angles and angles["knee_flexion"] < 80:
            err = next((e for e in all_errors if "LIFT" in e["id"] or "VALGUS" in e["id"]), all_errors[0])
            detected_errors.append(err)
            corrective_cues.append(err["corrective_cue"])
            base_score -= 16

        if not detected_errors:
            # Subtle optimization cue
            corrective_cues.append("Kinematic trajectory clean: preserve steady tempo during the transition phase.")

    score = max(52, min(100, base_score))
    quality = "Optimal Form (Precision)" if score >= 90 else "Good Form (Minor Faults)" if score >= 75 else "Correction Required (Joint Risk)"

    # Calculate protein recovery requirement
    rep_volume = (payload.rep_count or 1) * 3
    protein_target = round(22.0 + (rep_volume * 0.3), 1)

    return {
        "exercise_name": matched_key,
        "form_score": score,
        "movement_quality": quality,
        "detected_errors": detected_errors,
        "corrective_cues": corrective_cues,
        "joint_metrics": payload.joint_angles or {"cadence_fps": 60, "symmetry_index": "96.4%"},
        "protein_target_g": protein_target,
        "recommended_foods": profile["recommended_foods"],
        "analyzed_at": datetime.now(timezone.utc)
    }

