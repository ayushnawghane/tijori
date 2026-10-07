/**
 * Tijori's visual language: a deep "vault" emerald with a warm gold accent,
 * soft tinted surfaces and Inter for type. Every screen reads colours from here.
 */

export const Palette = {
  light: {
    bg: '#F4F7F5',
    surface: '#FFFFFF',
    surfaceAlt: '#EBF0ED',
    surfaceHigh: '#E1E8E4',
    border: '#DCE4E0',
    text: '#0F1513',
    textMuted: '#5B6561',
    textFaint: '#8A9490',
    primary: '#0B6E5F',
    primarySoft: '#D5EFE8',
    onPrimary: '#FFFFFF',
    gold: '#A9740A',
    goldSoft: '#FBEFD2',
    income: '#15803D',
    danger: '#C0362C',
    heroStart: '#0E7C6A',
    heroEnd: '#063C34',
    onHero: '#FFFFFF',
    heroGold: '#F6CF6E',
    heroMint: '#9BF0D8',
  },
  dark: {
    bg: '#080C0B',
    surface: '#111715',
    surfaceAlt: '#171F1C',
    surfaceHigh: '#202925',
    border: '#212A27',
    text: '#E7EDEA',
    textMuted: '#A0ABA7',
    textFaint: '#6D7874',
    primary: '#4FD1B5',
    primarySoft: '#12322C',
    onPrimary: '#03241E',
    gold: '#F2C35B',
    goldSoft: '#3A2E12',
    income: '#4ADE80',
    danger: '#FF8A80',
    heroStart: '#0F5C50',
    heroEnd: '#041A17',
    onHero: '#FFFFFF',
    heroGold: '#F6CF6E',
    heroMint: '#9BF0D8',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Palette.light]: string };

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'monospace',
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Appends an alpha channel to a #RRGGBB colour. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
