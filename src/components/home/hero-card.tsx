import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IoniconName } from '@/lib/categories';
import type { MonthSummary } from '@/lib/insights';
import { formatMoney } from '@/lib/money';

/** The month at a glance: net on top, money in / out underneath. */
export function HeroCard({ summary }: { summary: MonthSummary }) {
  const theme = useTheme();
  const muted = withAlpha('#FFFFFF', 0.72);

  return (
    <LinearGradient
      colors={[theme.heroStart, theme.heroEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      {/* Vault-door rings, purely decorative. */}
      <View pointerEvents="none" style={[styles.ring, styles.ringOuter]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringInner]} />

      <AppText variant="label" color={muted}>
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
      <AppText variant="caption" color={muted}>
        {summary.count === 0
          ? 'No transactions yet'
          : `${summary.count} transaction${summary.count === 1 ? '' : 's'}`}
      </AppText>

      <View style={styles.stats}>
        <Stat icon="arrow-down" label="Money in" value={summary.incomePaise} accent={theme.heroMint} />
        <Stat icon="arrow-up" label="Money out" value={summary.spendPaise} accent={theme.heroGold} />
      </View>
    </LinearGradient>
  );
}

function Stat({ icon, label, value, accent }: { icon: IoniconName; label: string; value: number; accent: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: withAlpha(accent, 0.18) }]}>
        <Ionicons name={icon} size={14} color={accent} />
      </View>
      <View style={styles.statText}>
        <AppText variant="caption" color={withAlpha('#FFFFFF', 0.72)}>
          {label}
        </AppText>
        <AppText variant="heading" tabular color="#FFFFFF" numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(value)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 22,
    overflow: 'hidden',
    gap: 4,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  ringOuter: { width: 260, height: 260, right: -110, top: -120, borderWidth: 30 },
  ringInner: { width: 120, height: 120, right: -40, top: -50, borderWidth: 14 },
  net: { marginTop: 6 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: { flex: 1 },
});
