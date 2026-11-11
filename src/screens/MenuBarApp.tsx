import { GlassView, getGlassAvailability } from '@legendapp/spark/ui/glass';
import { QueryClientProvider, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SectionKey } from '../api/github';
import type { TrackedItem } from '../api/types';
import { ChevronIcon, RefreshIcon } from '../components/icons';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAllSections } from '../hooks/useAllSections';
import { HiddenProvider, useHidden } from '../hooks/useHidden';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { TokenProvider, useToken } from '../hooks/useToken';
import { byOldest, groupItems, type Group, type GroupKey } from '../lib/groups';
import { closePopover, openMainWindow } from '../lib/menuBar';
import { queryClient } from '../lib/queryClient';
import { timeAgoShort } from '../lib/timeAgo';
import { alpha, type Palette } from '../theme';

const hasGlass = getGlassAvailability().available;

const TILES: { key: SectionKey; label: string; accentKey: keyof Palette }[] = [
  { key: 'review', label: 'To review', accentKey: 'review' },
  { key: 'authored', label: 'My PRs', accentKey: 'prs' },
  { key: 'mentioned', label: 'Mentioned', accentKey: 'mentioned' },
  { key: 'issues', label: 'Issues', accentKey: 'issues' },
];

// Each section lists its open groups as rows and folds the rest behind a
// one-line toggle, labelled by the group's count.
const SECTIONS: {
  key: SectionKey;
  title: string;
  accentKey: keyof Palette;
  open: GroupKey[];
  folded: Partial<Record<GroupKey, (count: number) => string>>;
}[] = [
  {
    key: 'review',
    title: 'Needs your review',
    accentKey: 'review',
    open: ['needs_review', 'changes_requested'],
    folded: { already_approved: (n) => `${n} already approved` },
  },
  {
    key: 'authored',
    title: 'My PRs approved',
    accentKey: 'prs',
    open: ['my_approved'],
    folded: {
      my_changes_requested: (n) => `${n} with changes requested`,
      my_awaiting_review: (n) => `${n} awaiting review`,
      my_drafts: (n) => `${n} draft${n === 1 ? '' : 's'}`,
    },
  },
  {
    key: 'reviewed',
    title: 'Reviewed by you, not merged',
    accentKey: 'reviewed',
    open: [],
    folded: {
      i_approved: (n) => `${n} you approved`,
      i_requested_changes: (n) => `${n} you requested changes on`,
      i_commented: (n) => `${n} you commented on`,
    },
  },
];

function CompactRow({ item }: { item: TrackedItem }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={() => {
        Linking.openURL(item.html_url);
        closePopover();
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.row,
        { borderTopColor: colors.sep },
        hovered && { backgroundColor: alpha(colors.cardHover, 0.8) },
      ]}
    >
      {item.review_state === 'changes_requested' ? (
        <View style={[styles.rowDot, { backgroundColor: colors.danger }]} />
      ) : null}
      <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
        {item.title}
      </Text>
      <Text style={[styles.rowNumber, { color: colors.muted }]}>#{item.number}</Text>
      <Text style={[styles.rowAge, { color: colors.muted }]}>{timeAgoShort(item.updated_at)}</Text>
    </Pressable>
  );
}

function FoldedGroup({ label, items }: { label: string; items: TrackedItem[] }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[
          styles.foldToggle,
          { borderTopColor: colors.sep },
          hovered && { backgroundColor: alpha(colors.cardHover, 0.8) },
        ]}
      >
        <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
          <ChevronIcon size={11} color={colors.muted} />
        </View>
        <Text style={[styles.foldLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
      {expanded ? items.map((item) => <CompactRow key={item.id} item={item} />) : null}
    </View>
  );
}

function PopoverSection({
  title,
  accent,
  query,
  count,
  openItems,
  folded,
}: {
  title: string;
  accent: string;
  query: UseQueryResult<TrackedItem[], Error>;
  count: number;
  openItems: TrackedItem[];
  folded: { group: Group; label: string }[];
}) {
  const { colors } = useTheme();
  const empty = openItems.length === 0 && folded.length === 0;
  return (
    <View style={[styles.card, { backgroundColor: alpha(colors.card, 0.62), borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: accent }]} />
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          {query.data ? count : '–'}
        </Text>
      </View>
      {empty ? (
        <Text style={[styles.emptyText, { color: colors.faint, borderTopColor: colors.sep }]}>
          {query.isPending
            ? 'Loading…'
            : query.error && query.data === undefined
              ? "Couldn't load"
              : 'Nothing to action'}
        </Text>
      ) : (
        <>
          {openItems.map((item) => (
            <CompactRow key={item.id} item={item} />
          ))}
          {folded.map(({ group, label }) => (
            <FoldedGroup key={group.key} label={label} items={group.items} />
          ))}
        </>
      )}
    </View>
  );
}

function IconButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.iconButton, hovered && { backgroundColor: colors.sunken }]}
    >
      {children}
    </Pressable>
  );
}

function CountTile({ label, accent, count }: { label: string; accent: string; count: number | null }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={openMainWindow}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.tile,
        { backgroundColor: alpha(colors.card, hovered ? 0.85 : 0.62), borderColor: colors.border },
      ]}
    >
      <Text style={[styles.tileCount, { color: accent }]}>{count ?? '–'}</Text>
      <Text numberOfLines={1} style={[styles.tileLabel, { color: colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function OpenAppFooter() {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={openMainWindow}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.footer,
        { borderTopColor: colors.border, backgroundColor: hovered ? colors.sunken : 'transparent' },
      ]}
    >
      <Text style={[styles.footerText, { color: colors.text }]}>Open GitHub Tracker</Text>
    </Pressable>
  );
}

function TrackerPopover() {
  const { colors } = useTheme();
  const { hidden } = useHidden();
  const queryClient = useQueryClient();
  const { queries, syncLabel } = useAllSections();

  const visibleItems = (key: SectionKey): TrackedItem[] | undefined => {
    const hiddenIds = hidden[key] ?? [];
    return queries[key].data?.filter((item) => !hiddenIds.includes(item.id));
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={[styles.appTitle, { color: colors.text }]}>GitHub Tracker</Text>
        <Text style={[styles.syncLabel, { color: colors.muted }]}>{syncLabel}</Text>
        <View style={styles.spacer} />
        <IconButton onPress={() => queryClient.invalidateQueries({ queryKey: ['items'] })}>
          <RefreshIcon size={14} color={colors.muted} />
        </IconButton>
      </View>
      <OfflineBanner />
      <View style={styles.tiles}>
        {TILES.map((tile) => (
          <CountTile
            key={tile.key}
            label={tile.label}
            accent={colors[tile.accentKey] as string}
            count={visibleItems(tile.key)?.length ?? null}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {SECTIONS.map((section) => {
          const groups = groupItems(section.key, visibleItems(section.key) ?? []);
          const openItems = groups
            .filter((group) => section.open.includes(group.key))
            .flatMap((group) => group.items)
            .sort(byOldest);
          const folded = groups.flatMap((group) => {
            const label = section.folded[group.key];
            return label ? [{ group, label: label(group.items.length) }] : [];
          });
          // A section with no open rows counts everything it folds away.
          const count =
            section.open.length > 0
              ? openItems.length
              : folded.reduce((sum, { group }) => sum + group.items.length, 0);
          return (
            <PopoverSection
              key={section.key}
              title={section.title}
              accent={colors[section.accentKey] as string}
              query={queries[section.key]}
              count={count}
              openItems={openItems}
              folded={folded}
            />
          );
        })}
      </ScrollView>
    </>
  );
}

function PopoverContent() {
  const { colors } = useTheme();
  const { token, loaded } = useToken();

  // The popover window is transparent: glass draws its background on macOS 26+,
  // and older systems get the opaque window colour.
  return (
    <GlassView style={[styles.container, !hasGlass && { backgroundColor: colors.appBg }]}>
      {!loaded ? (
        <View style={styles.noToken} />
      ) : token ? (
        <TrackerPopover />
      ) : (
        <View style={styles.noToken}>
          <Text style={[styles.noTokenText, { color: colors.muted }]}>
            Add your GitHub token in the app to get started.
          </Text>
        </View>
      )}
      <OpenAppFooter />
    </GlassView>
  );
}

export function MenuBarApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TokenProvider>
          <HiddenProvider>
            <PopoverContent />
          </HiddenProvider>
        </TokenProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 10,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncLabel: {
    fontSize: 12,
  },
  spacer: {
    flex: 1,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 1,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  tileCount: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tileLabel: {
    fontSize: 11,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 10,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 30,
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  rowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
  },
  rowNumber: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  rowAge: {
    width: 26,
    fontSize: 11,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  foldToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  foldLabel: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  noToken: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noTokenText: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    height: 44,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
