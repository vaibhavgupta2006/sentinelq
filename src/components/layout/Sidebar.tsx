import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, GitFork, Lock, FileText, Database, Server, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Activity },
  { path: '/intelligence', label: 'Live Intelligence Network', icon: GitFork },
  { path: '/interceptions', label: 'Fraud Interceptions', icon: Lock },
  { path: '/cases', label: 'Case Briefs', icon: FileText },
  { path: '/ledger', label: 'Audit Ledger', icon: Database },
];

export const Sidebar = ({ className }: { className?: string }) => {
  const location = useLocation();

  return (
    <aside className={cn("flex flex-col bg-panel border-r border-panel-border text-slate-300 w-64 shrink-0 h-full", className)}>
      <div className="p-4 border-b border-panel-border">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-slate-100" />
          <span className="font-bold text-slate-100 tracking-tight">SENTINELQ</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          Fraud Intelligence Platform
        </div>
      </div>

      <div className="p-4 border-b border-panel-border space-y-3">
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-1 uppercase">Environment</div>
          <div className="text-sm text-slate-200">Production</div>
          <div className="text-xs text-slate-500">Core Banking Gateway</div>
        </div>
        
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-safe animate-pulse"></div>
            <span className="text-xs font-medium text-slate-300">WebSockets: Connected</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 ml-3.5">
            <Zap className="w-3 h-3" />
            <span>Stream: 12,450 TPS</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors border border-transparent",
                isActive 
                  ? "bg-slate-800 border-panel-border text-slate-100" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-panel-border bg-slate-900/50">
        <div className="text-xs font-semibold text-slate-400 mb-2 uppercase flex items-center gap-1.5">
          <Server className="w-3 h-3" /> System Status
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Pipeline</span>
            <span className="text-accent-safe font-medium">Operational</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Latency</span>
            <span className="text-slate-300">42ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Ledger</span>
            <span className="text-accent-safe flex items-center gap-1"><Database className="w-3 h-3"/> Verified</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
