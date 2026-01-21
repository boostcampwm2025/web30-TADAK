import { useThemeStore } from '@/stores/themeStore';

export function useTheme() {
  const { theme, toggleTheme } = useThemeStore();
  return { theme, toggleTheme };
}
