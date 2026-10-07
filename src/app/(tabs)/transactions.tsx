import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransactionRow } from '@/components/transaction-row';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { filterTransactions, groupByDay, type TxnFilter } from '@/lib/insights';
import { formatMoney } from '@/lib/money';
import { useTijori } from '@/state/tijori-store';

const FILTERS: { id: TxnFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'spent', label: 'Spent' },
  { id: 'received', label: 'Received' },
];

export default function TransactionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { transactions } = useTijori();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TxnFilter>('all');

  const sections = useMemo(
    () => groupByDay(filterTransactions(transactions, query, filter)),
    [transactions, query, filter],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View>
          <AppText variant="title">Transactions</AppText>
          <AppText variant="caption" color={theme.textMuted}>
            {transactions.length} tracked from bank SMS
          </AppText>
        </View>

        <View style={[styles.search, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="search" size={18} color={theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search merchant, category, amount"
            placeholderTextColor={theme.textFaint}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search transactions"
          />
          {query.length > 0 && (
            <PressableScale onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={theme.textFaint} />
            </PressableScale>
          )}
        </View>

        <View style={[styles.segment, { backgroundColor: theme.surfaceAlt }]}>
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <PressableScale
                key={f.id}
                haptic
                scaleTo={0.96}
                onPress={() => setFilter(f.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.segmentItem, active && { backgroundColor: theme.surface }]}>
                <AppText variant="caption" color={active ? theme.text : theme.textMuted}>
                  {f.label}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => String(t.id)}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={[styles.dayHeader, { backgroundColor: theme.bg }]}>
            <AppText variant="label" color={theme.textMuted}>
              {section.title}
            </AppText>
            {section.spendPaise > 0 && (
              <AppText variant="caption" tabular color={theme.textFaint}>
                {formatMoney(section.spendPaise)} spent
              </AppText>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            txn={item}
            onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: String(item.id) } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={28} color={theme.textFaint} />
            <AppText variant="caption" color={theme.textMuted}>
              {transactions.length === 0 ? 'No transactions yet.' : 'Nothing matches that search.'}
            </AppText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: 20, gap: 14, paddingBottom: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 15, paddingVertical: 0 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: Radius.md, gap: 4 },
  segmentItem: {
    flex: 1,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingHorizontal: 8, paddingBottom: 32 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 6,
  },
  empty: { alignItems: 'center', gap: 10, paddingTop: 64 },
});
