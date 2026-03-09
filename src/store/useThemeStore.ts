import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark', // default to dark
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        return { theme: newTheme };
      }),
      setTheme: (theme) => set(() => {
        document.documentElement.setAttribute('data-theme', theme);
        return { theme };
      }),
    }),
    {
      name: 'ausbildung-theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme right after state is rehydrated to avoid flashing
        if (state?.theme) {
            document.documentElement.setAttribute('data-theme', state.theme);
        }
      }
    }
  )
);

// Initialize theme immediately if we are in browser
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('ausbildung-theme-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme) {
        document.documentElement.setAttribute('data-theme', parsed.state.theme);
      }
    } catch (e) {
      console.error("Failed to parse theme from storage", e);
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
