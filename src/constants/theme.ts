import { Easing, FadeInDown } from 'react-native-reanimated';

/**
 * Tijori's visual language — "Botanical": rice-paper backgrounds, deep forest ink,
 * sage and terracotta accents, Playfair Display headlines over Source Sans 3 body.
 * Every screen reads colours, type, shape and motion from here.
 */

export const Palette = {
  light: {
    bg: '#F9F8F4', // warm alabaster / rice paper
    surface: '#FFFFFF',
    surfaceAlt: '#F2F0EB', // soft clay — inputs, segmented controls
    surfaceHigh: '#E6E2DA',
    clay: '#DCCFC2', // mushroom — secondary fills
    border: '#E6E2DA', // stone
    text: '#2D3A31', // deep forest
    textMuted: '#5E6B62',
    textFaint: '#7F8A81',
    primary: '#2D3A31', // primary buttons are forest ink
    onPrimary: '#F9F8F4',
    sage: '#8C9A84', // decorative accents, active borders
    sageSoft: '#E7EBE2', // pale circles behind icons
    sageInk: '#5F6F58', // sage dark enough for text and meaningful icons
    terracotta: '#C27B66', // interactive pops
    terracottaSoft: '#F4E4DC',
    terracottaInk: '#A55F4B',
    income: '#4E7A4A',
    danger: '#A8533F',
    hero: '#2D3A31',
    onHero: '#F9F8F4',
    heroMuted: '#BFC8B9',
    heroLine: '#8C9A84',
    heroIn: '#B9CDAE',
    heroOut: '#E2B4A3',
  },
  // "Night garden": the same palette after dusk — forest becomes the ground, rice paper the ink.
  dark: {
    bg: '#1A211C',
    surface: '#222B25',
    surfaceAlt: '#29332C',
    surfaceHigh: '#333F37',
    clay: '#4A443D',
    border: '#313B34',
    text: '#ECE7DD',
    textMuted: '#B3B2A6',
    textFaint: '#868D83',
    primary: '#DCCFC2',
    onPrimary: '#1F2822',
    sage: '#8C9A84',
    sageSoft: '#2C372F',
    sageInk: '#AEBCA4',
    terracotta: '#D69580',
    terracottaSoft: '#3B2B24',
    terracottaInk: '#E0A792',
    income: '#A3C79A',
    danger: '#E39A85',
    hero: '#2D3A31',
    onHero: '#F2EEE6',
    heroMuted: '#B4BEAE',
    heroLine: '#8C9A84',
    heroIn: '#B9CDAE',
    heroOut: '#E2B4A3',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Palette.light]: string };

export const Fonts = {
  serif: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_600SemiBold_Italic',
  regular: 'SourceSans3_400Regular',
  medium: 'SourceSans3_500Medium',
  semibold: 'SourceSans3_600SemiBold',
  mono: 'monospace',
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24, // standard card
  xl: 32,
  arch: 200, // top corners of arch-shaped panels
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Very soft, diffused forest-tinted shadows — never a harsh drop. */
export const Shadow = {
  sm: '0px 4px 6px -1px rgba(45, 58, 49, 0.05)',
  md: '0px 10px 15px -3px rgba(45, 58, 49, 0.05)',
  lg: '0px 20px 40px -10px rgba(45, 58, 49, 0.06)',
  xl: '0px 25px 50px -12px rgba(45, 58, 49, 0.15)',
} as const;

/** Slow, graceful, eased-out — things settle like leaves, they never snap. */
export const Motion = {
  fast: 300,
  standard: 500,
  slow: 700,
  stagger: 90,
  ease: Easing.out(Easing.cubic),
} as const;

/** Entrance for content: a slow fade that floats up into place, staggered by `index`. */
export function rise(index = 0) {
  return FadeInDown.duration(Motion.slow).delay(index * Motion.stagger).easing(Motion.ease);
}

/** Opacity of the paper-grain overlay. Subtle enough to feel, not see. */
export const GRAIN_OPACITY = 0.035;

/** Appends an alpha channel to a #RRGGBB colour. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
