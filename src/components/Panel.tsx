import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GitHubApiError } from '../api/github';
import type { TrackedItem } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import type { Group } from '../lib/groups';
import { HiddenItemRow, ItemRow } from './ItemRow';

type Props = {
  title: string;
  accent: string;
  query: UseQueryResult<TrackedItem[], Error>;
  groups: Group[];
  hiddenItems: TrackedItem[];
  /** Rows shown before a "Show all" link; omit for every row. */
  limit?: number;
  login: string | undefined;
  onHide: (id: number) => void;
  onUnhide: (id: number) => void;
};

function GroupHeader({ label, count }: { label: string; count: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.groupHeader, { backgroundColor: colors.sunken, borderTopColor: colors.sep }]}>
      <Text style={[styles.groupLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.groupLabel, { color: colors.muted }]}>{count}</Text>
    </View>
  );
}

function TextButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.textButton, hovered && { backgroundColor: colors.sunken }]}
    >
      <Text style={[styles.textButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Panel({ title, accent, query, groups, hiddenItems, limit, login, onHide, onUnhide }: Props) {
  const { colors } = useTheme();
  const [showHidden, setShowHidden] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const truncated = limit != null && !showAll && total > limit;
  let budget = truncated ? limit : Infinity;
  const shown = groups.map((group) => {
    const items = group.items.slice(0, Math.max(0, budget));
    budget -= items.length;
    return { ...group, items };
  });

  return (
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.sep }]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.count, { color: accent }]}>{query.data ? total : '–'}</Text>
        <View style={styles.spacer} />
        {hiddenItems.length > 0 ? (
          <TextButton
            label={showHidden ? 'Hide hidden' : `${hiddenItems.length} hidden`}
            color={colors.muted}
            onPress={() => setShowHidden((prev) => !prev)}
          />
        ) : null}
      </View>

      {query.isPending ? (
        <ActivityIndicator style={styles.stateBlock} color={colors.muted} />
      ) : query.error && query.data === undefined ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {query.error.message}
            {query.error instanceof GitHubApiError && query.error.status === 401
              ? ' Check your token in Settings.'
              : ''}
          </Text>
          <Pressable
            onPress={() => query.refetch()}
            style={[styles.retryButton, { backgroundColor: colors.sunken }]}
          >
            <Text style={[styles.retryButtonText, { color: colors.text }]}>Retry</Text>
          </Pressable>
        </View>
      ) : total === 0 ? (
        <Text style={[styles.emptyText, { color: colors.faint }]}>Nothing here right now</Text>
      ) : (
        shown.map((group) =>
          group.items.length === 0 ? null : (
            <View key={group.key}>
              <GroupHeader label={group.label} count={group.items.length} />
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  accent={accent}
                  login={login}
                  onHide={() => onHide(item.id)}
                />
              ))}
            </View>
          )
        )
      )}

      {limit != null && total > limit ? (
        <View style={[styles.footer, { borderTopColor: colors.sep }]}>
          <TextButton
            label={showAll ? 'Show fewer' : `Show all ${total}`}
            color={colors.review}
            onPress={() => setShowAll((prev) => !prev)}
          />
        </View>
      ) : null}

      {showHidden && hiddenItems.length > 0 ? (
        <View>
          <GroupHeader label="Hidden" count={hiddenItems.length} />
          {hiddenItems.map((item) => (
            <HiddenItemRow
              key={item.id}
              item={item}
              accent={accent}
              login={login}
              onUnhide={() => onUnhide(item.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 42,
    borderBottomWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  spacer: {
    flex: 1,
  },
  textButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  textButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 7,
    paddingBottom: 5,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
  },
  stateBlock: {
    paddingVertical: 16,
    paddingHorizontal: 14,
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
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
});
