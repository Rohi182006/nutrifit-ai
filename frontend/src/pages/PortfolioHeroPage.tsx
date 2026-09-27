import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
  Database,
  Brain,
  Zap,
  Globe,
  Camera,
  Activity,
  CheckCircle2,
  FolderGit2,
} from 'lucide-react';
import { Developer3DScene } from '../components/Developer3DScene';

export const PortfolioHeroPage: React.FC = () => {
  const [cameraMode, setCameraMode] = useState<'cinematic' | 'code' | 'neural'>('cinematic');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'ROHITH_U_DEV_LAB v3.2.0 [Initialized]',
    'Type "help", "projects", "skills", or "contact" for quick commands.',
  ]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let res = '';
    switch (cmd) {
      case 'help':
        res = 'Available commands: projects, skills, stack, clear, contact';
        break;
      case 'projects':
        res = '1. NutriFit AI (Flagship Hybrid Recommendation Platform)\n2. Neural RAG Engine\n3. 3D WebGL Portfolio Lab';
        break;
      case 'skills':
        res = 'AI/ML: PyTorch, Scikit-Learn, Embeddings | Full-Stack: FastAPI, React 19, Three.js, PostgreSQL';
        break;
      case 'stack':
        res = 'Python 3.12, PyTorch, React, Three.js, Tailwind v4, Docker, Redis';
        break;
      case 'contact':
        res = 'Email: rohith@nutrifit.ai | Portfolio: http://localhost:3000/portfolio';
        break;
      case 'clear':
        setTerminalLogs([]);
        setTerminalInput('');
        return;
      default:
        res = `Command not recognized: "${cmd}". Type "help" for commands.`;
    }

    setTerminalLogs((prev) => [...prev, `> ${terminalInput}`, res]);
    setTerminalInput('');
  };

  const projects = [
    {
      title: 'NutriFit AI',
      category: 'Flagship AI Recommendation Platform',
      desc: 'Client-based intelligent fitness, nutrition and protein recommendation system using 4-step hybrid filtering, verified IFCT/USDA composition, and RAG assistant.',
      tags: ['FastAPI', 'PyTorch', 'React 19', 'PostgreSQL', 'Scikit-Learn'],
      status: 'PRODUCTION READY',
      link: '/dashboard',
    },
    {
      title: 'Neural Vision Transformer',
      category: 'Computer Vision & Deep Learning',
      desc: 'Self-attention based multi-class image classification and feature extraction pipeline with optimized TensorRT deployment.',
      tags: ['PyTorch', 'CUDA', 'TorchVision', 'Docker'],
      status: 'OPTIMAL',
    },
    {
      title: 'Real-Time Vector Semantic Search',
      category: 'NLP & Embedding Search',
      desc: 'High-dimensional cosine similarity indexing engine processing natural queries into structured intent vectors under 15ms.',
      tags: ['NLP', 'TF-IDF', 'Cosine Similarity', 'Python'],
      status: 'ONLINE',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Futuristic Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#060913]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-wider font-mono text-slate-100">ROHITH U.</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                AI & DATA SCIENCE LAB
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-slate-400">
            <a href="#lab" className="hover:text-cyan-300 transition-colors">3D LAB</a>
            <a href="#projects" className="hover:text-cyan-300 transition-colors">PROJECTS</a>
            <a href="#skills" className="hover:text-cyan-300 transition-colors">SKILLS</a>
            <a href="#terminal" className="hover:text-cyan-300 transition-colors">TERMINAL</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-2"
            >
              <span>Launch NutriFit AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION: Split Screen (Left: Bio & Pitch | Right: 3D Studio) */}
      <section id="lab" className="relative min-h-[calc(100vh-4rem)] flex items-center border-b border-slate-800/80 overflow-hidden">
        {/* Background Ambient Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* LEFT COLUMN: Identity & Bio */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>DIGITAL LABORATORY ONLINE // 60 FPS WEBGL</span>
            </div>

            {/* Main Hero Header */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                ROHITH U.
              </h1>
              <h2 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 mt-2 font-mono">
                AI & DATA SCIENCE
              </h2>
              <p className="text-sm font-mono text-slate-400 uppercase tracking-widest mt-1">
                Developer • AI/ML • Creative Technology
              </p>
            </div>

            {/* Pitch */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
              "Building intelligent digital experiences through AI, data and modern web technologies."
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-xl font-bold font-mono text-cyan-400">99.4%</div>
                <div className="text-[11px] font-mono text-slate-400">Val Accuracy</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-xl font-bold font-mono text-emerald-400">27+</div>
                <div className="text-[11px] font-mono text-slate-400">DB Tables</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                <div className="text-xl font-bold font-mono text-purple-400">12ms</div>
                <div className="text-[11px] font-mono text-slate-400">RAG Latency</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#projects"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 group"
              >
                <span>VIEW PROJECTS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#skills"
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span>EXPLORE WORK</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </a>
            </div>

            {/* 3D Camera Preset Switcher */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D CAMERA CONTROLS:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCameraMode('cinematic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    cameraMode === 'cinematic'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  🎬 3/4 Cinematic
                </button>
                <button
                  onClick={() => setCameraMode('code')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    cameraMode === 'code'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  💻 Code Monitor
                </button>
                <button
                  onClick={() => setCameraMode('neural')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    cameraMode === 'neural'
                      ? 'bg-purple-500 text-slate-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  🧠 Neural Network
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D Interactive Development Studio */}
          <div className="lg:col-span-7 h-[580px] sm:h-[640px] relative rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur-md overflow-hidden shadow-2xl shadow-cyan-500/5">
            <Developer3DScene cameraMode={cameraMode} />

            {/* 3D Scene Interactive Overlay Instructions */}
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-cyan-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Move mouse to tilt camera & trigger 3D parallax</span>
              </div>
              <span className="hidden sm:inline">PBR Shaders • Realtime Canvas Texture</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS SHOWCASE */}
      <section id="projects" className="py-20 max-w-7xl mx-auto px-6 border-b border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-2">
              ENGINEERED SYSTEMS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Featured Intelligence Projects
            </h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md mt-4 md:mt-0 font-light">
            Production-grade systems demonstrating AI architecture, recommendation engines, and full-stack engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((proj, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    {proj.status}
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                  {proj.title}
                </h3>
                <div className="text-xs font-mono text-purple-400 mb-3">{proj.category}</div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light">
                  {proj.desc}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {proj.tags.map((t, ti) => (
                    <span
                      key={ti}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {proj.link ? (
                  <Link
                    to={proj.link}
                    className="w-full py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 border border-cyan-500/30"
                  >
                    <span>LAUNCH APPLICATION</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="text-center py-2 text-xs font-mono text-slate-600 border border-slate-800/50 rounded-lg">
                    DEMO RESTRICTED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TECHNICAL SKILLS MATRIX */}
      <section id="skills" className="py-20 max-w-7xl mx-auto px-6 border-b border-slate-800/80">
        <div className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-2">
          CORE CAPABILITIES
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-12">
          Technical Architecture & Stack
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Brain className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">AI & Machine Learning</h3>
            <ul className="text-xs font-mono text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> PyTorch & Neural Nets</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Cosine Similarity Vector Search</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Hybrid Recommendation Models</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> RAG Architectural Guardrails</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Cpu className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Full-Stack Engineering</h3>
            <ul className="text-xs font-mono text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> FastAPI & REST API v1</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> React 19 + TypeScript + Vite</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Tailwind CSS v4 Modern UI</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Zustand State Architecture</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Database className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Data & Systems</h3>
            <ul className="text-xs font-mono text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL & Alembic Migrations</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 27 Relational Schema Tables</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> IFCT & USDA Verified Datasets</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Docker Compose Architecture</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Globe className="w-8 h-8 text-sky-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Creative 3D & Graphics</h3>
            <ul className="text-xs font-mono text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Three.js WebGL 60 FPS</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Dynamic Canvas Textures</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> GPU Particle Systems</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Parallax & Interactive Damping</li>
            </ul>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DIGITAL LAB TERMINAL */}
      <section id="terminal" className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-2">
            DIRECT INTERACTION
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Developer Terminal Gateway
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden font-mono text-sm">
          {/* Terminal Window Bar */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-slate-400">rohith-lab-gateway:~ (bash)</span>
            </div>
            <span className="text-[11px] text-slate-500">interactive shell</span>
          </div>

          {/* Terminal Log Output */}
          <div className="p-6 space-y-3 min-h-[220px] max-h-[340px] overflow-y-auto">
            {terminalLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.startsWith('>')
                    ? 'text-cyan-400 font-bold'
                    : log.includes('Available') || log.includes('1.')
                    ? 'text-slate-300'
                    : 'text-slate-400'
                }
              >
                <pre className="whitespace-pre-wrap font-mono text-xs">{log}</pre>
              </div>
            ))}
          </div>

          {/* Terminal Input Bar */}
          <form onSubmit={handleCommand} className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center gap-3">
            <span className="text-emerald-400 font-bold">rohith@lab:~$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="type 'help', 'projects', 'skills'..."
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all"
            >
              RUN
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-10 bg-[#05070e] text-center text-xs font-mono text-slate-500">
        <p>© 2026 ROHITH U. — AI & DATA SCIENCE LABORATORY. ALL RIGHTS RESERVED.</p>
        <p className="mt-2 text-slate-600">Built with Three.js • React 19 • FastAPI • PBR Shaders</p>
      </footer>
    </div>
  );
};
