import { Palette, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

export function useTheme(): ThemeColors {
  return useIsDark() ? Palette.dark : Palette.light;
}
