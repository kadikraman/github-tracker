import { StyleSheet, Text, View } from 'react-native';
import { useIsOffline } from '../lib/connectivity';
import { timeAgo } from '../lib/timeAgo';
import { useTheme } from '../hooks/useTheme';
import { alpha } from '../theme';

export function OfflineBanner({ lastUpdatedAt }: { lastUpdatedAt?: number }) {
  const offline = useIsOffline();
  const { colors } = useTheme();

  if (!offline) {
    return null;
  }

  const label =
    lastUpdatedAt != null
      ? `Offline. Showing data from ${timeAgo(new Date(lastUpdatedAt).toISOString())}.`
      : 'Offline. Showing cached data.';

  return (
    <View style={[styles.banner, { backgroundColor: alpha(colors.mentioned, 0.12) }]}>
      <View style={[styles.dot, { backgroundColor: colors.mentioned }]} />
      <Text style={[styles.text, { color: colors.mentioned }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
