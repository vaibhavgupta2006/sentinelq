import { useToastStore } from '../../store/useToastStore';
import { CheckCircle, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import type { ToastLevel } from '../../store/useToastStore';

const LEVEL_STYLES: Record<ToastLevel, string> = {
  info:    'border-slate-600 bg-slate-800',
  success: 'border-accent-safe/40 bg-slate-900',
  warning: 'border-accent-warning/40 bg-slate-900',
  danger:  'border-accent-danger/40 bg-slate-900',
};

const LEVEL_ICONS: Record<ToastLevel, typeof Info> = {
  info:    Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger:  AlertOctagon,
};

const LEVEL_TEXT: Record<ToastLevel, string> = {
  info:    'text-slate-300',
  success: 'text-accent-safe',
  warning: 'text-accent-warning',
  danger:  'text-accent-danger',
};

export const ToastContainer = () => {
  const toasts = useToastStore(s => s.toasts);
  const dismiss = useToastStore(s => s.dismiss);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(toast => {
        const Icon = LEVEL_ICONS[toast.level];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 px-3.5 py-2.5 border rounded text-xs font-medium shadow-xl pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200 max-w-sm ${LEVEL_STYLES[toast.level]}`}
            style={{ animation: 'slideIn 0.2s ease-out' }}
          >
            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${LEVEL_TEXT[toast.level]}`} />
            <span className="text-slate-200 leading-relaxed flex-1">{toast.message}</span>
            <button onClick={() => dismiss(toast.id)} className="text-slate-500 hover:text-slate-200 shrink-0 mt-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
