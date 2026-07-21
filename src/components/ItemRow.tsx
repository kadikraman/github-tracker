import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TrackedItem } from '../api/types';
import { timeAgo } from '../lib/timeAgo';
import { avatarColor, colors, fonts } from '../theme';
import { EyeIcon, EyeOffIcon, IssueIcon, PullRequestIcon } from './icons';

export function repoFullName(repositoryUrl: string): string {
  const [, fullName] = repositoryUrl.split('/repos/');
  return fullName ?? repositoryUrl;
}

function Avatar({ login }: { login: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: avatarColor(login) }]}>
      <Text style={styles.avatarText}>{(login[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

type ItemRowProps = {
  item: TrackedItem;
  accent?: boolean;
  onHide: () => void;
};

export function ItemRow({ item, accent, onHide }: ItemRowProps) {
  const [hovered, setHovered] = useState(false);
  const [hideHovered, setHideHovered] = useState(false);
  const isIssue = item.pull_request == null;
  const iconColor = item.draft
    ? colors.neutral400
    : accent
      ? colors.accent600
      : colors.neutral500;

  return (
    <Pressable
      onPress={() => Linking.openURL(item.html_url)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.row, hovered && styles.rowHovered]}
    >
      <Avatar login={item.user.login} />
      <View style={styles.typeIcon}>
        {isIssue ? (
          <IssueIcon size={17} color={iconColor} />
        ) : (
          <PullRequestIcon size={17} color={iconColor} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.title}>{item.title}</Text>
          {item.draft ? (
            <View style={styles.draftTag}>
              <Text style={styles.draftTagText}>Draft</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {repoFullName(item.repository_url)} <Text style={styles.metaNum}>#{item.number}</Text> ·{' '}
          {item.user.login} · updated {timeAgo(item.updated_at)}
        </Text>
      </View>
      <Pressable
        onPress={onHide}
        onHoverIn={() => setHideHovered(true)}
        onHoverOut={() => setHideHovered(false)}
        style={[styles.hideButton, hideHovered && styles.hideButtonHovered]}
      >
        <EyeOffIcon size={16} color={hideHovered ? colors.accent : colors.neutral500} />
      </Pressable>
    </Pressable>
  );
}

type HiddenItemRowProps = {
  item: TrackedItem;
  onUnhide: () => void;
};

export function HiddenItemRow({ item, onUnhide }: HiddenItemRowProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <View style={styles.hiddenRow}>
      <View style={styles.body}>
        <Text style={styles.hiddenTitle}>{item.title}</Text>
        <Text style={styles.hiddenMeta} numberOfLines={1}>
          {repoFullName(item.repository_url)} #{item.number} · {item.user.login}
        </Text>
      </View>
      <Pressable
        onPress={onUnhide}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.unhideButton, hovered && styles.unhideButtonHovered]}
      >
        <EyeIcon size={14} color={hovered ? colors.accent : colors.text} />
        <Text style={[styles.unhideText, hovered && styles.unhideTextHovered]}>Unhide</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowHovered: {
    backgroundColor: colors.hoverText4,
  },
  avatar: {
    flex: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  avatarText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    color: '#ffffff',
  },
  typeIcon: {
    marginTop: 4,
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
    fontFamily: fonts.heading,
    fontSize: 14.5,
    lineHeight: 19,
    color: colors.text,
    flexShrink: 1,
  },
  draftTag: {
    backgroundColor: colors.neutral100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  draftTagText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 0.22,
    color: colors.neutral800,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.neutral600,
    marginTop: 3,
  },
  metaNum: {
    color: colors.neutral500,
  },
  hideButton: {
    flex: 0,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  hideButtonHovered: {
    opacity: 1,
    backgroundColor: colors.accent100,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    opacity: 0.7,
  },
  hiddenTitle: {
    fontFamily: fonts.heading,
    fontSize: 13.5,
    color: colors.text,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.neutral400,
  },
  hiddenMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.neutral600,
    marginTop: 2,
  },
  unhideButton: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  unhideButtonHovered: {
    borderColor: colors.accent,
  },
  unhideText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text,
  },
  unhideTextHovered: {
    color: colors.accent,
  },
});
