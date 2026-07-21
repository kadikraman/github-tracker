import { useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GitHubApiError, type SectionKey } from '../api/github';
import type { TrackedItem } from '../api/types';
import { HiddenItemRow, ItemRow } from '../components/ItemRow';
import { SectionHeader } from '../components/SectionHeader';
import { PullRequestIcon, RefreshIcon, SlidersIcon } from '../components/icons';
import { useHidden } from '../hooks/useHidden';
import { useTrackedItems } from '../hooks/useTrackedItems';
import { timeAgo } from '../lib/timeAgo';
import { colors, fonts } from '../theme';

const SECTION_CONFIG: { key: SectionKey; title: string; accent?: boolean }[] = [
  { key: 'review', title: 'Review requested', accent: true },
  { key: 'mentioned', title: 'Mentioned' },
  { key: 'issues', title: 'Issues on my repos' },
  { key: 'authored', title: 'My open PRs' },
];

type TrackerSection = {
  key: SectionKey;
  title: string;
  accent?: boolean;
  data: TrackedItem[];
  query: UseQueryResult<TrackedItem[], Error>;
  hiddenItems: TrackedItem[];
  expanded: boolean;
};

function IconButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.iconButton, hovered && styles.iconButtonHovered]}
    >
      {children}
    </Pressable>
  );
}

export function TrackerScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const queryClient = useQueryClient();
  const { hidden, hideItem, unhideItem } = useHidden();
  const [expandedHidden, setExpandedHidden] = useState<Record<string, boolean>>({});

  const review = useTrackedItems('review');
  const mentioned = useTrackedItems('mentioned');
  const issues = useTrackedItems('issues');
  const authored = useTrackedItems('authored');
  const queriesByKey = { review, mentioned, issues, authored } as const;
  const queries = Object.values(queriesByKey);

  const anyFetching = queries.some((q) => q.isFetching);
  const lastUpdatedAt = Math.max(0, ...queries.map((q) => q.dataUpdatedAt));

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!anyFetching) {
      return undefined;
    }
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anyFetching, spin]);
  const spinRotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const sections: TrackerSection[] = SECTION_CONFIG.map((config) => {
    const query = queriesByKey[config.key];
    const hiddenIds = hidden[config.key] ?? [];
    const items = query.data ?? [];
    return {
      ...config,
      query,
      data: items.filter((item) => !hiddenIds.includes(item.id)),
      hiddenItems: items.filter((item) => hiddenIds.includes(item.id)),
      expanded: !!expandedHidden[config.key],
    };
  });

  const syncLabel = anyFetching
    ? 'Syncing…'
    : lastUpdatedAt > 0
      ? `Updated ${timeAgo(new Date(lastUpdatedAt).toISOString())}`
      : 'Waiting for first sync';

  const renderSectionFooter = ({ section }: { section: TrackerSection }) => {
    const { query } = section;
    if (query.isPending) {
      return <ActivityIndicator style={styles.stateBlock} color={colors.neutral600} />;
    }
    if (query.error) {
      const is401 = query.error instanceof GitHubApiError && query.error.status === 401;
      return (
        <View style={styles.stateBlock}>
          <Text style={styles.errorText}>
            {query.error.message}
            {is401 ? ' — check your token in Settings.' : ''}
          </Text>
          <Pressable onPress={() => query.refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <>
        {section.data.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here right now.</Text>
        ) : null}
        {section.expanded && section.hiddenItems.length > 0 ? (
          <View style={styles.hiddenArea}>
            {section.hiddenItems.map((item) => (
              <HiddenItemRow
                key={item.id}
                item={item}
                onUnhide={() => unhideItem(section.key, item.id)}
              />
            ))}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.appBadge}>
          <PullRequestIcon size={16} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.appTitle}>GitHub Tracker</Text>
          <Text style={styles.syncLabel}>{syncLabel}</Text>
        </View>
        <View style={styles.toolbarButtons}>
          <IconButton onPress={() => queryClient.invalidateQueries({ queryKey: ['items'] })}>
            <Animated.View style={anyFetching ? { transform: [{ rotate: spinRotation }] } : null}>
              <RefreshIcon size={16} color={colors.neutral700} />
            </Animated.View>
          </IconButton>
          <IconButton onPress={onOpenSettings}>
            <SlidersIcon size={16} color={colors.neutral700} />
          </IconButton>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        renderItem={({ item, section }) => (
          <ItemRow
            item={item}
            accent={section.accent}
            onHide={() => hideItem(section.key, item.id)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={section.title}
            count={section.data.length}
            accent={section.accent}
            hiddenCount={section.hiddenItems.length}
            hiddenExpanded={section.expanded}
            onToggleHidden={() =>
              setExpandedHidden((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
            }
          />
        )}
        renderSectionFooter={renderSectionFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.bgRaised,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  appBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: -0.15,
    color: colors.text,
  },
  syncLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.neutral600,
    marginTop: 2,
  },
  toolbarButtons: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 2,
  },
  iconButton: {
    width: 30,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverText9,
  },
  listContent: {
    paddingBottom: 40,
  },
  stateBlock: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.accent700,
    marginBottom: 8,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  retryButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.text,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.neutral500,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  hiddenArea: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
});
