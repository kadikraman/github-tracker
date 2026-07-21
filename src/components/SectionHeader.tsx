import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { ChevronIcon } from './icons';

type Props = {
  title: string;
  count: number;
  accent?: boolean;
  hiddenCount: number;
  hiddenExpanded: boolean;
  onToggleHidden: () => void;
};

export function SectionHeader({
  title,
  count,
  accent,
  hiddenCount,
  hiddenExpanded,
  onToggleHidden,
}: Props) {
  const [toggleHovered, setToggleHovered] = useState(false);
  return (
    <View style={styles.header}>
      <View style={[styles.dot, { backgroundColor: accent ? colors.accent : colors.neutral500 }]} />
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      <View style={[styles.badge, accent ? styles.badgeAccent : styles.badgeNeutral]}>
        <Text style={[styles.badgeText, { color: accent ? colors.accent800 : colors.neutral800 }]}>
          {count}
        </Text>
      </View>
      {hiddenCount > 0 ? (
        <Pressable
          onPress={onToggleHidden}
          onHoverIn={() => setToggleHovered(true)}
          onHoverOut={() => setToggleHovered(false)}
          style={styles.hiddenToggle}
        >
          <View style={{ transform: [{ rotate: hiddenExpanded ? '90deg' : '0deg' }] }}>
            <ChevronIcon size={13} color={toggleHovered ? colors.text : colors.neutral600} />
          </View>
          <Text style={[styles.hiddenToggleText, toggleHovered && { color: colors.text }]}>
            {hiddenCount} hidden
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f4f3f3',
    borderTopWidth: 2,
    borderTopColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: 0.9,
    color: colors.text,
  },
  badge: {
    minWidth: 22,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeAccent: {
    backgroundColor: colors.accent100,
  },
  badgeNeutral: {
    backgroundColor: colors.neutral100,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 0.22,
  },
  hiddenToggle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  hiddenToggleText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.neutral600,
  },
});
