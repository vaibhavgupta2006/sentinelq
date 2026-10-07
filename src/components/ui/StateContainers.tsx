import { Activity, ShieldAlert, FileSearch, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-full w-full p-8 text-slate-500">
    <Activity className="w-8 h-8 animate-spin mb-4 text-slate-600" />
    <p className="text-sm font-medium tracking-wide">{message}</p>
  </div>
);

export const EmptyState = ({ title, message, icon: Icon = FileSearch }: { title: string; message: string; icon?: any }) => (
  <div className="flex flex-col items-center justify-center h-full w-full p-12 text-center text-slate-500">
    <Icon className="w-12 h-12 mb-4 text-slate-700" />
    <h3 className="text-base font-bold text-slate-300 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm">{message}</p>
  </div>
);

export const NotFoundState = () => (
  <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center text-slate-200">
    <ShieldAlert className="w-16 h-16 mb-6 text-accent-neutral opacity-50" />
    <h2 className="text-2xl font-bold text-slate-100 mb-2">404 - Resource Not Found</h2>
    <p className="text-slate-400 mb-8 max-w-md">
      The requested resource could not be found or you do not have sufficient permissions to view it.
    </p>
    <Link
      to="/dashboard"
      className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded border border-panel-border transition-colors"
    >
      <Shield className="w-4 h-4" /> Return to Dashboard
    </Link>
  </div>
);
