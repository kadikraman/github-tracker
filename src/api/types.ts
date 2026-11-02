export type ReviewState = 'approved' | 'changes_requested' | 'review_required';

export type TrackedItem = {
  id: number;
  node_id: string;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  updated_at: string;
  draft?: boolean;
  user: { login: string; avatar_url: string };
  pull_request?: { merged_at: string | null };
  /** Not in the search response; added from GraphQL in `searchItems`. */
  review_state?: ReviewState;
};

export type GitHubSearchResponse = {
  total_count: number;
  items: TrackedItem[];
};

export type GitHubViewer = {
  login: string;
};

export type PullRequestReviews = {
  id: string;
  reviewDecision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | null;
  latestOpinionatedReviews: { nodes: { state: string }[] };
};
