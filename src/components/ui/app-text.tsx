import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'button';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  /** Fixed-width digits so amounts line up and don't jitter while changing. */
  tabular?: boolean;
};

export function AppText({ variant = 'body', color, tabular, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[styles[variant], { color: color ?? theme.text }, tabular && styles.tabular, style]}
      {...rest}
    />
  );
}

/**
 * Italic Playfair for a single emphasised word inside a serif headline:
 * `<AppText variant="title">Where it <Em>went</Em></AppText>`. Inherits size and colour.
 */
export function Em({ children, color }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.em, color ? { color } : null]}>{children}</Text>;
}

const styles = StyleSheet.create({
  // Serif — Playfair Display carries the personality.
  display: { fontFamily: Fonts.serif, fontSize: 44, lineHeight: 52, letterSpacing: -0.5 },
  title: { fontFamily: Fonts.serif, fontSize: 32, lineHeight: 40, letterSpacing: -0.3 },
  subtitle: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 28 },
  // Sans — Source Sans 3 does the quiet work.
  heading: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: Fonts.medium, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: Fonts.semibold, fontSize: 11.5, lineHeight: 14, letterSpacing: 1.8, textTransform: 'uppercase' },
  button: { fontFamily: Fonts.semibold, fontSize: 13.5, lineHeight: 18, letterSpacing: 2, textTransform: 'uppercase' },
  em: { fontFamily: Fonts.serifItalic },
  tabular: { fontVariant: ['tabular-nums'] },
});
