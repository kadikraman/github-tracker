import type { ReviewState } from '../api/types';
import type { Palette } from '../theme';

export function reviewStateDisplay(
  state: ReviewState,
  colors: Palette
): { label: string; color: string } {
  switch (state) {
    case 'approved':
      return { label: 'Approved', color: colors.success };
    case 'changes_requested':
      return { label: 'Changes requested', color: colors.danger };
    case 'review_required':
      return { label: 'Review required', color: colors.muted };
  }
}
