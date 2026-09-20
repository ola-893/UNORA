import { createContext, useContext, type ReactNode } from 'react';
import { theme, type ThemeColors } from '@/themes';

const ThemeContext = createContext<ThemeColors>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
