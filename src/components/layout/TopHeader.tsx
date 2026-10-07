import { Bell, User, Search, Menu, PlaySquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const routeInfo: Record<string, { title: string; desc: string }> = {
  '/dashboard': { title: 'Platform Dashboard', desc: 'Real-time overview of global fraud metrics and system health.' },
  '/intelligence': { title: 'Live Intelligence Network', desc: 'Graph-based correlation of cross-border transaction vectors.' },
  '/interceptions': { title: 'Fraud Interceptions', desc: 'Active blocking queue and risk-scored transaction queue.' },
  '/cases': { title: 'Case Briefs', desc: 'Aggregated analyst reviews and historical fraud profiles.' },
  '/ledger': { title: 'Audit Ledger', desc: 'Immutable log of system actions and banking API responses.' },
};

const getRouteInfo = (pathname: string) => {
  if (pathname.startsWith('/cases')) return routeInfo['/cases'];
  if (pathname.startsWith('/intelligence')) return routeInfo['/intelligence'];
  if (pathname.startsWith('/interceptions')) return routeInfo['/interceptions'];
  if (pathname.startsWith('/ledger')) return routeInfo['/ledger'];
  if (pathname.startsWith('/dashboard')) return routeInfo['/dashboard'];
  return { title: 'SENTINELQ', desc: 'Fraud Intelligence Platform' };
};

export const TopHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const location = useLocation();
  const isDemoMode = useStore(s => s.isDemoMode);
  const setDemoMode = useStore(s => s.setDemoMode);
  const info = getRouteInfo(location.pathname);

  return (
    <header className="h-16 border-b border-panel-border bg-panel flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-panel-border transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-100">{info.title}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">{info.desc}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-panel-border text-xs text-slate-400 w-64">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1">Search transactions, rules, cases...</span>
          <kbd className="hidden lg:inline-block text-[10px] bg-slate-800 px-1 border border-slate-700 text-slate-500 rounded font-sans">⌘K</kbd>
        </div>
        
        <div className="flex items-center gap-1.5 border-l border-panel-border pl-3 ml-1">
          <button 
            onClick={() => setDemoMode(!isDemoMode)}
            className={`flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-colors ${
              isDemoMode 
                ? 'bg-accent-neutral/20 text-accent-neutral border-accent-neutral/30' 
                : 'bg-transparent text-slate-500 border-slate-700 hover:text-slate-300'
            }`}
            title="Toggle presentation demo mode"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            {isDemoMode ? 'Demo Active' : 'Demo Mode'}
          </button>
          
          <div className="w-px h-4 bg-panel-border mx-1 hidden sm:block"></div>
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-panel-border transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent-danger rounded-full border border-panel"></span>
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-panel-border transition-colors">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:block">Operator-7</span>
          </button>
        </div>
      </div>
    </header>
  );
};
