import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { withAlpha } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import { getCategory } from '@/lib/categories';

type CategoryAvatarProps = {
  categoryId: string;
  size?: number;
};

/** A pale, pebble-round circle with the category's line icon floating in it. */
export function CategoryAvatar({ categoryId, size = 44 }: CategoryAvatarProps) {
  const category = getCategory(categoryId);
  const dark = useIsDark();

  return (
    <View
      accessibilityLabel={category.label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(category.color, dark ? 0.2 : 0.13),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={category.icon} size={Math.round(size * 0.46)} color={category.color} />
    </View>
  );
}
