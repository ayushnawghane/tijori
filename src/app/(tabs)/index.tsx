import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroCard } from '@/components/home/hero-card';
import { SpendBreakdown } from '@/components/home/spend-breakdown';
import { TransactionRow } from '@/components/transaction-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius } from '@/constants/theme';
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
          colors={[theme.primary]}
          progressBackgroundColor={theme.surface}
          tintColor={theme.primary}
        />
      }>
      <View style={styles.header}>
        <View style={styles.brand}>
          <AppText variant="title">Tijori</AppText>
          <View style={styles.privacy}>
            <Ionicons name="lock-closed" size={12} color={theme.primary} />
            <AppText variant="caption" color={theme.textMuted}>
              On-device · encrypted
            </AppText>
          </View>
        </View>
        {scanning ? (
          <View style={styles.spinner}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : (
          <IconButton icon="refresh" label="Scan SMS inbox" onPress={() => scan('manual')} />
        )}
      </View>

      {status === 'error' ? (
        <StateCard
          icon="warning"
          title="Couldn’t open your vault"
          body={error ?? 'Something went wrong opening the encrypted database.'}
        />
      ) : status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <StateCard
          icon="file-tray"
          title={scanning ? 'Reading your bank SMS…' : 'No bank SMS found yet'}
          body="Tijori only reads messages from banks and card issuers. New transactions show up here automatically."
          action={<Button label="Scan inbox" loading={scanning} onPress={() => scan('manual')} />}
        />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.sections}>
          <View style={styles.monthRow}>
            <IconButton icon="chevron-back" label="Previous month" onPress={() => setMonth((m) => shiftMonth(m, -1))} />
            <AppText variant="heading" style={styles.monthLabel}>
              {monthLabel(month)}
            </AppText>
            <IconButton
              icon="chevron-forward"
              label="Next month"
              disabled={atCurrentMonth}
              onPress={() => setMonth((m) => shiftMonth(m, 1))}
            />
          </View>

          <HeroCard summary={summary} />

          {summary.slices.length > 0 && <SpendBreakdown summary={summary} />}

          <View style={styles.sectionHeader}>
            <AppText variant="heading">Recent</AppText>
            <PressableScale onPress={() => router.navigate('/transactions')} hitSlop={8}>
              <AppText variant="caption" color={theme.primary}>
                See all
              </AppText>
            </PressableScale>
          </View>

          <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {summary.transactions.length === 0 ? (
              <AppText variant="caption" color={theme.textMuted} style={styles.emptyMonth}>
                Nothing in {monthLabel(month)}.
              </AppText>
            ) : (
              summary.transactions
                .slice(0, RECENT_COUNT)
                .map((t) => <TransactionRow key={t.id} txn={t} onPress={() => openTransaction(t.id)} />)
            )}
          </View>
        </Animated.View>
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
  icon: 'warning' | 'file-tray';
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.stateIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={26} color={theme.primary} />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="caption" color={theme.textMuted} style={styles.center}>
        {body}
      </AppText>
      {action && <View style={styles.stateAction}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { gap: 2 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  spinner: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loading: { paddingVertical: 80 },
  sections: { gap: 20 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthLabel: { flex: 1, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -8,
    paddingHorizontal: 4,
  },
  list: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
  },
  emptyMonth: { padding: 16, textAlign: 'center' },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    padding: 28,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  center: { textAlign: 'center' },
  stateAction: { alignSelf: 'stretch', marginTop: 10 },
});
