import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Motion, Radius, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Notice = { id: number; text: string; tone: 'info' | 'error' };

/** Small forest-ink pill that drifts up above the tab bar. Rendered by TijoriProvider. */
export function Toast({ notice }: { notice: Notice | null }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  if (!notice) return null;

  const error = notice.tone === 'error';
  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 96 }]}>
      <Animated.View
        key={notice.id}
        entering={FadeInDown.duration(Motion.standard).easing(Motion.ease)}
        exiting={FadeOutDown.duration(Motion.fast)}
        accessibilityLiveRegion="polite"
        style={[styles.pill, { backgroundColor: theme.hero, boxShadow: Shadow.xl }]}>
        <Ionicons
          name={error ? 'alert-circle-outline' : 'leaf-outline'}
          size={18}
          color={error ? theme.heroOut : theme.heroIn}
        />
        <AppText variant="caption" color={theme.onHero} numberOfLines={2} style={styles.text}>
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
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    maxWidth: 420,
  },
  text: { flexShrink: 1 },
});
