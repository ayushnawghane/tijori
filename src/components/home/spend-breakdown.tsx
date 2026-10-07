import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { CategoryAvatar } from '@/components/category-avatar';
import { AppText, Em } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Motion, Radius } from '@/constants/theme';
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
    <Card padding={22} style={styles.card}>
      <View style={styles.header}>
        <AppText variant="subtitle">
          Where it <Em>went</Em>
        </AppText>
        <AppText variant="caption" tabular color={theme.textMuted}>
          {formatMoney(spendPaise)}
        </AppText>
      </View>

      <View style={[styles.bar, { backgroundColor: theme.surfaceAlt }]}>
        {slices.map((s) => (
          <Animated.View
            key={s.category}
            layout={LinearTransition.duration(Motion.standard).easing(Motion.ease)}
            style={{ flex: Math.max(s.share, 0.012), backgroundColor: getCategory(s.category).color }}
          />
        ))}
      </View>

      <View style={styles.rows}>
        {slices.slice(0, VISIBLE_ROWS).map((s) => (
          <View key={s.category} style={styles.row}>
            <CategoryAvatar categoryId={s.category} size={38} />
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    gap: 3,
  },
  rows: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1 },
  more: { marginLeft: 52 },
});
