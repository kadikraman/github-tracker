export type ReviewState = 'approved' | 'changes_requested' | 'review_required';
/** The latest review the signed-in user left on a PR. */
export type MyReview = 'approved' | 'changes_requested' | 'commented';

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
  /** Not in the search response; added from GraphQL in `searchItems`. */
  my_review?: MyReview;
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
  reviews: { nodes: { state: string; viewerDidAuthor: boolean }[] };
};
