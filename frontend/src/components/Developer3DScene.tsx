import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  cameraMode?: 'cinematic' | 'code' | 'neural' | 'free';
  interactive?: boolean;
}

export const Developer3DScene: React.FC<Props> = ({
  cameraMode = 'cinematic',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(60);
  const [activeElement, setActiveElement] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 1.2, 5.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Dynamic 2D Canvas for Code Editor Screen
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1200;
    screenCanvas.height = 750;
    const ctx = screenCanvas.getContext('2d')!;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.anisotropy = 8;

    // 4. Lighting System
    // Ambient Dark Glow
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.4);
    scene.add(ambientLight);

    // Key Light (Electric Blue)
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Cyan Rim Light behind monitor
    const rimLight = new THREE.PointLight(0x06b6d4, 4, 12);
    rimLight.position.set(-0.5, 0.8, -1.8);
    scene.add(rimLight);

    // Purple Accent Light (Neural Net side)
    const purpleLight = new THREE.PointLight(0xa855f7, 3.5, 10);
    purpleLight.position.set(3.2, -0.5, 1.5);
    scene.add(purpleLight);

    // Subtle Emerald Light (Database side)
    const emeraldLight = new THREE.PointLight(0x10b981, 3, 8);
    emeraldLight.position.set(-3.2, -1, 1);
    scene.add(emeraldLight);

    // 5. Main 3D Object: Large Floating 3D Monitor
    const monitorGroup = new THREE.Group();
    scene.add(monitorGroup);

    // Monitor Frame
    const frameGeo = new THREE.BoxGeometry(3.6, 2.3, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    monitorGroup.add(frameMesh);

    // Bezel Inner Border
    const bezelGeo = new THREE.BoxGeometry(3.64, 2.34, 0.04);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.06,
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.z = -0.04;
    monitorGroup.add(bezelMesh);

    // Screen Display Plane
    const screenGeo = new THREE.PlaneGeometry(3.46, 2.16);
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.062;
    monitorGroup.add(screenMesh);

    // Screen Glass Reflection Overlay
    const glassGeo = new THREE.PlaneGeometry(3.46, 2.16);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.15,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      reflectivity: 0.8,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.064;
    monitorGroup.add(glassMesh);

    // Monitor Power LED
    const ledGeo = new THREE.SphereGeometry(0.015, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, -1.1, 0.065);
    monitorGroup.add(ledMesh);

    // Floating Monitor Neck & Stand Base
    const standNeckGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.8, 16);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const standNeck = new THREE.Mesh(standNeckGeo, standMat);
    standNeck.position.set(0, -1.5, -0.3);
    standNeck.rotation.x = -0.25;
    monitorGroup.add(standNeck);

    const standBaseGeo = new THREE.CylinderGeometry(0.6, 0.65, 0.04, 32);
    const standBase = new THREE.Mesh(standBaseGeo, standMat);
    standBase.position.set(0, -1.85, -0.15);
    monitorGroup.add(standBase);

    // 6. 3D Floating Keyboard partially visible below
    const keyboardGroup = new THREE.Group();
    keyboardGroup.position.set(0, -1.75, 1.2);
    keyboardGroup.rotation.x = -0.35;
    scene.add(keyboardGroup);

    const kbBaseGeo = new THREE.BoxGeometry(2.4, 0.06, 0.9);
    const kbBaseMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.8, roughness: 0.4 });
    const kbBase = new THREE.Mesh(kbBaseGeo, kbBaseMat);
    keyboardGroup.add(kbBase);

    // Glowing keyboard backlight underglow
    const kbGlowGeo = new THREE.PlaneGeometry(2.45, 0.95);
    const kbGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12 });
    const kbGlow = new THREE.Mesh(kbGlowGeo, kbGlowMat);
    kbGlow.rotation.x = -Math.PI / 2;
    kbGlow.position.y = -0.04;
    keyboardGroup.add(kbGlow);

    // Small key rows simulation
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 14; c++) {
        const keyGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
        const keyMat = new THREE.MeshStandardMaterial({
          color: (r === 2 && c === 7) ? 0x06b6d4 : 0x1e293b,
          metalness: 0.5,
          roughness: 0.5,
        });
        const key = new THREE.Mesh(keyGeo, keyMat);
        key.position.set(-1.0 + c * 0.155, 0.04, -0.3 + r * 0.155);
        keyboardGroup.add(key);
      }
    }

    // 7. Surrounding 3D Floating Code Brackets: < / > { }
    const bracketsGroup = new THREE.Group();
    scene.add(bracketsGroup);

    const createTextBracket = (char: string, pos: [number, number, number], colorHex: number) => {
      // Create bracket via custom geometry representation
      const grp = new THREE.Group();
      grp.position.set(...pos);

      // Bracket Visual Card Frame
      const boxGeo = new THREE.BoxGeometry(0.38, 0.46, 0.06);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.9,
        roughness: 0.2,
      });
      const bMesh = new THREE.Mesh(boxGeo, boxMat);
      grp.add(bMesh);

      // Glowing Wireframe Border
      const edges = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
      const wire = new THREE.LineSegments(edges, lineMat);
      grp.add(wire);

      // Small 2D canvas for the bracket symbol
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const cctx = c.getContext('2d')!;
      cctx.fillStyle = '#060913';
      cctx.fillRect(0, 0, 128, 128);
      cctx.font = 'bold 74px monospace';
      cctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
      cctx.textAlign = 'center';
      cctx.textBaseline = 'middle';
      cctx.fillText(char, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      const faceGeo = new THREE.PlaneGeometry(0.34, 0.42);
      const faceMat = new THREE.MeshBasicMaterial({ map: tex });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.z = 0.032;
      grp.add(faceMesh);

      return grp;
    };

    const bracketLeft = createTextBracket('<', [-2.6, 1.4, 0.4], 0x38bdf8);
    const bracketSlash = createTextBracket('/', [-2.2, 0.6, 0.8], 0x06b6d4);
    const bracketRight = createTextBracket('>', [-2.7, -0.4, 0.2], 0x38bdf8);
    const bracketBraceL = createTextBracket('{', [2.5, 1.5, 0.5], 0xa855f7);
    const bracketBraceR = createTextBracket('}', [2.8, -0.3, 0.3], 0xc084fc);

    bracketsGroup.add(bracketLeft, bracketSlash, bracketRight, bracketBraceL, bracketBraceR);

    // 8. 3D Database Cylinder with glowing segment rings
    const dbGroup = new THREE.Group();
    dbGroup.position.set(-2.8, -0.8, -0.2);
    scene.add(dbGroup);

    for (let i = 0; i < 3; i++) {
      const cylGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 24);
      const cylMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.25,
      });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.y = i * 0.24;
      dbGroup.add(cyl);

      // Glowing Data Ring between disks
      const ringGeo = new THREE.TorusGeometry(0.33, 0.015, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 0.24;
      dbGroup.add(ring);
    }

    // 9. AI Neural-Network Sphere with connected nodes
    const neuralGroup = new THREE.Group();
    neuralGroup.position.set(2.8, 0.8, -0.4);
    scene.add(neuralGroup);

    const nodeCount = 18;
    const nodeCoords: THREE.Vector3[] = [];
    const nodeSpheres: THREE.Mesh[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.55 + Math.random() * 0.25;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      nodeCoords.push(new THREE.Vector3(x, y, z));

      const nGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const nMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.8,
      });
      const nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.set(x, y, z);
      neuralGroup.add(nMesh);
      nodeSpheres.push(nMesh);
    }

    // Connect node pairs with glowing lines
    const lineIndices: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodeCoords[i].distanceTo(nodeCoords[j]) < 0.65) {
          lineIndices.push(i, j);
        }
      }
    }
    const linePositions = new Float32Array(lineIndices.length * 3);
    for (let k = 0; k < lineIndices.length; k++) {
      const idx = lineIndices[k];
      linePositions[k * 3] = nodeCoords[idx].x;
      linePositions[k * 3 + 1] = nodeCoords[idx].y;
      linePositions[k * 3 + 2] = nodeCoords[idx].z;
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const neuralLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    const neuralLines = new THREE.LineSegments(lineGeo, neuralLineMat);
    neuralGroup.add(neuralLines);

    // 10. Floating Data Cubes
    const cubesGroup = new THREE.Group();
    scene.add(cubesGroup);

    const dataCubes: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const cGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.9,
        roughness: 0.15,
        wireframe: false,
      });
      const cube = new THREE.Mesh(cGeo, cMat);

      // Glowing wireframe on cubes
      const cWireGeo = new THREE.EdgesGeometry(cGeo);
      const cWireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
      const cWire = new THREE.LineSegments(cWireGeo, cWireMat);
      cube.add(cWire);

      cube.position.set(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2
      );
      cubesGroup.add(cube);
      dataCubes.push(cube);
    }

    // 11. Floating Git Branch Structure
    const gitGroup = new THREE.Group();
    gitGroup.position.set(2.4, -1.1, 0.4);
    scene.add(gitGroup);

    const gitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.6, -0.3, 0),
      new THREE.Vector3(-0.2, 0, 0.1),
      new THREE.Vector3(0.2, 0.3, 0),
      new THREE.Vector3(0.6, 0.5, -0.1),
    ]);
    const gitTubeGeo = new THREE.TubeGeometry(gitCurve, 20, 0.02, 8, false);
    const gitTubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const gitTube = new THREE.Mesh(gitTubeGeo, gitTubeMat);
    gitGroup.add(gitTube);

    // Git commit nodes
    [-0.6, -0.2, 0.2, 0.6].forEach((xVal, idx) => {
      const cmGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const cmMat = new THREE.MeshStandardMaterial({
        color: idx % 2 === 0 ? 0x10b981 : 0xa855f7,
        emissive: idx % 2 === 0 ? 0x10b981 : 0xa855f7,
        emissiveIntensity: 0.9,
      });
      const cmMesh = new THREE.Mesh(cmGeo, cmMat);
      const pt = gitCurve.getPoint((idx + 0.2) / 4);
      cmMesh.position.copy(pt);
      gitGroup.add(cmMesh);
    });

    // 12. Floating Holographic HUD Dashboard (Projects, Skills, AI, Data)
    const hudGroup = new THREE.Group();
    hudGroup.position.set(-2.6, 0.2, 0.4);
    hudGroup.rotation.y = 0.35;
    scene.add(hudGroup);

    const hudCanvas = document.createElement('canvas');
    hudCanvas.width = 380;
    hudCanvas.height = 240;
    const hctx = hudCanvas.getContext('2d')!;
    const hudTexture = new THREE.CanvasTexture(hudCanvas);

    const renderHUD = () => {
      hctx.fillStyle = 'rgba(6, 10, 22, 0.85)';
      hctx.fillRect(0, 0, 380, 240);
      hctx.strokeStyle = '#0284c7';
      hctx.lineWidth = 3;
      hctx.strokeRect(4, 4, 372, 232);

      // Header
      hctx.fillStyle = '#38bdf8';
      hctx.font = 'bold 15px monospace';
      hctx.fillText('◈ ROHITH U. // AI LAB HUD', 16, 28);

      hctx.fillStyle = '#94a3b8';
      hctx.font = '12px monospace';
      hctx.fillText('STATUS: NEURAL CORE OPTIMAL', 16, 50);

      // Metric bars
      const metrics = [
        { label: 'AI/ML PyTorch', pct: 0.94, col: '#38bdf8' },
        { label: 'Full-Stack Dev', pct: 0.96, col: '#10b981' },
        { label: 'Data Science', pct: 0.91, col: '#a855f7' },
        { label: 'Creative 3D', pct: 0.88, col: '#06b6d4' },
      ];

      metrics.forEach((m, i) => {
        const y = 80 + i * 36;
        hctx.fillStyle = '#cbd5e1';
        hctx.font = '11px monospace';
        hctx.fillText(m.label, 16, y);

        // Bar background
        hctx.fillStyle = '#1e293b';
        hctx.fillRect(140, y - 10, 180, 10);

        // Bar fill
        hctx.fillStyle = m.col;
        hctx.fillRect(140, y - 10, 180 * m.pct, 10);

        hctx.fillStyle = '#94a3b8';
        hctx.fillText(`${Math.round(m.pct * 100)}%`, 330, y);
      });

      hudTexture.needsUpdate = true;
    };
    renderHUD();

    const hudPlaneGeo = new THREE.PlaneGeometry(1.2, 0.75);
    const hudPlaneMat = new THREE.MeshBasicMaterial({
      map: hudTexture,
      transparent: true,
      opacity: 0.9,
    });
    const hudMesh = new THREE.Mesh(hudPlaneGeo, hudPlaneMat);
    hudGroup.add(hudMesh);

    // 13. Glowing Environmental Particles (500 points)
    const particleCount = 450;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const isCyan = Math.random() > 0.4;
      particleColors[i * 3] = isCyan ? 0.02 : 0.65;
      particleColors[i * 3 + 1] = isCyan ? 0.75 : 0.33;
      particleColors[i * 3 + 2] = isCyan ? 0.98 : 0.97;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 14. Mouse Parallax & Smooth Damping Variables
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // 15. Dynamic Code Editor Drawing Loop
    let codeScrollY = 0;
    let cursorBlinkTime = 0;

    const codeSnippet = [
      { text: '# NutriFit AI — Hybrid Recommendation Engine', color: '#64748b' },
      { text: 'import torch', color: '#c084fc' },
      { text: 'import torch.nn as nn', color: '#c084fc' },
      { text: 'from sklearn.metrics.pairwise import cosine_similarity', color: '#c084fc' },
      { text: '', color: '#ffffff' },
      { text: 'class NutritionRecommendationModel(nn.Module):', color: '#38bdf8' },
      { text: '    def __init__(self, vocab_size=256, embed_dim=64):', color: '#e2e8f0' },
      { text: '        super().__init__()', color: '#f59e0b' },
      { text: '        self.diet_embedding = nn.Embedding(vocab_size, embed_dim)', color: '#34d399' },
      { text: '        self.fc_preference = nn.Linear(embed_dim, 32)', color: '#34d399' },
      { text: '        self.relu = nn.ReLU()', color: '#38bdf8' },
      { text: '        self.classifier = nn.Sequential(', color: '#e2e8f0' },
      { text: '            nn.Linear(32, 16),', color: '#f59e0b' },
      { text: '            nn.Sigmoid()  # Match Score %', color: '#64748b' },
      { text: '        )', color: '#e2e8f0' },
      { text: '', color: '#ffffff' },
      { text: '    def forward(self, client_features, food_vectors):', color: '#38bdf8' },
      { text: '        # Hard filter: exclude allergen violations', color: '#10b981' },
      { text: '        filtered = self.apply_hard_filter(client_features)', color: '#e2e8f0' },
      { text: '        match_scores = cosine_similarity(filtered, food_vectors)', color: '#f59e0b' },
      { text: '        return torch.tensor(match_scores * 100.0)', color: '#34d399' },
      { text: '', color: '#ffffff' },
      { text: 'def evaluate_macro_targets(profile):', color: '#38bdf8' },
      { text: '    return {"protein_target_g": 120, "recommendations": 8}', color: '#f59e0b' },
    ];

    const renderScreenTexture = (time: number) => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1200, 750);

      // Top Window Title Bar
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, 1200, 36);

      // Window Control Dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(20, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(38, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(56, 18, 6, 0, Math.PI * 2);
      ctx.fill();

      // Project Tab Name
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(90, 4, 220, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⚡ recommendation_net.py', 104, 24);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText('ROHITH U. // AI & DATA SCIENCE LAB', 500, 24);

      // Left Sidebar (File Explorer)
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 36, 170, 714);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('EXPLORER', 14, 60);

      const files = [
        '▾ src/ai',
        '  neural_rag.py',
        '  recommendation.py',
        '  vector_index.bin',
        '▾ src/models',
        '  transformer.pt',
        '  ifct_dataset.db',
        '  portfolio_hero.tsx',
      ];
      files.forEach((f, i) => {
        ctx.fillStyle = f.includes('▾') ? '#94a3b8' : f.includes('recommendation') ? '#38bdf8' : '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText(f, 14, 88 + i * 22);
      });

      // Main Code Editor Area
      ctx.save();
      ctx.beginPath();
      ctx.rect(170, 36, 680, 520);
      ctx.clip();

      const scrollOffset = (time * 12) % 400;
      codeSnippet.forEach((line, idx) => {
        const y = 60 + idx * 24 - scrollOffset + 100;
        if (y > 20 && y < 580) {
          // Line numbers
          ctx.fillStyle = '#334155';
          ctx.font = '11px monospace';
          ctx.fillText((idx + 1).toString().padStart(2, ' '), 184, y);

          // Code text
          ctx.fillStyle = line.color;
          ctx.font = '13px "JetBrains Mono", Consolas, monospace';
          ctx.fillText(line.text, 220, y);
        }
      });
      ctx.restore();

      // Right Panel: AI Live Loss Curve & Model Visualizer
      ctx.fillStyle = '#070b14';
      ctx.fillRect(850, 36, 350, 520);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('◈ NEURAL METRICS (REAL-TIME)', 870, 64);

      // Graph Box
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(870, 80, 300, 160);

      // Draw animated loss curve
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < 300; x += 10) {
        const val = Math.exp(-x / 80) * 100 + Math.sin((x + time * 60) * 0.05) * 8;
        const y = 220 - Math.min(Math.max(val, 10), 140);
        if (x === 0) ctx.moveTo(870 + x, y);
        else ctx.lineTo(870 + x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '11px monospace';
      ctx.fillText('Loss: 0.0018 | Val Acc: 99.4%', 870, 260);
      ctx.fillText('Embeddings: 1,024 Dim (Cosine 0.96)', 870, 280);

      // Model Node Pipeline Diagram
      ctx.fillStyle = '#a855f7';
      ctx.fillText('Pipeline: ClientProfile → HardFilter → ML Ranking', 870, 314);

      // Bottom Integrated Terminal Panel
      ctx.fillStyle = '#05070e';
      ctx.fillRect(170, 556, 1030, 194);

      ctx.fillStyle = '#334155';
      ctx.fillRect(170, 556, 1030, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('TERMINAL  |  bash  |  nutrifit-ai-env', 184, 574);

      ctx.fillStyle = '#34d399';
      ctx.font = '12px monospace';
      ctx.fillText('rohith@lab:~/nutrifit-ai$ python -m uvicorn app.main:app --port 8000', 184, 608);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('[INFO] Uvicorn running on http://127.0.0.1:8000 (API v1 Live)', 184, 630);
      ctx.fillText('[INFO] Database verified: IFCT & USDA verified food vectors loaded', 184, 650);

      cursorBlinkTime += 0.05;
      const cursorChar = Math.sin(cursorBlinkTime * 4) > 0 ? '█' : ' ';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`[AI] Inference model ready. Awaiting query... ${cursorChar}`, 184, 672);

      screenTexture.needsUpdate = true;
    };

    // 16. Animation Loop (60 FPS Target)
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const animate = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const elapsedTime = timestamp * 0.001;

      // Calculate FPS
      frameCount++;
      fpsTimer += delta;
      if (fpsTimer >= 1.0) {
        setFps(Math.round(frameCount / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Render Dynamic Code Screen
      renderScreenTexture(elapsedTime);

      // 1. Gentle Floating Monitor Motion
      monitorGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.06 + mouse.x * 0.15;
      monitorGroup.rotation.x = Math.cos(elapsedTime * 0.6) * 0.04 - mouse.y * 0.1;
      monitorGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.06;

      // 2. Animate Floating Code Brackets Orbit
      bracketLeft.position.y = 1.4 + Math.sin(elapsedTime * 1.2) * 0.08;
      bracketLeft.rotation.y = Math.sin(elapsedTime * 0.7) * 0.2;

      bracketSlash.position.y = 0.6 + Math.cos(elapsedTime * 1.4) * 0.08;
      bracketSlash.rotation.z = Math.sin(elapsedTime) * 0.15;

      bracketRight.position.y = -0.4 + Math.sin(elapsedTime * 1.1) * 0.08;
      bracketRight.rotation.y = -Math.sin(elapsedTime * 0.8) * 0.2;

      bracketBraceL.position.y = 1.5 + Math.cos(elapsedTime * 1.3) * 0.09;
      bracketBraceL.rotation.y = Math.cos(elapsedTime * 0.9) * 0.2;

      bracketBraceR.position.y = -0.3 + Math.sin(elapsedTime * 1.5) * 0.09;
      bracketBraceR.rotation.y = -Math.cos(elapsedTime * 0.7) * 0.2;

      // 3. Database Cylinder subtle rotation & pulsing
      dbGroup.rotation.y = elapsedTime * 0.4;
      dbGroup.position.y = -0.8 + Math.sin(elapsedTime * 1.2) * 0.05;

      // 4. Neural Network Sphere rotation & node pulsing
      neuralGroup.rotation.y = elapsedTime * 0.35;
      neuralGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2;
      neuralGroup.position.y = 0.8 + Math.cos(elapsedTime * 1.1) * 0.06;

      nodeSpheres.forEach((s, idx) => {
        const pulse = 0.8 + Math.sin(elapsedTime * 3 + idx) * 0.25;
        s.scale.set(pulse, pulse, pulse);
      });

      // 5. Data Cubes Orbiting & Tumbling
      dataCubes.forEach((cube, i) => {
        cube.rotation.x += 0.015 * (i % 2 === 0 ? 1 : -1);
        cube.rotation.y += 0.02;
        cube.position.y += Math.sin(elapsedTime * 2 + i) * 0.003;
      });

      // 6. Holographic HUD subtle levitation
      hudGroup.position.y = 0.2 + Math.sin(elapsedTime * 0.9) * 0.04;
      hudGroup.rotation.y = 0.35 + mouse.x * 0.05;

      // 7. Particle Drift
      const posAttr = particleGeo.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i);
        py += 0.003;
        if (py > 4) py = -4;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;

      // 8. Camera Perspective Handling based on Mode
      let targetCamX = 2.8;
      let targetCamY = 1.2;
      let targetCamZ = 5.2;

      if (cameraMode === 'code') {
        targetCamX = 0.2;
        targetCamY = 0.1;
        targetCamZ = 3.2;
      } else if (cameraMode === 'neural') {
        targetCamX = 2.4;
        targetCamY = 0.8;
        targetCamZ = 2.8;
      }

      camera.position.x += (targetCamX + mouse.x * 0.6 - camera.position.x) * 0.05;
      camera.position.y += (targetCamY + mouse.y * 0.4 - camera.position.y) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraMode, interactive]);

  return (
    <div className="relative w-full h-full min-h-[580px] overflow-hidden select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D HUD Badges */}
      <div className="absolute top-4 right-4 flex items-center gap-3 pointer-events-none">
        <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300 font-semibold">WEBGL 3D • {fps} FPS</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-purple-500/30 backdrop-blur-md hidden sm:flex items-center gap-1.5">
          <span className="text-xs font-mono text-purple-300">PBR SHADER // ACTIVE</span>
        </div>
      </div>

      {/* Ambient Cyber Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-slate-950/80" />
    </div>
  );
};
