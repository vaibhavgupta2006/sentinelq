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
  ChevronDown
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export const Landing = () => {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const handleEnterPlatform = () => {
    navigate('/dashboard');
  };

  const handleScrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between font-sans selection:bg-accent-neutral/30 transition-colors">
      {/* 1. Minimal Navigation Bar */}
      <header className="w-full border-b border-panel-border bg-panel/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
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
              onClick={handleEnterPlatform}
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
                onClick={handleEnterPlatform}
                id="enter-platform-btn"
                className="group px-6 py-3 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-sm rounded border border-slate-200 transition-all shadow-md flex items-center gap-2"
              >
                <span>Enter Platform</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-slate-900" />
              </button>

              <a
                href="#features"
                onClick={handleScrollToFeatures}
                className="px-4 py-3 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>Explore capabilities</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </a>
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
            <div className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4 first:pl-0">
              <div className="p-2 rounded bg-slate-900 border border-panel-border text-accent-neutral shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Real-Time Monitoring
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Continuous transaction intelligence with sub-50ms latency scanning.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4">
              <div className="p-2 rounded bg-slate-900 border border-panel-border text-amber-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Intelligent Interception
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Pre-settlement blocking rules and network topology correlation.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4">
              <div className="p-2 rounded bg-slate-900 border border-panel-border text-emerald-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Audit-Ready Ledger
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
    </div>
  );
};
