import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Shadow, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IoniconName } from '@/lib/categories';
import type { MonthSummary } from '@/lib/insights';
import { formatMoney } from '@/lib/money';

/** Fine 1px arcs in the top corner, like growth rings in a cut stem. Purely decorative. */
const RINGS = [320, 236, 152];

/** The month at a glance: net on top, money in / out underneath. */
export function HeroCard({ summary }: { summary: MonthSummary }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.hero, boxShadow: Shadow.xl }]}>
      {RINGS.map((d, i) => (
        <View
          key={d}
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: d,
              height: d,
              right: -d / 2 + 24,
              top: -d / 2 + 8,
              borderColor: withAlpha(theme.heroLine, 0.22 + i * 0.08),
            },
          ]}
        />
      ))}

      <AppText variant="label" color={theme.heroMuted}>
        Net this month
      </AppText>
      <AppText
        variant="display"
        tabular
        color={theme.onHero}
        adjustsFontSizeToFit
        numberOfLines={1}
        style={styles.net}>
        {formatMoney(summary.netPaise)}
      </AppText>
      <AppText variant="caption" color={theme.heroMuted}>
        {summary.count === 0
          ? 'No transactions yet'
          : `${summary.count} transaction${summary.count === 1 ? '' : 's'}`}
      </AppText>

      <View style={[styles.stats, { borderTopColor: withAlpha(theme.heroLine, 0.35) }]}>
        <Stat icon="arrow-down" label="Money in" value={summary.incomePaise} accent={theme.heroIn} />
        <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.heroLine, 0.35) }]} />
        <Stat icon="arrow-up" label="Money out" value={summary.spendPaise} accent={theme.heroOut} />
      </View>
    </View>
  );
}

function Stat({ icon, label, value, accent }: { icon: IoniconName; label: string; value: number; accent: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <View style={styles.statLabel}>
        <View style={[styles.statIcon, { backgroundColor: withAlpha(accent, 0.16) }]}>
          <Ionicons name={icon} size={12} color={accent} />
        </View>
        <AppText variant="caption" color={theme.heroMuted}>
          {label}
        </AppText>
      </View>
      <AppText variant="subtitle" tabular color={theme.onHero} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    overflow: 'hidden',
    gap: 2,
  },
  ring: { position: 'absolute', borderRadius: Radius.pill, borderWidth: 1 },
  net: { marginTop: 10, marginBottom: 2 },
  stats: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: 18 },
  stat: { flex: 1, gap: 6 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
