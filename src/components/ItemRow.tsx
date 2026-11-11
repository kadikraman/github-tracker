import { setStringAsync } from '@legendapp/spark/clipboard';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TrackedItem } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { reviewStateDisplay } from '../lib/reviewState';
import { timeAgoShort } from '../lib/timeAgo';
import { alpha } from '../theme';
import { CopyIcon, EyeIcon, EyeOffIcon, IssueIcon, PullRequestIcon } from './icons';

export function repoFullName(repositoryUrl: string): string {
  const [, fullName] = repositoryUrl.split('/repos/');
  return fullName ?? repositoryUrl;
}

/** The repository without its owner when the signed-in user is the owner. */
export function repoShortName(repositoryUrl: string, login: string | undefined): string {
  const full = repoFullName(repositoryUrl);
  return login && full.startsWith(`${login}/`) ? full.slice(login.length + 1) : full;
}

function StateChip({ item }: { item: TrackedItem }) {
  const { colors } = useTheme();
  if (item.draft) {
    return (
      <View style={[styles.chip, { borderWidth: 1, borderColor: colors.border }]}>
        <Text style={[styles.chipText, { color: colors.muted }]}>Draft</Text>
      </View>
    );
  }
  if (!item.review_state) {
    return null;
  }
  const { label, color } = reviewStateDisplay(item.review_state, colors);
  const background = item.review_state === 'review_required' ? colors.sunken : alpha(color, 0.14);
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function CopyLinkButton({ url, accent }: { url: string; accent: string }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = () => {
    setStringAsync(url).catch((error: unknown) => console.error('Copying the link failed', error));
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1200);
  };
  const color = copied ? colors.success : hovered ? accent : colors.faint;
  return (
    <Pressable
      onPress={copy}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.iconButton, hovered && { backgroundColor: alpha(accent, 0.13) }]}
    >
      <CopyIcon size={14} color={color} />
    </Pressable>
  );
}

type ItemRowProps = {
  item: TrackedItem;
  accent: string;
  login: string | undefined;
  onHide: () => void;
};

export function ItemRow({ item, accent, login, onHide }: ItemRowProps) {
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
        { borderTopColor: colors.sep },
        hovered && { backgroundColor: colors.cardHover },
      ]}
    >
      {isIssue ? <IssueIcon size={14} color={accent} /> : <PullRequestIcon size={14} color={accent} />}
      <View style={styles.titleCell}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.repo, { color: colors.muted }]}>
          {repoShortName(item.repository_url, login)} #{item.number}
        </Text>
      </View>
      <StateChip item={item} />
      <Text numberOfLines={1} style={[styles.author, { color: colors.muted }]}>
        {item.user.login}
      </Text>
      <Text style={[styles.age, { color: colors.muted }]}>{timeAgoShort(item.updated_at)}</Text>
      <CopyLinkButton url={item.html_url} accent={accent} />
      <Pressable
        onPress={onHide}
        onHoverIn={() => setHideHovered(true)}
        onHoverOut={() => setHideHovered(false)}
        style={[styles.iconButton, hideHovered && { backgroundColor: alpha(accent, 0.13) }]}
      >
        <EyeOffIcon size={14} color={hideHovered ? accent : colors.faint} />
      </Pressable>
    </Pressable>
  );
}

type HiddenItemRowProps = {
  item: TrackedItem;
  accent: string;
  login: string | undefined;
  onUnhide: () => void;
};

export function HiddenItemRow({ item, accent, login, onUnhide }: HiddenItemRowProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <View style={[styles.row, { borderTopColor: colors.sep }]}>
      <View style={[styles.titleCell, styles.hiddenCell]}>
        <Text numberOfLines={1} style={[styles.title, styles.hiddenTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.repo, { color: colors.muted }]}>
          {repoShortName(item.repository_url, login)} #{item.number}
        </Text>
      </View>
      <Pressable
        onPress={onUnhide}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.unhideButton, hovered && { backgroundColor: alpha(accent, 0.13) }]}
      >
        <EyeIcon size={13} color={hovered ? accent : colors.muted} />
        <Text style={[styles.unhideText, { color: hovered ? accent : colors.muted }]}>Unhide</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
    paddingLeft: 14,
    paddingRight: 6,
    borderTopWidth: 1,
  },
  titleCell: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  hiddenCell: {
    opacity: 0.7,
  },
  title: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  hiddenTitle: {
    textDecorationLine: 'line-through',
  },
  repo: {
    flexShrink: 0,
    fontSize: 12,
  },
  chip: {
    flexShrink: 0,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  author: {
    width: 104,
    fontSize: 12,
  },
  age: {
    width: 32,
    fontSize: 12,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unhideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 9,
    marginRight: 4,
    borderRadius: 6,
  },
  unhideText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
