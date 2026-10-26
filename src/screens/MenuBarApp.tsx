import { GlassView, getGlassAvailability } from '@legendapp/spark/ui/glass';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SectionKey } from '../api/github';
import type { TrackedItem } from '../api/types';
import { repoFullName } from '../components/ItemRow';
import { OfflineBanner } from '../components/OfflineBanner';
import { HiddenProvider, useHidden } from '../hooks/useHidden';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { TokenProvider, useToken } from '../hooks/useToken';
import { useTrackedItems } from '../hooks/useTrackedItems';
import { closePopover, openMainWindow } from '../lib/menuBar';
import { queryClient } from '../lib/queryClient';
import { alpha, type Palette } from '../theme';

const TOP_N = 3;
const hasGlass = getGlassAvailability().available;

const SECTIONS: { key: SectionKey; title: string; accentKey: keyof Palette }[] = [
  { key: 'review', title: 'Review requested', accentKey: 'review' },
  { key: 'authored', title: 'My open PRs', accentKey: 'prs' },
  { key: 'mentioned', title: 'Mentioned', accentKey: 'mentioned' },
  { key: 'issues', title: 'Issues on my repos', accentKey: 'issues' },
];

function CompactRow({ item, accent }: { item: TrackedItem; accent: string }) {
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
      style={[styles.row, hovered && { backgroundColor: alpha(colors.cardHover, 0.8) }]}
    >
      <View style={[styles.rowDot, { backgroundColor: accent }]} />
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.muted }]}>
          {repoFullName(item.repository_url)} #{item.number}
        </Text>
      </View>
    </Pressable>
  );
}

function MenuBarSection({
  title,
  sectionKey,
  accentKey,
}: {
  title: string;
  sectionKey: SectionKey;
  accentKey: keyof Palette;
}) {
  const { colors } = useTheme();
  const { hidden } = useHidden();
  const query = useTrackedItems(sectionKey);
  const accent = colors[accentKey] as string;
  const hiddenIds = hidden[sectionKey] ?? [];
  const visible = (query.data ?? []).filter((item) => !hiddenIds.includes(item.id));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
        <View style={[styles.countPill, { backgroundColor: alpha(accent, 0.15) }]}>
          <Text style={[styles.countPillText, { color: accent }]}>
            {query.data ? visible.length : '–'}
          </Text>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: alpha(colors.card, 0.62) }]}>
        {visible.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.faint }]}>
            {query.isPending
              ? 'Loading…'
              : query.error && query.data === undefined
                ? "Couldn't load"
                : 'Nothing to action'}
          </Text>
        ) : (
          <>
            {visible.slice(0, TOP_N).map((item) => (
              <CompactRow key={item.id} item={item} accent={accent} />
            ))}
            {visible.length > TOP_N ? (
              <Text style={[styles.moreText, { color: colors.faint }]}>
                +{visible.length - TOP_N} more
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
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

function PopoverContent() {
  const { colors } = useTheme();
  const { token, loaded } = useToken();

  // The popover window is transparent: glass draws its background on macOS 26+,
  // and older systems get the opaque window colour.
  return (
    <GlassView
      style={[styles.container, !hasGlass && { backgroundColor: colors.appBg }]}
    >
      {!loaded ? (
        <View style={styles.noToken} />
      ) : token ? (
        <>
          <OfflineBanner />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {SECTIONS.map((section) => (
              <MenuBarSection
                key={section.key}
                title={section.title}
                sectionKey={section.key}
                accentKey={section.accentKey}
              />
            ))}
          </ScrollView>
        </>
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countPill: {
    minWidth: 20,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    alignItems: 'center',
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  emptyText: {
    fontSize: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  moreText: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 7,
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
    borderTopWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
