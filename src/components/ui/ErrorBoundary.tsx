import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SentinelQ caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-slate-200 bg-background min-h-[400px]">
          <div className="max-w-md w-full bg-panel border border-accent-danger/30 rounded p-6 shadow-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-accent-danger/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-accent-danger" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Component Rendering Failure</h2>
            <p className="text-sm text-slate-400 mb-4">
              A malformed data structure or unexpected state caused this module to crash. The rest of the platform remains operational.
            </p>
            <div className="w-full bg-slate-900 border border-panel-border p-3 rounded mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-slate-500">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded border border-panel-border transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Attempt Recovery
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
