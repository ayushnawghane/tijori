import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Em } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Shadow, rise, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IoniconName } from '@/lib/categories';
import { useSmsPermission } from '@/state/sms-permission';

const PROMISES: { icon: IoniconName; title: string; body: string }[] = [
  {
    icon: 'cloud-offline-outline',
    title: 'No internet. At all.',
    body: 'Tijori has no internet permission, so it can’t upload anything. Check its permissions yourself.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Only bank messages',
    body: 'Messages from people and OTPs are skipped. Only bank and card alerts are read.',
  },
  {
    icon: 'shield-checkmark-outline',
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
        {/* The vault as a Roman arch: a doorway with a fine inner line, the lock at its threshold. */}
        <Animated.View
          entering={rise(0)}
          style={[styles.arch, { backgroundColor: theme.hero, boxShadow: Shadow.xl }]}>
          <View style={[styles.archLine, { borderColor: withAlpha(theme.heroLine, 0.45) }]} />
          <View style={[styles.archSeal, { backgroundColor: withAlpha(theme.heroIn, 0.14) }]}>
            <Ionicons name="lock-closed-outline" size={28} color={theme.heroIn} />
          </View>
        </Animated.View>

        <Animated.View entering={rise(1)} style={styles.headline}>
          <AppText variant="label" color={theme.sageInk}>
            Tijori
          </AppText>
          <AppText variant="display">
            Your money,{'\n'}
            <Em>locked</Em> in your phone.
          </AppText>
          <AppText color={theme.textMuted}>
            Tijori reads your bank SMS to track what you spend and earn — automatically, and without
            anything ever leaving this device.
          </AppText>
        </Animated.View>

        <View style={styles.promises}>
          {PROMISES.map((p, i) => (
            <Animated.View
              key={p.title}
              entering={rise(2 + i)}>
              <Card style={styles.promise}>
                <View style={[styles.promiseIcon, { backgroundColor: theme.sageSoft }]}>
                  <Ionicons name={p.icon} size={21} color={theme.sageInk} />
                </View>
                <View style={styles.promiseText}>
                  <AppText variant="heading">{p.title}</AppText>
                  <AppText variant="caption" color={theme.textMuted}>
                    {p.body}
                  </AppText>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={rise(5)}
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
              icon={<Ionicons name="lock-open-outline" size={17} color={theme.onPrimary} />}
              onPress={request}
            />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const ARCH_WIDTH = 132;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 32, gap: 32 },
  arch: {
    width: ARCH_WIDTH,
    height: 168,
    borderTopLeftRadius: Radius.arch,
    borderTopRightRadius: Radius.arch,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 26,
    overflow: 'hidden',
  },
  archLine: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 1,
    borderTopLeftRadius: Radius.arch,
    borderTopRightRadius: Radius.arch,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  archSeal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { gap: 14 },
  promises: { gap: 14 },
  promise: { flexDirection: 'row', gap: 16 },
  promiseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseText: { flex: 1, gap: 4 },
  footer: { paddingHorizontal: 24, paddingTop: 14, gap: 14 },
  note: { textAlign: 'center' },
});
