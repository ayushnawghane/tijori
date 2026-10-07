import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroCard } from '@/components/home/hero-card';
import { SpendBreakdown } from '@/components/home/spend-breakdown';
import { TransactionRow } from '@/components/transaction-row';
import { AppText, Em } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { rise } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentMonth, isSameMonth, monthLabel, shiftMonth, summarizeMonth } from '@/lib/insights';
import { useTijori } from '@/state/tijori-store';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { status, error, transactions, scanning, scan } = useTijori();
  const [month, setMonth] = useState(currentMonth);
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => summarizeMonth(transactions, month), [transactions, month]);
  const atCurrentMonth = isSameMonth(month, currentMonth());

  const onRefresh = async () => {
    setRefreshing(true);
    await scan('manual');
    setRefreshing(false);
  };

  const openTransaction = (id: number) =>
    router.push({ pathname: '/transaction/[id]', params: { id: String(id) } });

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.sageInk]}
          progressBackgroundColor={theme.surface}
          tintColor={theme.sageInk}
        />
      }>
      <Animated.View entering={rise(0)} style={styles.header}>
        <View style={styles.brand}>
          <AppText variant="title">Tijori</AppText>
          <View style={styles.privacy}>
            <Ionicons name="lock-closed-outline" size={13} color={theme.sageInk} />
            <AppText variant="caption" color={theme.textMuted}>
              On-device · encrypted
            </AppText>
          </View>
        </View>
        {scanning ? (
          <View style={styles.spinner}>
            <ActivityIndicator color={theme.sageInk} />
          </View>
        ) : (
          <IconButton icon="refresh-outline" label="Scan SMS inbox" onPress={() => scan('manual')} />
        )}
      </Animated.View>

      {status === 'error' ? (
        <StateCard
          icon="warning-outline"
          title="Couldn’t open your vault"
          body={error ?? 'Something went wrong opening the encrypted database.'}
        />
      ) : status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.sageInk} />
        </View>
      ) : transactions.length === 0 ? (
        <StateCard
          icon="file-tray-outline"
          title={scanning ? 'Reading your bank SMS…' : 'No bank SMS found yet'}
          body="Tijori only reads messages from banks and card issuers. New transactions show up here automatically."
          action={<Button label="Scan inbox" loading={scanning} onPress={() => scan('manual')} />}
        />
      ) : (
        <View style={styles.sections}>
          <Animated.View entering={rise(1)} style={styles.monthRow}>
            <IconButton icon="chevron-back-outline" label="Previous month" onPress={() => setMonth((m) => shiftMonth(m, -1))} />
            <AppText variant="subtitle" style={styles.monthLabel}>
              {monthLabel(month)}
            </AppText>
            <IconButton
              icon="chevron-forward-outline"
              label="Next month"
              disabled={atCurrentMonth}
              onPress={() => setMonth((m) => shiftMonth(m, 1))}
            />
          </Animated.View>

          <Animated.View entering={rise(2)}>
            <HeroCard summary={summary} />
          </Animated.View>

          {summary.slices.length > 0 && (
            <Animated.View entering={rise(3)}>
              <SpendBreakdown summary={summary} />
            </Animated.View>
          )}

          <Animated.View entering={rise(4)} style={styles.recent}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">
                Recent <Em>activity</Em>
              </AppText>
              <PressableScale
                onPress={() => router.navigate('/transactions')}
                hitSlop={12}
                accessibilityRole="link"
                style={styles.seeAll}>
                <AppText variant="label" color={theme.terracottaInk}>
                  See all
                </AppText>
                <Ionicons name="arrow-forward" size={13} color={theme.terracottaInk} />
              </PressableScale>
            </View>

            <Card padding={6}>
              {summary.transactions.length === 0 ? (
                <AppText variant="caption" color={theme.textMuted} style={styles.emptyMonth}>
                  Nothing in {monthLabel(month)}.
                </AppText>
              ) : (
                summary.transactions
                  .slice(0, RECENT_COUNT)
                  .map((t) => <TransactionRow key={t.id} txn={t} onPress={() => openTransaction(t.id)} />)
              )}
            </Card>
          </Animated.View>
        </View>
      )}
    </ScrollView>
  );
}

function StateCard({
  icon,
  title,
  body,
  action,
}: {
  icon: 'warning-outline' | 'file-tray-outline';
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Animated.View entering={rise(1)}>
      <Card padding={32} style={styles.stateCard}>
        <View style={[styles.stateIcon, { backgroundColor: theme.sageSoft }]}>
          <Ionicons name={icon} size={28} color={theme.sageInk} />
        </View>
        <AppText variant="subtitle" style={styles.center}>
          {title}
        </AppText>
        <AppText variant="caption" color={theme.textMuted} style={styles.center}>
          {body}
        </AppText>
        {action && <View style={styles.stateAction}>{action}</View>}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 48, gap: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { gap: 2 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spinner: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  loading: { paddingVertical: 80 },
  sections: { gap: 28 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthLabel: { flex: 1, textAlign: 'center' },
  recent: { gap: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyMonth: { padding: 16, textAlign: 'center' },
  stateCard: { alignItems: 'center', gap: 12, marginTop: 24 },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  center: { textAlign: 'center' },
  stateAction: { alignSelf: 'stretch', marginTop: 12 },
});
