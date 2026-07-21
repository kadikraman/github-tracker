import type { UseQueryResult } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GitHubApiError } from '../api/github';
import type { TrackedItem } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { alpha } from '../theme';
import { HiddenItemRow, ItemRow } from './ItemRow';
import { ChevronIcon } from './icons';

type Props = {
  title: string;
  accent: string;
  icon: ReactNode;
  query: UseQueryResult<TrackedItem[], Error>;
  hiddenIds: number[];
  onHide: (id: number) => void;
  onUnhide: (id: number) => void;
};

export function TrackerSection({ title, accent, icon, query, hiddenIds, onHide, onUnhide }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);

  const items = query.data ?? [];
  const visible = items.filter((item) => !hiddenIds.includes(item.id));
  const hiddenItems = items.filter((item) => hiddenIds.includes(item.id));

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: alpha(accent, 0.16) }]}>{icon}</View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={[styles.countPill, { backgroundColor: alpha(accent, 0.15) }]}>
          <Text style={[styles.countPillText, { color: accent }]}>{visible.length}</Text>
        </View>
        {hiddenItems.length > 0 ? (
          <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            onHoverIn={() => setToggleHovered(true)}
            onHoverOut={() => setToggleHovered(false)}
            style={[styles.hiddenToggle, toggleHovered && { backgroundColor: colors.sunken }]}
          >
            <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
              <ChevronIcon size={13} color={toggleHovered ? colors.text : colors.faint} />
            </View>
            <Text
              style={[styles.hiddenToggleText, { color: toggleHovered ? colors.text : colors.faint }]}
            >
              {hiddenItems.length} hidden
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
        {query.isPending ? (
          <ActivityIndicator style={styles.stateBlock} color={colors.muted} />
        ) : query.error ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {query.error.message}
              {query.error instanceof GitHubApiError && query.error.status === 401
                ? ' — check your token in Settings.'
                : ''}
            </Text>
            <Pressable
              onPress={() => query.refetch()}
              style={[styles.retryButton, { backgroundColor: colors.sunken }]}
            >
              <Text style={[styles.retryButtonText, { color: colors.text }]}>Retry</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.faint }]}>Nothing here right now 🎉</Text>
        ) : (
          visible.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              accent={accent}
              isLast={index === visible.length - 1}
              onHide={() => onHide(item.id)}
            />
          ))
        )}
      </View>

      {expanded && hiddenItems.length > 0 ? (
        <View style={[styles.hiddenArea, { backgroundColor: colors.sunken }]}>
          {hiddenItems.map((item, index) => (
            <HiddenItemRow
              key={item.id}
              item={item}
              accent={accent}
              isLast={index === hiddenItems.length - 1}
              onUnhide={() => onUnhide(item.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 11,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  countPill: {
    minWidth: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hiddenToggle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  hiddenToggleText: {
    fontSize: 12.5,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  stateBlock: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  hiddenArea: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
