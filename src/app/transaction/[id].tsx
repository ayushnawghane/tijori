import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryAvatar } from '@/components/category-avatar';
import { signedAmount } from '@/components/transaction-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Fonts, Motion, Radius, Shadow, rise, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { categoriesFor, getCategory, type CategoryId } from '@/lib/categories';
import { formatDateTime } from '@/lib/insights';
import { METHOD_LABEL, type Transaction } from '@/lib/types';
import { useTijori } from '@/state/tijori-store';

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useTijori();
  const txn = transactions.find((t) => String(t.id) === id);

  if (!txn) return <Missing />;
  // Keyed so local edits reset if the screen is reused for another transaction.
  return <TransactionDetail key={txn.id} txn={txn} />;
}

function TransactionDetail({ txn }: { txn: Transaction }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { updateCategory } = useTijori();
  const [category, setCategory] = useState<CategoryId>(txn.category);
  const [applyToMerchant, setApplyToMerchant] = useState(Boolean(txn.merchantKey));
  const [showSms, setShowSms] = useState(false);
  const [saving, setSaving] = useState(false);

  const credit = txn.type === 'credit';
  const changed = category !== txn.category;

  const save = async () => {
    setSaving(true);
    try {
      await updateCategory(txn, category, applyToMerchant);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const details: [string, string | null][] = [
    ['Bank', txn.bank],
    ['Account', txn.accountTail ? `•• ${txn.accountTail}` : null],
    ['Paid via', METHOD_LABEL[txn.method]],
    ['Reference', txn.reference],
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="close-outline" label="Close" onPress={() => router.back()} />
        <AppText variant="label" color={theme.textMuted}>
          Transaction
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={rise(0)} style={styles.hero}>
          <CategoryAvatar categoryId={category} size={72} />
          <AppText variant="subtitle" style={[styles.center, styles.merchant]} numberOfLines={2}>
            {txn.merchant}
          </AppText>
          <AppText variant="display" tabular color={credit ? theme.income : theme.text}>
            {signedAmount(txn)}
          </AppText>
          <AppText variant="caption" color={theme.textMuted}>
            {formatDateTime(txn.timestamp)}
          </AppText>
        </Animated.View>

        <Animated.View entering={rise(1)}>
          <Card padding={0} style={styles.card}>
            {details
              .filter((d): d is [string, string] => Boolean(d[1]))
              .map(([label, value], i) => (
                <View
                  key={label}
                  style={[styles.detailRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <AppText variant="caption" color={theme.textMuted}>
                    {label}
                  </AppText>
                  <AppText variant="bodyStrong" tabular selectable numberOfLines={1} style={styles.detailValue}>
                    {value}
                  </AppText>
                </View>
              ))}
          </Card>
        </Animated.View>

        <Animated.View entering={rise(2)} style={styles.section}>
          <AppText variant="label" color={theme.textMuted}>
            Category
          </AppText>
          <View style={styles.chips}>
            {categoriesFor(txn.type).map((c) => {
              const selected = c.id === category;
              return (
                <PressableScale
                  key={c.id}
                  haptic
                  scaleTo={0.95}
                  onPress={() => setCategory(c.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? withAlpha(c.color, 0.14) : theme.surface,
                      borderColor: selected ? c.color : theme.border,
                    },
                  ]}>
                  <Ionicons name={c.icon} size={15} color={c.color} />
                  <AppText variant="caption" color={selected ? theme.text : theme.textMuted}>
                    {c.label}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>

        {txn.merchantKey ? (
          <Animated.View entering={rise(3)}>
            <PressableScale
              scaleTo={0.99}
              onPress={() => setApplyToMerchant((v) => !v)}
              accessibilityRole="switch"
              accessibilityState={{ checked: applyToMerchant }}
              style={[styles.card, styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border, boxShadow: Shadow.lg }]}>
              <View style={styles.toggleText}>
                <AppText variant="bodyStrong">Always use for {txn.merchant}</AppText>
                <AppText variant="caption" color={theme.textMuted}>
                  Re-files past {credit ? 'credits' : 'payments'} too, and every new one.
                </AppText>
              </View>
              <Switch
                value={applyToMerchant}
                onValueChange={setApplyToMerchant}
                trackColor={{ true: theme.sage, false: theme.surfaceHigh }}
                thumbColor="#FFFFFF"
              />
            </PressableScale>
          </Animated.View>
        ) : null}

        <Animated.View entering={rise(4)} style={styles.section}>
          <PressableScale onPress={() => setShowSms((v) => !v)} style={styles.smsToggle} hitSlop={8}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color={theme.terracottaInk} />
            <AppText variant="label" color={theme.terracottaInk}>
              {showSms ? 'Hide original SMS' : 'Show original SMS'}
            </AppText>
          </PressableScale>
          {showSms && (
            <Animated.View
              entering={FadeIn.duration(Motion.standard).easing(Motion.ease)}
              exiting={FadeOut.duration(Motion.fast)}
              style={[styles.sms, { backgroundColor: theme.surfaceAlt }]}>
              <AppText variant="caption" color={theme.textFaint}>
                From {txn.sender}
              </AppText>
              <AppText selectable style={[styles.smsBody, { color: theme.textMuted }]}>
                {txn.body}
              </AppText>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: theme.border, backgroundColor: theme.bg }]}>
        <Button
          label={changed ? `Save as ${getCategory(category).label}` : 'Done'}
          loading={saving}
          onPress={changed ? save : () => router.back()}
        />
      </View>
    </View>
  );
}

function Missing() {
  const theme = useTheme();
  return (
    <View style={[styles.root, styles.missing, { backgroundColor: theme.bg }]}>
      <AppText color={theme.textMuted}>This transaction no longer exists.</AppText>
      <Button label="Go back" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBarSpacer: { width: 44 },
  content: { paddingHorizontal: 24, paddingBottom: 32, gap: 28 },
  hero: { alignItems: 'center', gap: 6, paddingTop: 8, paddingBottom: 4 },
  merchant: { marginTop: 10 },
  center: { textAlign: 'center' },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  detailValue: { flexShrink: 1, textAlign: 'right' },
  section: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 },
  toggleText: { flex: 1, gap: 2 },
  smsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  sms: { borderRadius: Radius.lg, padding: 18, gap: 8 },
  smsBody: { fontFamily: Fonts.mono, fontSize: 12.5, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  missing: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
});
