import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { installAndRelaunch, useUpdateStatus } from '../lib/updateStatus';
import { useTheme } from '../hooks/useTheme';
import { alpha } from '../theme';

export function UpdateBanner() {
  const status = useUpdateStatus();
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  if (status.phase === 'downloading' || status.phase === 'installing') {
    const percent = status.progress != null ? ` ${Math.round(status.progress * 100)}%` : '';
    const label =
      status.phase === 'installing'
        ? 'Installing update…'
        : `Downloading update${status.version ? ` ${status.version}` : ''}…${percent}`;
    return (
      <View style={[styles.banner, { backgroundColor: alpha(colors.success, 0.12) }]}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
        <Text style={[styles.text, { color: colors.success }]}>{label}</Text>
      </View>
    );
  }

  if (status.phase === 'ready') {
    return (
      <Pressable
        onPress={() => installAndRelaunch()}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.banner, { backgroundColor: alpha(colors.success, hovered ? 0.2 : 0.12) }]}
      >
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
        <Text style={[styles.text, { color: colors.success }]}>
          {`Update${status.version ? ` ${status.version}` : ''} is ready. Restart to update.`}
        </Text>
      </Pressable>
    );
  }

  return null;
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
