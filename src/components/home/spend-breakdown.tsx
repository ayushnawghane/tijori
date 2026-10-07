import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { CategoryAvatar } from '@/components/category-avatar';
import { AppText } from '@/components/ui/app-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCategory } from '@/lib/categories';
import type { MonthSummary } from '@/lib/insights';
import { formatMoney } from '@/lib/money';

const VISIBLE_ROWS = 6;

/** Stacked bar of the month's spending by category, then the biggest categories. */
export function SpendBreakdown({ summary }: { summary: MonthSummary }) {
  const theme = useTheme();
  const { slices, spendPaise } = summary;
  const hidden = slices.length - VISIBLE_ROWS;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <AppText variant="heading">Where it went</AppText>
        <AppText variant="caption" tabular color={theme.textMuted}>
          {formatMoney(spendPaise)}
        </AppText>
      </View>

      <View style={[styles.bar, { backgroundColor: theme.surfaceAlt }]}>
        {slices.map((s) => (
          <Animated.View
            key={s.category}
            layout={LinearTransition.duration(260)}
            style={{ flex: Math.max(s.share, 0.012), backgroundColor: getCategory(s.category).color }}
          />
        ))}
      </View>

      <View style={styles.rows}>
        {slices.slice(0, VISIBLE_ROWS).map((s) => (
          <View key={s.category} style={styles.row}>
            <CategoryAvatar categoryId={s.category} size={36} />
            <View style={styles.rowText}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {getCategory(s.category).label}
              </AppText>
              <AppText variant="caption" color={theme.textFaint}>
                {Math.round(s.share * 100)}% · {s.count} txn{s.count === 1 ? '' : 's'}
              </AppText>
            </View>
            <AppText variant="bodyStrong" tabular>
              {formatMoney(s.amountPaise)}
            </AppText>
          </View>
        ))}
        {hidden > 0 && (
          <AppText variant="caption" color={theme.textFaint} style={styles.more}>
            + {hidden} more categor{hidden === 1 ? 'y' : 'ies'}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  rows: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  more: { marginLeft: 48 },
});
