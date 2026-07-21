import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SectionKey } from '../api/github';
import { TrackerSection } from '../components/TrackerSection';
import {
  AtSignIcon,
  EyeIcon,
  IssueIcon,
  MonitorIcon,
  MoonIcon,
  PullRequestIcon,
  RefreshIcon,
  SlidersIcon,
  SunIcon,
} from '../components/icons';
import { useHidden } from '../hooks/useHidden';
import { useTheme } from '../hooks/useTheme';
import { useTrackedItems } from '../hooks/useTrackedItems';
import { timeAgo } from '../lib/timeAgo';
import { appBadgeColor, type Palette, type ThemeMode } from '../theme';

const SECTION_ICONS: Record<SectionKey, (accent: string) => ReactNode> = {
  review: (accent) => <EyeIcon size={16} color={accent} />,
  mentioned: (accent) => <AtSignIcon size={17} color={accent} />,
  issues: (accent) => <IssueIcon size={17} color={accent} />,
  authored: (accent) => <PullRequestIcon size={17} color={accent} />,
};

const SECTION_CONFIG: { key: SectionKey; title: string; accentKey: keyof Palette }[] = [
  { key: 'review', title: 'Review requested', accentKey: 'review' },
  { key: 'authored', title: 'My open PRs', accentKey: 'prs' },
  { key: 'mentioned', title: 'Mentioned', accentKey: 'mentioned' },
  { key: 'issues', title: 'Issues on my repos', accentKey: 'issues' },
];

type SummaryCardProps = {
  title: string;
  accent: string;
  count: number | null;
  hiddenCount: number;
  onPress: () => void;
};

function SummaryCard({ title, accent, count, hiddenCount, onPress }: SummaryCardProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.summaryCard,
        { backgroundColor: colors.card },
        colors.shadow,
        hovered && { transform: [{ translateY: -2 }] },
      ]}
    >
      <View style={styles.summaryTitleRow}>
        <View style={[styles.summaryDot, { backgroundColor: accent }]} />
        <Text style={[styles.summaryTitle, { color: colors.muted }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.summaryCountRow}>
        <Text style={[styles.summaryCount, { color: accent }]}>{count ?? '–'}</Text>
        {hiddenCount > 0 ? (
          <View style={[styles.summaryHiddenPill, { backgroundColor: colors.sunken }]}>
            <Text style={[styles.summaryHiddenPillText, { color: colors.faint }]}>
              {hiddenCount} hidden
            </Text>
          </View>
        ) : null}
      </View>
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

function ThemeSegmentedControl() {
  const { mode, setMode, colors } = useTheme();
  const options: { value: ThemeMode; icon: (color: string) => ReactNode }[] = [
    { value: 'light', icon: (color) => <SunIcon size={15} color={color} /> },
    { value: 'dark', icon: (color) => <MoonIcon size={15} color={color} /> },
    { value: 'system', icon: (color) => <MonitorIcon size={15} color={color} /> },
  ];
  return (
    <View style={[styles.segContainer, { backgroundColor: colors.sunken }]}>
      {options.map((option) => {
        const active = mode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            style={[styles.segButton, active && [{ backgroundColor: colors.card }, colors.shadow]]}
          >
            {option.icon(active ? colors.text : colors.faint)}
          </Pressable>
        );
      })}
    </View>
  );
}

export function TrackerScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { hidden, hideItem, unhideItem } = useHidden();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});

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

  const syncLabel = anyFetching
    ? 'Syncing…'
    : lastUpdatedAt > 0
      ? `Updated ${timeAgo(new Date(lastUpdatedAt).toISOString())}`
      : 'Waiting for first sync';

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
          <Text style={[styles.syncLabel, { color: colors.faint }]}>{syncLabel}</Text>
        </View>
        <View style={styles.toolbarRight}>
          <ThemeSegmentedControl />
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

      <ScrollView ref={scrollRef} contentContainerStyle={styles.listContent}>
        <View style={styles.summaryGrid}>
          {SECTION_CONFIG.map(({ key, title, accentKey }) => {
            const query = queriesByKey[key];
            const hiddenIds = hidden[key] ?? [];
            const items = query.data;
            return (
              <SummaryCard
                key={key}
                title={title}
                accent={colors[accentKey] as string}
                count={items ? items.filter((item) => !hiddenIds.includes(item.id)).length : null}
                hiddenCount={items ? items.filter((item) => hiddenIds.includes(item.id)).length : 0}
                onPress={() => {
                  const y = sectionOffsets.current[key];
                  if (y != null) {
                    scrollRef.current?.scrollTo({ y: Math.max(0, y - 4), animated: true });
                  }
                }}
              />
            );
          })}
        </View>
        {SECTION_CONFIG.map(({ key, title, accentKey }) => {
          const accent = colors[accentKey] as string;
          return (
            <View
              key={key}
              onLayout={(event) => {
                sectionOffsets.current[key] = event.nativeEvent.layout.y;
              }}
            >
              <TrackerSection
                title={title}
                accent={accent}
                icon={SECTION_ICONS[key](accent)}
                query={queriesByKey[key]}
                hiddenIds={hidden[key] ?? []}
                onHide={(id) => hideItem(key, id)}
                onUnhide={(id) => unhideItem(key, id)}
              />
            </View>
          );
        })}
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
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  appBadge: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.14,
  },
  syncLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  toolbarRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 2,
    borderRadius: 9,
  },
  segButton: {
    width: 30,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButton: {
    width: 30,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 34,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 6,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    paddingTop: 13,
    paddingHorizontal: 15,
    paddingBottom: 14,
    gap: 9,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  summaryCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  summaryCount: {
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 28,
  },
  summaryHiddenPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  summaryHiddenPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
