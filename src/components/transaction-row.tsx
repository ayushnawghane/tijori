import { StyleSheet, View } from 'react-native';

import { CategoryAvatar } from '@/components/category-avatar';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCategory } from '@/lib/categories';
import { formatTime } from '@/lib/insights';
import { formatMoney } from '@/lib/money';
import { METHOD_LABEL, type Transaction } from '@/lib/types';

export function signedAmount(txn: Pick<Transaction, 'type' | 'amountPaise'>): string {
  return formatMoney(txn.type === 'credit' ? txn.amountPaise : -txn.amountPaise, 'always');
}

type TransactionRowProps = {
  txn: Transaction;
  onPress: () => void;
};

export function TransactionRow({ txn, onPress }: TransactionRowProps) {
  const theme = useTheme();
  const category = getCategory(txn.category);
  const credit = txn.type === 'credit';
  const meta = [category.label, METHOD_LABEL[txn.method], txn.bank].filter(Boolean).join(' · ');

  return (
    <PressableScale
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${txn.merchant}, ${credit ? 'received' : 'spent'} ${formatMoney(txn.amountPaise)}, ${category.label}`}
      style={styles.row}>
      <CategoryAvatar categoryId={txn.category} />
      <View style={styles.middle}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {txn.merchant}
        </AppText>
        <AppText variant="caption" color={theme.textMuted} numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <View style={styles.end}>
        <AppText variant="bodyStrong" tabular color={credit ? theme.income : theme.text}>
          {signedAmount(txn)}
        </AppText>
        <AppText variant="caption" color={theme.textFaint}>
          {formatTime(txn.timestamp)}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  middle: { flex: 1, gap: 2 },
  end: { alignItems: 'flex-end', gap: 2 },
});
