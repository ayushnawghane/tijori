import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: solid forest pill. secondary: transparent pill with a fine sage outline. */
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const fg = primary ? theme.onPrimary : theme.sageInk;

  return (
    <PressableScale
      haptic
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        primary
          ? { backgroundColor: theme.primary, boxShadow: Shadow.md }
          : { borderWidth: 1, borderColor: theme.sage },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText variant="button" color={fg}>
            {label}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
