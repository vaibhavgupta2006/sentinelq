import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Activity,
  Lock,
  Database,
  Sun,
  Moon,
  CheckCircle2,
  Zap,
  ShieldAlert,
  ChevronDown,
  X,
  GitFork,
  FileText,
  ShieldOff,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

interface CapabilityItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  metrics: string;
  route: string;
}

const PLATFORM_CAPABILITIES: CapabilityItem[] = [
  {
    id: 'stream',
    title: 'High-Throughput Risk Engine',
    category: 'Real-Time Ingestion',
    icon: Activity,
    description: 'Scans live multi-currency transaction streams with sub-50ms latency scoring and dynamic velocity thresholding.',
    metrics: '< 42ms Average Latency · 12,450 TPS',
    route: '/dashboard'
  },
  {
    id: 'graph',
    title: 'Graph Intelligence & Mule Ring Detection',
    category: 'Topology Correlation',
    icon: GitFork,
    description: 'Discovers circular money flows, smurfing syndicates, and synthetic device associations across deep graph networks.',
    metrics: 'Entity Centrality · Cycle Detection',
    route: '/intelligence'
  },
  {
    id: 'interception',
    title: 'Pre-Settlement Interception Queue',
    category: 'Active Blocking',
    icon: Lock,
    description: 'Intercepts anomalous transfers before fund clearance with instant SAR generation and automated operator escalation.',
    metrics: 'Automated SAR Filing · Instant Block',
    route: '/interceptions'
  },
  {
    id: 'ledger',
    title: 'SHA-256 Merkle Audit Ledger',
    category: 'Immutable Compliance',
    icon: Database,
    description: 'Cryptographically chains all banking API decisions and investigator actions into a verifiable tamper-proof audit trail.',
    metrics: '100% Tamper Proof · Zero-Knowledge Proof Ready',
    route: '/ledger'
  },
  {
    id: 'cases',
    title: 'Forensic Case Briefs & Evidence Dossiers',
    category: 'Analyst Intelligence',
    icon: FileText,
    description: 'Synthesizes complete multi-hop transaction histories, IP geolocations, and compliance summaries into exportable dossiers.',
    metrics: 'Automated Briefs · Printable PDF Exports',
    route: '/cases'
  },
  {
    id: 'simulation',
    title: 'Live Fraud Attack Simulator',
    category: 'Scenario Testing',
    icon: ShieldOff,
    description: 'Generates 5 realistic synthetic fraud patterns to validate SentinelQ detection and automated mitigation live.',
    metrics: 'Account Takeover · Velocity Attack · Smurfing',
    route: '/dashboard'
  }
];

export const Landing = () => {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [capabilitiesModalOpen, setCapabilitiesModalOpen] = useState(false);

  const handleEnterPlatform = (destination = '/dashboard') => {
    navigate(destination);
  };

  const handleExploreCapabilities = (e: React.MouseEvent) => {
    e.preventDefault();
    setCapabilitiesModalOpen(true);
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between font-sans selection:bg-accent-neutral/30 transition-colors">
      {/* 1. Minimal Navigation Bar */}
      <header className="w-full border-b border-panel-border bg-panel/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-neutral" />
              <span className="font-bold tracking-tight text-base sm:text-lg text-slate-100">
                SENTINELQ
              </span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-panel-border" />
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-panel-border">
              Fraud Intelligence Platform
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent hover:border-panel-border transition-all rounded"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            <button
              onClick={() => handleEnterPlatform('/dashboard')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700/80 border border-panel-border rounded transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Open Platform</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left animate-hero-fade">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-panel-border text-[11px] font-semibold text-slate-300 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="tracking-wider uppercase">Real-Time Fraud Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100 leading-[1.1] mb-5">
              Detect fraud.{' '}
              <span className="text-slate-400">Protect trust.</span>
            </h1>

            {/* Short Supporting Description */}
            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed mb-8">
              Monitor transaction risk, intercept suspicious activity, and gain real-time
              visibility into your financial network — all from one intelligent platform.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleEnterPlatform('/dashboard')}
                id="enter-platform-btn"
                className="group px-6 py-3 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-sm rounded border border-slate-200 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Enter Platform</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-slate-900" />
              </button>

              <button
                id="explore-capabilities-btn"
                onClick={handleExploreCapabilities}
                className="px-4 py-3 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-panel-border"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-neutral" />
                <span>Explore capabilities</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Compact Dashboard Preview Visual */}
          <div className="lg:col-span-5 w-full animate-hero-fade-delayed">
            <div className="bg-panel border border-panel-border rounded-xl p-5 shadow-2xl relative overflow-hidden transition-all hover:border-slate-600/80">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-panel-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                    Core Telemetry
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-900/60 px-2 py-0.5 rounded border border-panel-border">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>12,450 TPS</span>
                </div>
              </div>

              {/* 3 Compact Metric Badges */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="p-2.5 bg-slate-900/60 border border-panel-border rounded">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Scanned</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-100 font-mono mt-0.5">
                    ₹4.82 Cr
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-panel-border rounded">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Blocked</div>
                  <div className="text-xs sm:text-sm font-bold text-red-400 font-mono mt-0.5">
                    1,420
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-panel-border rounded">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Latency</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    42ms
                  </div>
                </div>
              </div>

              {/* Mini Sparkline Chart Visual */}
              <div className="p-3 bg-slate-900/80 border border-panel-border rounded mb-3.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span className="uppercase font-semibold">24h Transaction Volume Scan</span>
                  <span className="text-emerald-400 font-mono">+12.4%</span>
                </div>
                <div className="h-14 w-full">
                  <svg
                    viewBox="0 0 280 60"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="landingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 Q35,20 70,35 T140,25 T210,15 T280,30 L280,60 L0,60 Z"
                      fill="url(#landingGrad)"
                    />
                    <path
                      d="M0,45 Q35,20 70,35 T140,25 T210,15 T280,30"
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="2"
                      className="animate-chart-line"
                    />
                  </svg>
                </div>
              </div>

              {/* Live Interception Sample Feed Item */}
              <div className="p-2.5 bg-slate-900/90 border border-panel-border rounded flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-mono font-semibold text-slate-200 truncate">
                      TX-89241 · ₹1,85,000
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      High velocity pattern intercepted
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-tight shrink-0">
                  BLOCKED
                </span>
              </div>

              {/* Verified Ledger Badge */}
              <div className="mt-3 pt-2.5 border-t border-panel-border flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  SHA-256 Ledger Verified
                </span>
                <span className="font-mono text-[9px] text-slate-400">0x1a2b...9a0b</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Compact Feature Strip */}
      <section
        id="features"
        className="w-full border-t border-panel-border bg-panel/50 backdrop-blur-sm transition-colors animate-hero-fade-delayed-2"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-panel-border">
            {/* Feature 1 */}
            <div
              onClick={() => handleEnterPlatform('/dashboard')}
              className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4 first:pl-0 cursor-pointer group hover:bg-slate-800/20 p-2 rounded transition-colors"
            >
              <div className="p-2 rounded bg-slate-900 border border-panel-border text-accent-neutral shrink-0 group-hover:border-accent-neutral/50 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  Real-Time Monitoring
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-accent-neutral" />
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Continuous transaction intelligence with sub-50ms latency scanning.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              onClick={() => handleEnterPlatform('/interceptions')}
              className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4 cursor-pointer group hover:bg-slate-800/20 p-2 rounded transition-colors"
            >
              <div className="p-2 rounded bg-slate-900 border border-panel-border text-amber-400 shrink-0 group-hover:border-amber-400/50 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  Intelligent Interception
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Pre-settlement blocking rules and network topology correlation.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              onClick={() => handleEnterPlatform('/ledger')}
              className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4 cursor-pointer group hover:bg-slate-800/20 p-2 rounded transition-colors"
            >
              <div className="p-2 rounded bg-slate-900 border border-panel-border text-emerald-400 shrink-0 group-hover:border-emerald-400/50 transition-colors">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  Audit-Ready Ledger
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Cryptographically chained immutable ledger for regulatory compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Minimal Footer */}
      <footer className="w-full border-t border-panel-border py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>© 2026 SENTINELQ · Fraud Intelligence Platform</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>Production Grade</span>
            <span>·</span>
            <span>Core Banking Gateway</span>
          </div>
        </div>
      </footer>

      {/* 5. Capabilities Overview Modal */}
      {capabilitiesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-hero-fade"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCapabilitiesModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="capabilities-title"
        >
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-panel-border bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-neutral/10 border border-accent-neutral/30 rounded-lg text-accent-neutral">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="capabilities-title" className="text-base font-semibold text-slate-100">
                    Platform Capabilities & Architecture
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Explore SentinelQ's integrated modules for real-time fraud mitigation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCapabilitiesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 6 Grid Tiles */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLATFORM_CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.id}
                    onClick={() => {
                      setCapabilitiesModalOpen(false);
                      handleEnterPlatform(cap.route);
                    }}
                    className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-panel-border hover:border-slate-600 rounded-lg transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-slate-900 border border-panel-border rounded text-slate-200 group-hover:text-accent-neutral transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {cap.category}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-100 mb-1 group-hover:text-accent-neutral transition-colors flex items-center justify-between">
                        {cap.title}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {cap.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-panel-border/60 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-slate-500" />
                      <span>{cap.metrics}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-panel-border bg-slate-800/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Click any capability to launch directly in platform.
              </span>
              <button
                onClick={() => {
                  setCapabilitiesModalOpen(false);
                  handleEnterPlatform('/dashboard');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold rounded transition-all flex items-center gap-1.5"
              >
                <span>Launch Full Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
