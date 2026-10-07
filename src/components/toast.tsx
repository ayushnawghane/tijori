import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

export type Notice = { id: number; text: string; tone: 'info' | 'error' };

/** Small pill that floats above the tab bar. Rendered by TijoriProvider. */
export function Toast({ notice }: { notice: Notice | null }) {
  const theme = useTheme();
  const dark = useIsDark();
  const insets = useSafeAreaInsets();
  if (!notice) return null;

  // The pill is drawn in inverted colours, so its icon uses the opposite palette's accents.
  const inverse = dark ? Palette.light : Palette.dark;
  const error = notice.tone === 'error';
  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 92 }]}>
      <Animated.View
        key={notice.id}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(180)}
        accessibilityLiveRegion="polite"
        style={[styles.pill, { backgroundColor: theme.text }]}>
        <Ionicons
          name={error ? 'alert-circle' : 'checkmark-circle'}
          size={18}
          color={error ? inverse.danger : inverse.primary}
        />
        <AppText variant="caption" color={theme.bg} numberOfLines={2} style={styles.text}>
          {notice.text}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    maxWidth: 420,
  },
  text: { flexShrink: 1 },
});
