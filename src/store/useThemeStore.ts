import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('sentinelq-theme') as Theme | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'dark';
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }
};

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme();
  applyThemeToDOM(initial);

  return {
    theme: initial,
    toggleTheme: () =>
      set((state) => {
        const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('sentinelq-theme', next);
        applyThemeToDOM(next);
        return { theme: next };
      }),
    setTheme: (theme: Theme) => {
      localStorage.setItem('sentinelq-theme', theme);
      applyThemeToDOM(theme);
      set({ theme });
    },
  };
});
