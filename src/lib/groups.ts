import type { SectionKey } from '../api/github';
import type { TrackedItem } from '../api/types';

export type GroupKey =
  | 'needs_review'
  | 'changes_requested'
  | 'already_approved'
  | 'my_changes_requested'
  | 'my_approved'
  | 'my_awaiting_review'
  | 'my_drafts'
  | 'i_approved'
  | 'i_requested_changes'
  | 'i_commented'
  | 'most_recent';

export type Group = { key: GroupKey; label: string; items: TrackedItem[] };

type GroupSpec = { key: GroupKey; label: string; match: (item: TrackedItem) => boolean };

const SPECS: Record<SectionKey, GroupSpec[]> = {
  review: [
    { key: 'changes_requested', label: 'Changes requested', match: (i) => i.review_state === 'changes_requested' },
    { key: 'already_approved', label: 'Already approved', match: (i) => i.review_state === 'approved' },
    { key: 'needs_review', label: 'Needs your review', match: () => true },
  ],
  authored: [
    { key: 'my_drafts', label: 'Drafts', match: (i) => i.draft === true },
    { key: 'my_changes_requested', label: 'Changes requested', match: (i) => i.review_state === 'changes_requested' },
    { key: 'my_approved', label: 'Approved', match: (i) => i.review_state === 'approved' },
    { key: 'my_awaiting_review', label: 'Awaiting review', match: () => true },
  ],
  reviewed: [
    { key: 'i_approved', label: 'You approved', match: (i) => i.my_review === 'approved' },
    { key: 'i_requested_changes', label: 'You requested changes', match: (i) => i.my_review === 'changes_requested' },
    { key: 'i_commented', label: 'You commented', match: () => true },
  ],
  mentioned: [{ key: 'most_recent', label: 'Oldest first', match: () => true }],
  issues: [{ key: 'most_recent', label: 'Oldest first', match: () => true }],
};

// The order groups are shown in, which differs from the order they are matched in.
const ORDER: Record<SectionKey, GroupKey[]> = {
  review: ['needs_review', 'changes_requested', 'already_approved'],
  authored: ['my_changes_requested', 'my_approved', 'my_awaiting_review', 'my_drafts'],
  reviewed: ['i_approved', 'i_requested_changes', 'i_commented'],
  mentioned: ['most_recent'],
  issues: ['most_recent'],
};

/** Oldest update first, so stale items surface at the top of every group. */
export function byOldest(a: TrackedItem, b: TrackedItem): number {
  return a.updated_at.localeCompare(b.updated_at);
}

/** Splits a section's items into its groups, oldest first; each item lands in the first group that matches. Empty groups are left out. */
export function groupItems(section: SectionKey, items: TrackedItem[]): Group[] {
  const specs = SPECS[section];
  const buckets = new Map<GroupKey, TrackedItem[]>(specs.map((spec) => [spec.key, []]));
  for (const item of [...items].sort(byOldest)) {
    const spec = specs.find((candidate) => candidate.match(item)) ?? specs[specs.length - 1];
    buckets.get(spec.key)?.push(item);
  }
  return ORDER[section]
    .map((key) => ({ key, label: specs.find((s) => s.key === key)?.label ?? key, items: buckets.get(key) ?? [] }))
    .filter((group) => group.items.length > 0);
}
