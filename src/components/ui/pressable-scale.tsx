import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Motion } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Press in quickly so the tap feels acknowledged; release slowly so it settles back like a leaf.
const PRESS_IN = { duration: 160, easing: Motion.ease };
const PRESS_OUT = { duration: Motion.standard, easing: Motion.ease };

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far the element shrinks while pressed. Subtle is better: 0.96–0.99. */
  scaleTo?: number;
  haptic?: boolean;
};

/** A Pressable that gives soft, eased tactile feedback — used for every tappable surface. */
export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.set(withTiming(scaleTo, PRESS_IN));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, PRESS_OUT));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync();
        onPress?.(e);
      }}
      style={[style, animatedStyle, disabled && { opacity: 0.4 }]}
    />
  );
}
