import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IoniconName } from '@/lib/categories';
import { useSmsPermission } from '@/state/sms-permission';

const PROMISES: { icon: IoniconName; title: string; body: string }[] = [
  {
    icon: 'cloud-offline',
    title: 'No internet. At all.',
    body: 'Tijori has no internet permission, so it can’t upload anything. Check its permissions yourself.',
  },
  {
    icon: 'chatbubbles',
    title: 'Only bank messages',
    body: 'Messages from people and OTPs are skipped. Only bank and card alerts are read.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Encrypted on this phone',
    body: 'Your transactions live in an encrypted vault that only this phone can unlock.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { status, request } = useSmsPermission();

  const blocked = status === 'blocked';
  const unsupported = status === 'unsupported';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={[theme.heroStart, theme.heroEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vault}>
            <Ionicons name="lock-closed" size={40} color={theme.heroGold} />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.headline}>
          <AppText variant="label" color={theme.primary}>
            Tijori
          </AppText>
          <AppText variant="display">Your money,{'\n'}locked in your phone.</AppText>
          <AppText color={theme.textMuted}>
            Tijori reads your bank SMS to track what you spend and earn — automatically, and without
            anything ever leaving this device.
          </AppText>
        </Animated.View>

        <View style={styles.promises}>
          {PROMISES.map((p, i) => (
            <Animated.View
              key={p.title}
              entering={FadeInDown.delay(160 + i * 70).duration(500)}
              style={[styles.promise, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.promiseIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={p.icon} size={20} color={theme.primary} />
              </View>
              <View style={styles.promiseText}>
                <AppText variant="heading">{p.title}</AppText>
                <AppText variant="caption" color={theme.textMuted}>
                  {p.body}
                </AppText>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(420).duration(500)}
        style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: theme.bg }]}>
        {unsupported ? (
          <AppText variant="caption" color={theme.textMuted} style={styles.note}>
            Tijori needs Android to read bank SMS. Run it with “npx expo run:android” — Expo Go
            can’t access SMS.
          </AppText>
        ) : blocked ? (
          <>
            <AppText variant="caption" color={theme.textMuted} style={styles.note}>
              SMS access was turned off. Open Settings → Permissions → SMS and choose Allow.
            </AppText>
            <Button label="Open settings" onPress={() => Linking.openSettings()} />
          </>
        ) : (
          <>
            {status === 'denied' && (
              <AppText variant="caption" color={theme.textMuted} style={styles.note}>
                Tijori can’t work without reading bank SMS. Nothing is uploaded — ever.
              </AppText>
            )}
            <Button
              label="Allow SMS access"
              icon={<Ionicons name="lock-open" size={18} color={theme.onPrimary} />}
              onPress={request}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 24, gap: 28 },
  vault: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { gap: 12 },
  promises: { gap: 12 },
  promise: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  promiseIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseText: { flex: 1, gap: 3 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 12 },
  note: { textAlign: 'center' },
});
