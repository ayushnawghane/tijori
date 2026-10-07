import { Image, StyleSheet, View } from 'react-native';

import { GRAIN_OPACITY } from '@/constants/theme';

const GRAIN = require('../../../assets/images/paper-grain.png');

/**
 * A fixed, full-screen layer of fine noise that turns flat pixels into paper.
 * Rendered once above everything at the root; it never receives touches.
 */
export function PaperGrain() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: GRAIN_OPACITY }]}>
      <Image source={GRAIN} resizeMode="repeat" style={styles.fill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});
