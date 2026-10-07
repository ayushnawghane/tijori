import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  /** Interior padding. Lists pass a small value so their rows can carry their own. */
  padding?: number;
};

/** The standard surface: white (or night-green) paper, 24px corners, a hairline of stone, a soft bloom. */
export function Card({ padding = 20, style, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { padding, backgroundColor: theme.surface, borderColor: theme.border, boxShadow: Shadow.lg },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
});
