import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useTheme } from '@/hooks/use-theme';
import type { IoniconName } from '@/lib/categories';

type IconButtonProps = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
};

/** A line icon floating in a soft, pale sage circle. */
export function IconButton({ icon, label, onPress, disabled, size = 44 }: IconButtonProps) {
  const theme = useTheme();
  return (
    <PressableScale
      haptic
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.sageSoft }]}>
      <Ionicons name={icon} size={Math.round(size * 0.44)} color={theme.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
