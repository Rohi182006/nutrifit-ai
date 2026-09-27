import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import api from '../api/client';
import { BiomechanicsProfile, BiomechanicsError, FormAnalysisResult } from '../types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Dumbbell,
  Eye,
  Flame,
  Info,
  Layers,
  Maximize2,
  Play,
  Pause,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react';

interface Fitness3DStudioProps {
  onLogWorkout?: (exerciseName: string, sets: number, reps: number) => void;
}

export const Fitness3DStudio: React.FC<Fitness3DStudioProps> = ({ onLogWorkout }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Studio State
  const [profiles, setProfiles] = useState<BiomechanicsProfile[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('Bodyweight Squats');
  const [activeProfile, setActiveProfile] = useState<BiomechanicsProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);
  const [activeErrorSim, setActiveErrorSim] = useState<string | null>(null);

  // Playback & View Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [renderMode, setRenderMode] = useState<'heatmap' | 'hologram' | 'skeleton'>('heatmap');
  const [cameraAngle, setCameraAngle] = useState<'iso' | 'front' | 'side' | 'top'>('iso');
  const [jointAngleDisplay, setJointAngleDisplay] = useState<{
    knee: number;
    hip: number;
    elbow: number;
    spine: number;
    phase: string;
  }>({
    knee: 100,
    hip: 55,
    elbow: 175,
    spine: 5,
    phase: 'Eccentric (Lowering)',
  });

  // Log Form State
  const [loggedSets, setLoggedSets] = useState<number>(3);
  const [loggedReps, setLoggedReps] = useState<number>(12);
  const [logSuccess, setLogSuccess] = useState<boolean>(false);

  // Animation & Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rigGroupRef = useRef<THREE.Group | null>(null);
  const limbsRef = useRef<{
    torsoGroup: THREE.Group;
    pelvisGroup: THREE.Group;
    headGroup: THREE.Group;
    leftArmGroup: THREE.Group;
    rightArmGroup: THREE.Group;
    leftForearmGroup: THREE.Group;
    rightForearmGroup: THREE.Group;
    leftLegGroup: THREE.Group;
    rightLegGroup: THREE.Group;
    leftShinGroup: THREE.Group;
    rightShinGroup: THREE.Group;
    barbellGroup: THREE.Group;
    leftKneeJoint: THREE.Mesh;
    rightKneeJoint: THREE.Mesh;
    leftElbowJoint: THREE.Mesh;
    rightElbowJoint: THREE.Mesh;
    chestMesh: THREE.Mesh;
    absMesh: THREE.Mesh;
    leftQuadMesh: THREE.Mesh;
    rightQuadMesh: THREE.Mesh;
    leftDeltoidMesh: THREE.Mesh;
    rightDeltoidMesh: THREE.Mesh;
    errorArrowGroup: THREE.Group;
  } | null>(null);

  const animTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotTargetRef = useRef<{ x: number; y: number }>({ x: 0.25, y: 0.4 });
  const rotCurrentRef = useRef<{ x: number; y: number }>({ x: 0.25, y: 0.4 });

  // 1. Fetch Biomechanics Profiles from FastAPI Backend
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const res = await api.get('/workouts/biomechanics/profiles');
        setProfiles(res.data);
        if (res.data.length > 0) {
          const defaultEx = res.data[0];
          setActiveProfile(defaultEx);
          setSelectedExercise(defaultEx.exercise_name);
        }
      } catch (err) {
        console.error('Failed to fetch biomechanics profiles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  // Update active profile when selection changes
  useEffect(() => {
    if (profiles.length > 0) {
      const match = profiles.find((p) => p.exercise_name === selectedExercise) || profiles[0];
      setActiveProfile(match);
      setActiveErrorSim(null);
      setAnalysisResult(null);
    }
  }, [selectedExercise, profiles]);

  // 2. Initialize Three.js 3D Kinematics Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 520;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.05);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0b1329, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 3.8);
    rimLight.position.set(-5, 6, -4);
    scene.add(rimLight);

    const emeraldAccent = new THREE.PointLight(0x10b981, 4.5, 12);
    emeraldAccent.position.set(0, 0.5, 2.5);
    scene.add(emeraldAccent);

    // Grid Floor with Concentric Biomechanical Target Rings
    const gridHelper = new THREE.GridHelper(12, 24, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    // Glowing Target Ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.25, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.59;
    scene.add(ringMesh);

    // Outer Radar Ring
    const outerRingGeo = new THREE.RingGeometry(2.4, 2.45, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = Math.PI / 2;
    outerRingMesh.position.y = -1.59;
    scene.add(outerRingMesh);

    // =========================================================================
    // 3D KINEMATIC ATHLETE RIG (Segmented Anatomical Model)
    // =========================================================================
    const rigGroup = new THREE.Group();
    rigGroup.position.y = -0.1;
    scene.add(rigGroup);
    rigGroupRef.current = rigGroup;

    // Materials
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const activeMuscleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.3,
    });

    const deltoidMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.3,
    });

    const jointMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const errorJointMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    // 1. Pelvis / Hips
    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 0, 0);
    rigGroup.add(pelvisGroup);

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.26, 16), metalMat);
    pelvisGroup.add(pelvisMesh);

    // 2. Torso (Spine, Abs, Chest)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.15, 0);
    pelvisGroup.add(torsoGroup);

    // Lower abs
    const absMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.3), activeMuscleMat.clone());
    absMesh.position.set(0, 0.25, 0);
    torsoGroup.add(absMesh);

    // Upper Ribcage / Pectorals
    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.45, 0.36), activeMuscleMat.clone());
    chestMesh.position.set(0, 0.65, 0);
    torsoGroup.add(chestMesh);

    // 3. Head & Visor
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.05, 0);
    torsoGroup.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), metalMat);
    headGroup.add(headMesh);

    // Cyber Visor
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    visorMesh.position.set(0, 0.03, 0.18);
    headGroup.add(visorMesh);

    // 4. Arms (Left & Right)
    // Left Shoulder
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.48, 0.72, 0);
    torsoGroup.add(leftArmGroup);

    const leftDeltoidMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), deltoidMat.clone());
    leftArmGroup.add(leftDeltoidMesh);

    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 12), metalMat);
    leftBicep.position.set(0, -0.25, 0);
    leftArmGroup.add(leftBicep);

    const leftElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
    leftElbowJoint.position.set(0, -0.5, 0);
    leftArmGroup.add(leftElbowJoint);

    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.5, 0);
    leftArmGroup.add(leftForearmGroup);

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.48, 12), metalMat);
    leftForearm.position.set(0, -0.24, 0);
    leftForearmGroup.add(leftForearm);

    // Right Shoulder
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.48, 0.72, 0);
    torsoGroup.add(rightArmGroup);

    const rightDeltoidMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), deltoidMat.clone());
    rightArmGroup.add(rightDeltoidMesh);

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 12), metalMat);
    rightBicep.position.set(0, -0.25, 0);
    rightArmGroup.add(rightBicep);

    const rightElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
    rightElbowJoint.position.set(0, -0.5, 0);
    rightArmGroup.add(rightElbowJoint);

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.5, 0);
    rightArmGroup.add(rightForearmGroup);

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.48, 12), metalMat);
    rightForearm.position.set(0, -0.24, 0);
    rightForearmGroup.add(rightForearm);

    // 5. Legs (Left & Right)
    // Left Leg / Hip
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.24, -0.12, 0);
    pelvisGroup.add(leftLegGroup);

    const leftQuadMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.7, 14), activeMuscleMat.clone());
    leftQuadMesh.position.set(0, -0.35, 0);
    leftLegGroup.add(leftQuadMesh);

    const leftKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), jointMat);
    leftKneeJoint.position.set(0, -0.7, 0);
    leftLegGroup.add(leftKneeJoint);

    const leftShinGroup = new THREE.Group();
    leftShinGroup.position.set(0, -0.7, 0);
    leftLegGroup.add(leftShinGroup);

    const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.7, 14), metalMat);
    leftShin.position.set(0, -0.35, 0);
    leftShinGroup.add(leftShin);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.32), metalMat);
    leftFoot.position.set(0, -0.7, 0.08);
    leftShinGroup.add(leftFoot);

    // Right Leg / Hip
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.24, -0.12, 0);
    pelvisGroup.add(rightLegGroup);

    const rightQuadMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.7, 14), activeMuscleMat.clone());
    rightQuadMesh.position.set(0, -0.35, 0);
    rightLegGroup.add(rightQuadMesh);

    const rightKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), jointMat);
    rightKneeJoint.position.set(0, -0.7, 0);
    rightLegGroup.add(rightKneeJoint);

    const rightShinGroup = new THREE.Group();
    rightShinGroup.position.set(0, -0.7, 0);
    rightLegGroup.add(rightShinGroup);

    const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.7, 14), metalMat);
    rightShin.position.set(0, -0.35, 0);
    rightShinGroup.add(rightShin);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.32), metalMat);
    rightFoot.position.set(0, -0.7, 0.08);
    rightShinGroup.add(rightFoot);

    // 6. Barbell / Prop Group
    const barbellGroup = new THREE.Group();
    const barMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
    );
    barMesh.rotation.z = Math.PI / 2;
    barbellGroup.add(barMesh);

    // Plates on bar
    [-0.95, 0.95].forEach((posX) => {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.06, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
      );
      plate.rotation.z = Math.PI / 2;
      plate.position.x = posX;
      barbellGroup.add(plate);
    });
    barbellGroup.position.set(0, 0.85, 0.25);
    rigGroup.add(barbellGroup);

    // 7. Error Warning Marker Group
    const errorArrowGroup = new THREE.Group();
    const alertCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    alertCone.rotation.x = Math.PI;
    errorArrowGroup.add(alertCone);
    errorArrowGroup.visible = false;
    scene.add(errorArrowGroup);

    limbsRef.current = {
      torsoGroup,
      pelvisGroup,
      headGroup,
      leftArmGroup,
      rightArmGroup,
      leftForearmGroup,
      rightForearmGroup,
      leftLegGroup,
      rightLegGroup,
      leftShinGroup,
      rightShinGroup,
      barbellGroup,
      leftKneeJoint,
      rightKneeJoint,
      leftElbowJoint,
      rightElbowJoint,
      chestMesh,
      absMesh,
      leftQuadMesh,
      rightQuadMesh,
      leftDeltoidMesh,
      rightDeltoidMesh,
      errorArrowGroup,
    };

    // =========================================================================
    // Mouse Interaction (Orbit Rotation & Zoom)
    // =========================================================================
    const onMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      rotTargetRef.current.y += dx * 0.007;
      rotTargetRef.current.x = Math.max(-0.6, Math.min(0.8, rotTargetRef.current.x + dy * 0.007));
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Clean up
    return () => {
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // 3. Main Animation Loop: Kinematics Oscillator & Real-Time Biomechanics
  useEffect(() => {
    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);

      const limbs = limbsRef.current;
      const rig = rigGroupRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!limbs || !rig || !renderer || !scene || !camera) return;

      // Smooth Orbit Camera Interpolation
      rotCurrentRef.current.x += (rotTargetRef.current.x - rotCurrentRef.current.x) * 0.08;
      rotCurrentRef.current.y += (rotTargetRef.current.y - rotCurrentRef.current.y) * 0.08;
      rig.rotation.y = rotCurrentRef.current.y;
      rig.rotation.x = rotCurrentRef.current.x;

      // Time progression
      if (isPlaying) {
        animTimeRef.current += 0.028 * playbackSpeed;
      }
      const t = animTimeRef.current;
      const cycle = (Math.sin(t) + 1) / 2; // 0.0 to 1.0 smooth cycle

      // Reset base positions
      limbs.barbellGroup.visible = false;
      limbs.errorArrowGroup.visible = false;
      (limbs.leftKneeJoint.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      (limbs.rightKneeJoint.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      (limbs.leftElbowJoint.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      (limbs.rightElbowJoint.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);

      // Exercise Specific Kinematics
      const ex = selectedExercise.toLowerCase();

      if (ex.includes('squat')) {
        // SQUAT KINEMATICS
        limbs.barbellGroup.visible = true;
        limbs.barbellGroup.position.set(0, 0.85 - cycle * 0.55, 0.05);

        // Hips sink down & back
        const hipSink = cycle * 0.55;
        limbs.pelvisGroup.position.y = -hipSink;
        limbs.pelvisGroup.position.z = -cycle * 0.15;

        // Torso inclines slightly forward
        limbs.torsoGroup.rotation.x = cycle * 0.28;

        // Thighs flex up/forward (hip flexion)
        limbs.leftLegGroup.rotation.x = -cycle * 1.5;
        limbs.rightLegGroup.rotation.x = -cycle * 1.5;

        // Shins bend back (knee flexion)
        limbs.leftShinGroup.rotation.x = cycle * 1.65;
        limbs.rightShinGroup.rotation.x = cycle * 1.65;

        // Arms hold barbell on back
        limbs.leftArmGroup.rotation.set(-0.3, 0, 0.4);
        limbs.leftForearmGroup.rotation.set(-1.4, 0, 0);
        rightArmSetup: {
          limbs.rightArmGroup.rotation.set(-0.3, 0, -0.4);
          limbs.rightForearmGroup.rotation.set(-1.4, 0, 0);
        }

        // Active Error Simulation: Knee Valgus
        if (activeErrorSim === 'ERR_SQUAT_VALGUS') {
          limbs.leftLegGroup.rotation.z = -cycle * 0.4;
          limbs.rightLegGroup.rotation.z = cycle * 0.4;
          (limbs.leftKneeJoint.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
          (limbs.rightKneeJoint.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
          limbs.errorArrowGroup.visible = true;
          limbs.errorArrowGroup.position.set(0, -0.5 - hipSink, 0.2);
        } else {
          limbs.leftLegGroup.rotation.z = 0.08;
          limbs.rightLegGroup.rotation.z = -0.08;
        }

        // Telemetry Update
        const kneeAngle = Math.round(180 - cycle * 85);
        const hipAngle = Math.round(55 + cycle * 45);
        setJointAngleDisplay({
          knee: kneeAngle,
          hip: hipAngle,
          elbow: 70,
          spine: Math.round(cycle * 14),
          phase: cycle > 0.85 ? 'Isometric Depth' : cycle > 0.4 ? 'Eccentric Lowering' : 'Concentric Drive',
        });
      } else if (ex.includes('push-up') || ex.includes('pushup')) {
        // PUSH-UP KINEMATICS
        rig.position.y = -0.8;
        limbs.pelvisGroup.position.set(0, 0, 0);

        // Body horizontal prone angle
        limbs.torsoGroup.rotation.x = 1.48;
        limbs.leftLegGroup.rotation.x = 1.5;
        limbs.rightLegGroup.rotation.x = 1.5;
        limbs.leftShinGroup.rotation.x = 0;
        limbs.rightShinGroup.rotation.x = 0;

        // Chest lowers to floor
        const chestDrop = cycle * 0.38;
        limbs.pelvisGroup.position.y = -chestDrop;

        // Elbow flare check
        const isFlaring = activeErrorSim === 'ERR_PUSHUP_FLARE';
        const flareZ = isFlaring ? 1.4 : 0.65;
        limbs.leftArmGroup.rotation.set(0, 0, flareZ + cycle * 0.4);
        limbs.rightArmGroup.rotation.set(0, 0, -flareZ - cycle * 0.4);
        limbs.leftForearmGroup.rotation.set(cycle * 1.5, 0, 0);
        limbs.rightForearmGroup.rotation.set(cycle * 1.5, 0, 0);

        if (isFlaring) {
          (limbs.leftElbowJoint.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
          (limbs.rightElbowJoint.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
          limbs.errorArrowGroup.visible = true;
          limbs.errorArrowGroup.position.set(0, 0.4 - chestDrop, 0);
        }

        setJointAngleDisplay({
          knee: 180,
          hip: 180,
          elbow: Math.round(175 - cycle * 85),
          spine: isFlaring ? 18 : 2,
          phase: cycle > 0.8 ? 'Bottom Hover' : cycle > 0.4 ? 'Descent (Tension)' : 'Press Up',
        });
      } else if (ex.includes('press')) {
        // OVERHEAD PRESS KINEMATICS
        limbs.barbellGroup.visible = true;
        const pressElevation = (1 - cycle) * 0.85;
        limbs.barbellGroup.position.set(0, 0.95 + pressElevation, 0.08);

        limbs.pelvisGroup.position.set(0, 0, 0);
        limbs.leftLegGroup.rotation.set(0, 0, 0.05);
        limbs.rightLegGroup.rotation.set(0, 0, -0.05);
        limbs.leftShinGroup.rotation.set(0, 0, 0);
        limbs.rightShinGroup.rotation.set(0, 0, 0);

        // Arms press up
        const armRise = (1 - cycle) * 1.4;
        limbs.leftArmGroup.rotation.set(0, 0, 0.35 + armRise);
        limbs.rightArmGroup.rotation.set(0, 0, -0.35 - armRise);
        limbs.leftForearmGroup.rotation.set(0.2, 0, 0);
        limbs.rightForearmGroup.rotation.set(0.2, 0, 0);

        // Active Error Simulation: Back Arch
        if (activeErrorSim === 'ERR_PRESS_ARCH') {
          limbs.torsoGroup.rotation.x = -cycle * 0.45;
          limbs.errorArrowGroup.visible = true;
          limbs.errorArrowGroup.position.set(0, 0.3, -0.2);
        } else {
          limbs.torsoGroup.rotation.x = 0;
        }

        setJointAngleDisplay({
          knee: 180,
          hip: 180,
          elbow: Math.round(85 + (1 - cycle) * 90),
          spine: activeErrorSim === 'ERR_PRESS_ARCH' ? 24 : 3,
          phase: cycle > 0.5 ? 'Eccentric Lower' : 'Vertical Lockout',
        });
      } else if (ex.includes('plank')) {
        // PLANK ISOMETRIC KINEMATICS
        rig.position.y = -0.7;
        limbs.torsoGroup.rotation.x = 1.52;
        limbs.leftLegGroup.rotation.set(1.5, 0, 0);
        limbs.rightLegGroup.rotation.set(1.5, 0, 0);
        limbs.leftShinGroup.rotation.set(0, 0, 0);
        limbs.rightShinGroup.rotation.set(0, 0, 0);

        limbs.leftArmGroup.rotation.set(0, 0, 0.3);
        limbs.rightArmGroup.rotation.set(0, 0, -0.3);
        limbs.leftForearmGroup.rotation.set(1.4, 0, 0);
        limbs.rightForearmGroup.rotation.set(1.4, 0, 0);

        if (activeErrorSim === 'ERR_PLANK_WING') {
          limbs.torsoGroup.position.y = -0.15;
          limbs.errorArrowGroup.visible = true;
          limbs.errorArrowGroup.position.set(0, 0.2, 0);
        } else {
          limbs.torsoGroup.position.y = 0;
        }

        setJointAngleDisplay({
          knee: 180,
          hip: 180,
          elbow: 90,
          spine: activeErrorSim === 'ERR_PLANK_WING' ? 16 : 1,
          phase: 'Isometric Continuous Hold',
        });
      } else {
        // DEFAULT STANDING DYNAMIC CADENCE (LUNGES / SURYA NAMASKAR)
        limbs.pelvisGroup.position.y = -cycle * 0.35;
        limbs.leftLegGroup.rotation.x = -cycle * 1.1;
        limbs.rightLegGroup.rotation.x = cycle * 0.9;
        limbs.leftShinGroup.rotation.x = cycle * 1.2;
        limbs.rightShinGroup.rotation.x = cycle * 0.4;

        setJointAngleDisplay({
          knee: Math.round(180 - cycle * 80),
          hip: Math.round(180 - cycle * 60),
          elbow: 160,
          spine: 4,
          phase: 'Dynamic Stride Transition',
        });
      }

      // Render mode adjustments
      const isWire = renderMode === 'skeleton';
      const isHolo = renderMode === 'hologram';
      [limbs.chestMesh, limbs.absMesh, limbs.leftQuadMesh, limbs.rightQuadMesh].forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.wireframe = isWire;
        mat.transparent = isHolo;
        mat.opacity = isHolo ? 0.45 : 1.0;
      });

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedExercise, isPlaying, playbackSpeed, activeErrorSim, renderMode]);

  // 4. Set Camera Presets
  const setCameraPreset = (angle: 'iso' | 'front' | 'side' | 'top') => {
    setCameraAngle(angle);
    if (!cameraRef.current) return;
    if (angle === 'iso') {
      rotTargetRef.current = { x: 0.25, y: 0.4 };
      cameraRef.current.position.set(0, 1.8, 6.2);
    } else if (angle === 'front') {
      rotTargetRef.current = { x: 0.05, y: 0 };
      cameraRef.current.position.set(0, 0.4, 5.8);
    } else if (angle === 'side') {
      rotTargetRef.current = { x: 0.05, y: Math.PI / 2 };
      cameraRef.current.position.set(0, 0.4, 5.8);
    } else if (angle === 'top') {
      rotTargetRef.current = { x: 1.2, y: 0 };
      cameraRef.current.position.set(0, 6.5, 1.0);
    }
  };

  // 5. Run AI Form & Biomechanics Analysis (Fetches Live Diagnostic Report)
  const handleRunFormAnalysis = async (simFault?: string) => {
    setAnalyzing(true);
    try {
      const payload: any = {
        exercise_name: selectedExercise,
        rep_count: loggedReps,
        joint_angles: {
          knee_flexion: jointAngleDisplay.knee,
          hip_hinge: jointAngleDisplay.hip,
          elbow_flare: jointAngleDisplay.elbow,
          spine_tilt: jointAngleDisplay.spine,
        },
      };

      if (simFault) {
        payload.simulated_fault = simFault;
      } else if (activeErrorSim) {
        payload.simulated_fault = activeErrorSim;
      }

      const res = await api.post('/workouts/analyze-form', payload);
      setAnalysisResult(res.data);
    } catch (err) {
      console.error('Failed to run AI form analysis:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // 6. Direct Workout Session Logger
  const handleDirectLog = async () => {
    try {
      if (onLogWorkout) {
        onLogWorkout(selectedExercise, loggedSets, loggedReps);
      } else {
        const exId = activeProfile?.exercise_id || 1;
        await api.post('/workouts/', {
          workout_type: activeProfile?.category || 'Strength',
          duration_minutes: 30,
          difficulty: 'Medium',
          notes: `Logged via 3D AI Visual Studio. Form Score: ${analysisResult?.form_score || 94}%`,
          exercises: [{ exercise_id: exId, sets: loggedSets, reps: loggedReps, weight_kg: 0 }],
        });
      }
      setLogSuccess(true);
      setTimeout(() => setLogSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to log workout session:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* STUDIO BANNER & CONTROLS HEADER */}
      <div className="glass-panel p-6 rounded-3xl border border-sky-500/20 bg-slate-950/80 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              WebGL PBR Shaders • Real-Time AI Kinematics
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              3D AI Fitness <span className="text-gradient">Visual Studio</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Interactive 3D anatomical biomechanics simulator. Select exercises, inspect real-time joint angles, detect form errors, and fetch personalized corrective cues.
            </p>
          </div>

          {/* EXERCISE QUICK SELECT CHIPS */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {profiles.map((p) => (
              <button
                key={p.exercise_name}
                onClick={() => setSelectedExercise(p.exercise_name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  selectedExercise === p.exercise_name
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg shadow-cyan-500/25 scale-105'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
                }`}
              >
                {p.exercise_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN 3D WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: 3D VIEWPORT (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl relative overflow-hidden flex flex-col">
            {/* Viewport Overlay Controls */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-400 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                60 FPS WebGL
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 font-medium">
                {jointAngleDisplay.phase}
              </div>
            </div>

            {/* Top Right: Camera Angles & Render Mode */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {/* Camera Presets */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-md">
                {(['iso', 'front', 'side', 'top'] as const).map((ang) => (
                  <button
                    key={ang}
                    onClick={() => setCameraPreset(ang)}
                    className={`px-2 py-0.5 rounded-lg text-xs uppercase font-mono font-bold transition ${
                      cameraAngle === ang ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ang}
                  </button>
                ))}
              </div>

              {/* Shading Mode */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-md">
                <button
                  onClick={() => setRenderMode('heatmap')}
                  title="Muscle Heatmap"
                  className={`p-1.5 rounded-lg text-xs transition ${
                    renderMode === 'heatmap' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRenderMode('hologram')}
                  title="Cyber Hologram"
                  className={`p-1.5 rounded-lg text-xs transition ${
                    renderMode === 'hologram' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRenderMode('skeleton')}
                  title="Wireframe Kinematics"
                  className={`p-1.5 rounded-lg text-xs transition ${
                    renderMode === 'skeleton' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* THREE.JS CANVAS CONTAINER */}
            <div
              ref={mountRef}
              className="w-full h-[460px] sm:h-[500px] cursor-grab active:cursor-grabbing relative"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-30">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-mono tracking-wider">LOADING 3D RIG &amp; SHADERS...</span>
                  </div>
                </div>
              )}

              {/* Active Error Simulation Banner in 3D Viewport */}
              {activeErrorSim && (
                <div className="absolute top-16 left-4 right-4 z-20 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 backdrop-blur-md flex items-center justify-between text-rose-300 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span className="font-bold">SIMULATING POSTURE FAULT:</span>
                    <span className="text-white font-mono">{activeErrorSim}</span>
                  </div>
                  <button
                    onClick={() => setActiveErrorSim(null)}
                    className="px-2 py-0.5 rounded bg-rose-500 text-white font-semibold hover:bg-rose-600 transition"
                  >
                    Reset to Optimal Form
                  </button>
                </div>
              )}

              {/* Bottom Angle HUD Floating on Viewport */}
              <div className="absolute bottom-4 left-4 right-4 z-20 grid grid-cols-4 gap-2 text-center pointer-events-none">
                <div className="p-2 rounded-xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-md">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Knee Flexion</div>
                  <div className="text-sm font-bold text-white font-mono">{jointAngleDisplay.knee}°</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-md">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Hip Angle</div>
                  <div className="text-sm font-bold text-white font-mono">{jointAngleDisplay.hip}°</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-md">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Elbow Flare</div>
                  <div className="text-sm font-bold text-white font-mono">{jointAngleDisplay.elbow}°</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-md">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Spine Drift</div>
                  <div className={`text-sm font-bold font-mono ${jointAngleDisplay.spine > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {jointAngleDisplay.spine}°
                  </div>
                </div>
              </div>
            </div>

            {/* Viewport Playback & Action Toolbar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 transition"
                  title={isPlaying ? 'Pause Animation' : 'Play Animation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    animTimeRef.current = 0;
                  }}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Rewind to Top Lockout"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Speed Toggle */}
                <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 rounded-xl p-1">
                  {[0.5, 1.0, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 text-xs rounded-lg font-mono transition ${
                        playbackSpeed === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary AI Scan Action */}
              <button
                onClick={() => handleRunFormAnalysis()}
                disabled={analyzing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-95 shadow-lg shadow-cyan-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Scanning Kinematics...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Run AI Form Scan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MUSCLE GROUP TARGETS & RECRUITMENT MAP */}
          {activeProfile && (
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Anatomical Muscle Recruitment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase">Primary Prime Movers</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {activeProfile.primary_muscles.join(', ')}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                  <div className="text-[11px] font-semibold text-sky-400 uppercase">Synergists &amp; Stabilizers</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {activeProfile.secondary_muscles.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: AI ERROR DIAGNOSTICS & FETCHED CUES (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* AI ANALYSIS RESULTS CARD (IF SCANNED) */}
          {analysisResult && (
            <div className="glass-panel p-5 rounded-3xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-bold">
                    AI Form Diagnostic Assessment
                  </div>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">{analysisResult.movement_quality}</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-400 font-mono">{analysisResult.form_score}%</div>
                  <div className="text-[10px] text-slate-400 font-mono">Kinematic Score</div>
                </div>
              </div>

              {/* Corrective Cues */}
              <div className="mt-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Active Coaching Cues:
                </div>
                {analysisResult.corrective_cues.map((cue, idx) => (
                  <p key={idx} className="text-xs text-slate-300 pl-4 border-l-2 border-cyan-500">
                    {cue}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* VERIFIED FORM ERRORS REGISTRY ("Check the Error and Fetch Them") */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">Biomechanical Errors Registry</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {activeProfile?.errors.length || 0} Registered Faults
              </span>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
              {activeProfile?.errors.map((err) => {
                const isSimulating = activeErrorSim === err.id;
                return (
                  <div
                    key={err.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isSimulating
                        ? 'bg-rose-500/15 border-rose-500/60 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              err.severity === 'High'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : err.severity === 'Medium'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {err.severity} Risk
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{err.joint_affected}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{err.error_name}</h4>
                      </div>

                      <button
                        onClick={() => {
                          const nextSim = isSimulating ? null : err.id;
                          setActiveErrorSim(nextSim);
                          if (nextSim) {
                            handleRunFormAnalysis(nextSim);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isSimulating
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isSimulating ? 'Active 3D' : 'Simulate in 3D'}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      <span className="text-slate-400 font-semibold">Biomechanical Hazard: </span>
                      {err.biomechanical_risk}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1">
                      <div className="text-cyan-400">
                        <span className="font-semibold text-slate-400">Corrective Cue: </span>
                        {err.corrective_cue}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        <span className="font-semibold text-slate-300">Remedial Drill: </span>
                        {err.remedial_exercise}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NUTRITION & TARGETED PROTEIN RECOVERY CARD */}
          {activeProfile && (
            <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 bg-slate-950/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Muscle Protein Recovery Sync
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  IFCT / USDA Verified
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{activeProfile.protein_recovery_tip}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {activeProfile.recommended_foods.map((food, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                    <div className="text-xs font-bold text-white truncate">{food.name}</div>
                    <div className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5">
                      {food.protein_g}g Protein
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{food.serving}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONE-CLICK WORKOUT LOG INTEGRATION */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">Sets:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={loggedSets}
                  onChange={(e) => setLoggedSets(Number(e.target.value))}
                  className="w-12 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center font-bold"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">Reps:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={loggedReps}
                  onChange={(e) => setLoggedReps(Number(e.target.value))}
                  className="w-12 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-center font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleDirectLog}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                logSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {logSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Logged!
                </>
              ) : (
                <>
                  <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                  Log to History
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
