import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label';

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

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.bold, fontSize: 36, lineHeight: 42, letterSpacing: -1 },
  title: { fontFamily: Fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  heading: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: Fonts.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: Fonts.semibold, fontSize: 11.5, lineHeight: 14, letterSpacing: 0.9, textTransform: 'uppercase' },
  tabular: { fontVariant: ['tabular-nums'] },
});
