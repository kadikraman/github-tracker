import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SectionKey } from '../api/github';
import { Panel } from '../components/Panel';
import { PullRequestIcon, RefreshIcon, SlidersIcon } from '../components/icons';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAllSections } from '../hooks/useAllSections';
import { useHidden } from '../hooks/useHidden';
import { useTheme } from '../hooks/useTheme';
import { useViewer } from '../hooks/useViewer';
import { groupItems, type GroupKey } from '../lib/groups';
import { alpha, appBadgeColor, type Palette } from '../theme';

// Panels sit in as many columns as fit at this width, in rows laid out by hand:
// Yoga's flexWrap misplaced panels after the filter changed how many there were.
const PANEL_MIN_WIDTH = 520;
const PANEL_GAP = 16;

const PANELS: { key: SectionKey; title: string; accentKey: keyof Palette; limit?: number }[] = [
  { key: 'review', title: 'Review requested', accentKey: 'review' },
  { key: 'authored', title: 'My open PRs', accentKey: 'prs' },
  { key: 'reviewed', title: 'Reviewed by me, not merged', accentKey: 'reviewed' },
  { key: 'mentioned', title: 'Mentioned', accentKey: 'mentioned', limit: 5 },
  { key: 'issues', title: 'Issues on my repos', accentKey: 'issues', limit: 5 },
];

type Chip = { label: string; section: SectionKey; group?: GroupKey; accentKey: keyof Palette };

// A chip filters the panels down to one group, or to one whole section.
const CHIPS: Chip[] = [
  { label: 'Needs your review', section: 'review', group: 'needs_review', accentKey: 'review' },
  { label: 'Changes requested', section: 'review', group: 'changes_requested', accentKey: 'danger' },
  { label: 'My PRs approved', section: 'authored', group: 'my_approved', accentKey: 'prs' },
  { label: 'My drafts', section: 'authored', group: 'my_drafts', accentKey: 'faint' },
  { label: 'Reviewed by me', section: 'reviewed', accentKey: 'reviewed' },
  { label: 'Mentioned', section: 'mentioned', accentKey: 'mentioned' },
  { label: 'Issues', section: 'issues', accentKey: 'issues' },
];

function chipId(chip: Chip): string {
  return `${chip.section}:${chip.group ?? '*'}`;
}

function FilterChip({
  chip,
  count,
  active,
  onPress,
}: {
  chip: Chip;
  count: number | null;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const textColor = active ? colors.review : colors.text;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.chip,
        { borderColor: colors.border, backgroundColor: colors.card },
        hovered && { backgroundColor: colors.cardHover },
        active && { borderColor: alpha(colors.review, 0.45), backgroundColor: alpha(colors.review, 0.1) },
      ]}
    >
      <View style={[styles.chipDot, { backgroundColor: colors[chip.accentKey] as string }]} />
      <Text style={[styles.chipLabel, { color: textColor }]}>{chip.label}</Text>
      <Text style={[styles.chipCount, { color: textColor }]}>{count ?? '–'}</Text>
    </Pressable>
  );
}

function ToolbarButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.toolbarButton, hovered && { backgroundColor: colors.sunken }]}
    >
      {children}
    </Pressable>
  );
}

export function TrackerScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { hidden, hideItem, unhideItem } = useHidden();
  const login = useViewer().data?.login;
  const { queries, anyFetching, lastUpdatedAt, syncLabel } = useAllSections();
  const [filter, setFilter] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);

  const sections = PANELS.map((panel) => {
    const query = queries[panel.key];
    const hiddenIds = hidden[panel.key] ?? [];
    const items = query.data ?? [];
    const visible = items.filter((item) => !hiddenIds.includes(item.id));
    return {
      ...panel,
      query,
      groups: groupItems(panel.key, visible),
      hiddenItems: items.filter((item) => hiddenIds.includes(item.id)),
      loaded: query.data !== undefined,
    };
  });

  const chipCount = (chip: Chip): number | null => {
    const section = sections.find((s) => s.key === chip.section);
    if (!section?.loaded) {
      return null;
    }
    const groups = chip.group ? section.groups.filter((g) => g.key === chip.group) : section.groups;
    return groups.reduce((sum, group) => sum + group.items.length, 0);
  };

  const activeChip = CHIPS.find((chip) => chipId(chip) === filter);
  const shownSections = sections
    .filter((section) => !activeChip || section.key === activeChip.section)
    .map((section) =>
      activeChip?.group
        ? { ...section, groups: section.groups.filter((g) => g.key === activeChip.group) }
        : section
    );

  const columns = Math.max(1, Math.floor((gridWidth + PANEL_GAP) / (PANEL_MIN_WIDTH + PANEL_GAP)));
  const rows: (typeof shownSections)[] = [];
  for (let i = 0; i < shownSections.length; i += columns) {
    rows.push(shownSections.slice(i, i + columns));
  }

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

  return (
    <View style={[styles.container, { backgroundColor: colors.appBg }]}>
      <View
        style={[styles.toolbar, { backgroundColor: colors.titlebar, borderBottomColor: colors.border }]}
      >
        <View style={[styles.appBadge, { backgroundColor: appBadgeColor }]}>
          <PullRequestIcon size={16} color="#ffffff" />
        </View>
        <View>
          <Text style={[styles.appTitle, { color: colors.text }]}>GitHub Tracker</Text>
          <Text style={[styles.syncLabel, { color: colors.muted }]}>{syncLabel}</Text>
        </View>
        <View style={styles.chips}>
          {CHIPS.map((chip) => {
            const id = chipId(chip);
            return (
              <FilterChip
                key={id}
                chip={chip}
                count={chipCount(chip)}
                active={filter === id}
                onPress={() => setFilter((prev) => (prev === id ? null : id))}
              />
            );
          })}
        </View>
        <View style={styles.toolbarRight}>
          <ToolbarButton onPress={() => queryClient.invalidateQueries({ queryKey: ['items'] })}>
            <Animated.View style={anyFetching ? { transform: [{ rotate: spinRotation }] } : null}>
              <RefreshIcon size={16} color={colors.muted} />
            </Animated.View>
          </ToolbarButton>
          <ToolbarButton onPress={onOpenSettings}>
            <SlidersIcon size={16} color={colors.muted} />
          </ToolbarButton>
        </View>
      </View>

      <OfflineBanner lastUpdatedAt={lastUpdatedAt > 0 ? lastUpdatedAt : undefined} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={styles.panelGrid}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        >
          {gridWidth > 0
            ? rows.map((row) => (
                <View key={row.map((section) => section.key).join('+')} style={styles.panelRow}>
                  {row.map((section) => (
                    <Panel
                      key={section.key}
                      title={section.title}
                      accent={colors[section.accentKey] as string}
                      query={section.query}
                      groups={section.groups}
                      hiddenItems={section.hiddenItems}
                      limit={section.limit}
                      login={login}
                      onHide={(id) => hideItem(section.key, id)}
                      onUnhide={(id) => unhideItem(section.key, id)}
                    />
                  ))}
                </View>
              ))
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  appBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 12,
  },
  chipCount: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  panelGrid: {
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    gap: PANEL_GAP,
    paddingTop: 16,
    paddingBottom: 24,
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: PANEL_GAP,
  },
});
