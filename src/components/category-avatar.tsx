import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { withAlpha } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import { getCategory } from '@/lib/categories';

type CategoryAvatarProps = {
  categoryId: string;
  size?: number;
};

/** Rounded-square tile with the category's icon on a soft tint of its colour. */
export function CategoryAvatar({ categoryId, size = 44 }: CategoryAvatarProps) {
  const category = getCategory(categoryId);
  const dark = useIsDark();

  return (
    <View
      accessibilityLabel={category.label}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: withAlpha(category.color, dark ? 0.22 : 0.14),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={category.icon} size={Math.round(size * 0.48)} color={category.color} />
    </View>
  );
}
