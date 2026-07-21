import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TrackedItem } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { timeAgo } from '../lib/timeAgo';
import { alpha } from '../theme';
import { EyeIcon, EyeOffIcon, IssueIcon, PullRequestIcon } from './icons';

export function repoFullName(repositoryUrl: string): string {
  const [, fullName] = repositoryUrl.split('/repos/');
  return fullName ?? repositoryUrl;
}

type ItemRowProps = {
  item: TrackedItem;
  accent: string;
  isLast: boolean;
  onHide: () => void;
};

export function ItemRow({ item, accent, isLast, onHide }: ItemRowProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [hideHovered, setHideHovered] = useState(false);
  const isIssue = item.pull_request == null;

  return (
    <Pressable
      onPress={() => Linking.openURL(item.html_url)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.sep },
        hovered && { backgroundColor: colors.cardHover },
      ]}
    >
      <View style={styles.typeIcon}>
        {isIssue ? (
          <IssueIcon size={17} color={accent} />
        ) : (
          <PullRequestIcon size={17} color={accent} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          {item.draft ? (
            <View style={[styles.draftTag, { backgroundColor: colors.sunken }]}>
              <Text style={[styles.draftTagText, { color: colors.muted }]}>DRAFT</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
          {repoFullName(item.repository_url)}{' '}
          <Text style={{ color: colors.faint }}>#{item.number}</Text> · {item.user.login} ·
          updated {timeAgo(item.updated_at)}
        </Text>
      </View>
      <Pressable
        onPress={onHide}
        onHoverIn={() => setHideHovered(true)}
        onHoverOut={() => setHideHovered(false)}
        style={[styles.hideButton, hideHovered && { backgroundColor: alpha(accent, 0.13) }]}
      >
        <EyeOffIcon size={16} color={hideHovered ? accent : colors.faint} />
      </Pressable>
    </Pressable>
  );
}

type HiddenItemRowProps = {
  item: TrackedItem;
  accent: string;
  isLast: boolean;
  onUnhide: () => void;
};

export function HiddenItemRow({ item, accent, isLast, onUnhide }: HiddenItemRowProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <View
      style={[
        styles.hiddenRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.sep },
      ]}
    >
      <View style={[styles.body, styles.hiddenBody]}>
        <Text style={[styles.hiddenTitle, { color: colors.text, textDecorationColor: colors.faint }]}>
          {item.title}
        </Text>
        <Text style={[styles.hiddenMeta, { color: colors.muted }]} numberOfLines={1}>
          {repoFullName(item.repository_url)} #{item.number} · {item.user.login}
        </Text>
      </View>
      <Pressable
        onPress={onUnhide}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.unhideButton, { backgroundColor: colors.card }, colors.shadow]}
      >
        <EyeIcon size={14} color={hovered ? accent : colors.text} />
        <Text style={[styles.unhideText, { color: hovered ? accent : colors.text }]}>Unhide</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  typeIcon: {
    flex: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    flexShrink: 1,
  },
  draftTag: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  draftTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.42,
  },
  meta: {
    fontSize: 12.5,
    marginTop: 3,
  },
  hideButton: {
    flex: 0,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  hiddenBody: {
    opacity: 0.72,
  },
  hiddenTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  hiddenMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  unhideButton: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unhideText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
