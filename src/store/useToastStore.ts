// Toast notification store — fully separated from main app state for perf
import { create } from 'zustand';

export type ToastLevel = 'info' | 'success' | 'warning' | 'danger';

export interface Toast {
  id: string;
  message: string;
  level: ToastLevel;
  timestamp: number;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, level?: ToastLevel) => void;
  dismiss: (id: string) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, level = 'info') => {
    const id = `toast_${++seq}_${Date.now()}`;
    set(state => ({ toasts: [...state.toasts, { id, message, level, timestamp: Date.now() }].slice(-5) }));
    // Auto-dismiss after 4s
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));
