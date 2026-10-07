import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransactionRow } from '@/components/transaction-row';
import { AppText, Em } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Fonts, Radius, Shadow, rise } from '@/constants/theme';
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
  const [searchFocused, setSearchFocused] = useState(false);

  const sections = useMemo(
    () => groupByDay(filterTransactions(transactions, query, filter)),
    [transactions, query, filter],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Animated.View entering={rise(0)}>
          <AppText variant="title">
            Every <Em>rupee</Em>
          </AppText>
          <AppText variant="caption" color={theme.textMuted}>
            {transactions.length} tracked from bank SMS
          </AppText>
        </Animated.View>

        <Animated.View
          entering={rise(1)}
          style={[
            styles.search,
            { backgroundColor: theme.surfaceAlt, borderColor: searchFocused ? theme.sage : 'transparent' },
          ]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? theme.sageInk : theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            cursorColor={theme.sageInk}
            selectionColor={theme.sage}
            placeholder="Search merchant, category, amount"
            placeholderTextColor={theme.textFaint}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search transactions"
          />
          {query.length > 0 && (
            <PressableScale onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle-outline" size={19} color={theme.textFaint} />
            </PressableScale>
          )}
        </Animated.View>

        <Animated.View entering={rise(2)} style={[styles.segment, { backgroundColor: theme.surfaceAlt }]}>
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
                style={[styles.segmentItem, active && { backgroundColor: theme.surface, boxShadow: Shadow.md }]}>
                <AppText variant="label" color={active ? theme.text : theme.textMuted}>
                  {f.label}
                </AppText>
              </PressableScale>
            );
          })}
        </Animated.View>
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
            <View style={[styles.emptyIcon, { backgroundColor: theme.sageSoft }]}>
              <Ionicons name="leaf-outline" size={26} color={theme.sageInk} />
            </View>
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
  top: { paddingHorizontal: 24, gap: 18, paddingBottom: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 16, paddingVertical: 0 },
  segment: { flexDirection: 'row', padding: 5, borderRadius: Radius.pill, gap: 4 },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingHorizontal: 10, paddingBottom: 48 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 24,
    paddingBottom: 8,
  },
  empty: { alignItems: 'center', gap: 12, paddingTop: 64 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});
