import type {
  GitHubSearchResponse,
  GitHubViewer,
  MyReview,
  PullRequestReviews,
  ReviewState,
  TrackedItem,
} from './types';

const BASE_URL = 'https://api.github.com';

export const SECTION_QUERIES = {
  review: 'is:open is:pr archived:false review-requested:@me',
  mentioned: 'is:open archived:false mentions:@me -author:@me',
  issues: 'is:open is:issue archived:false user:@me',
  authored: 'is:open is:pr archived:false author:@me',
  reviewed: 'is:open is:pr archived:false reviewed-by:@me -author:@me',
} as const;

export type SectionKey = keyof typeof SECTION_QUERIES;

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rateLimited: boolean = false
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    const rateLimited =
      response.status === 429 ||
      (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0');
    const message =
      response.status === 401
        ? 'GitHub token is invalid or expired'
        : rateLimited
          ? 'GitHub rate limit reached — will retry shortly'
          : `GitHub request failed (${response.status})`;
    throw new GitHubApiError(message, response.status, rateLimited);
  }
  return (await response.json()) as T;
}

export async function searchItems(token: string, query: string): Promise<TrackedItem[]> {
  const params = [
    `q=${encodeURIComponent(query)}`,
    'per_page=50',
    'sort=updated',
    'order=asc',
    'advanced_search=true',
  ].join('&');
  const data = await request<GitHubSearchResponse>(token, `/search/issues?${params}`);
  return withReviewStates(token, data.items);
}

const REVIEWS_QUERY = `query ($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on PullRequest {
      id
      reviewDecision
      latestOpinionatedReviews(first: 50) { nodes { state } }
      reviews(last: 50) { nodes { state viewerDidAuthor } }
    }
  }
}`;

function reviewState(pr: PullRequestReviews): ReviewState | undefined {
  switch (pr.reviewDecision) {
    case 'APPROVED':
      return 'approved';
    case 'CHANGES_REQUESTED':
      return 'changes_requested';
    case 'REVIEW_REQUIRED':
      return 'review_required';
  }
  // reviewDecision is null when the repo requires no reviews, even after one.
  const states = pr.latestOpinionatedReviews.nodes.map((review) => review.state);
  if (states.includes('CHANGES_REQUESTED')) return 'changes_requested';
  if (states.includes('APPROVED')) return 'approved';
  return undefined;
}

function myReview(pr: PullRequestReviews): MyReview | undefined {
  const mine = pr.reviews.nodes.filter((review) => review.viewerDidAuthor && review.state !== 'PENDING');
  const latest = mine[mine.length - 1];
  switch (latest?.state) {
    case 'APPROVED':
      return 'approved';
    case 'CHANGES_REQUESTED':
      return 'changes_requested';
    case undefined:
      return undefined;
    default:
      return 'commented';
  }
}

// Search results carry no review state, so it comes from one GraphQL lookup.
// A failed lookup leaves the items without it rather than failing the section.
async function withReviewStates(token: string, items: TrackedItem[]): Promise<TrackedItem[]> {
  const ids = items.filter((item) => item.pull_request != null).map((item) => item.node_id);
  if (ids.length === 0) {
    return items;
  }
  try {
    const { data } = await request<{ data?: { nodes: (PullRequestReviews | null)[] } }>(
      token,
      '/graphql',
      { method: 'POST', body: JSON.stringify({ query: REVIEWS_QUERY, variables: { ids } }) }
    );
    const states = new Map<string, Pick<TrackedItem, 'review_state' | 'my_review'>>();
    for (const node of data?.nodes ?? []) {
      if (node?.id != null) {
        states.set(node.id, { review_state: reviewState(node), my_review: myReview(node) });
      }
    }
    return items.map((item) => ({ ...item, ...states.get(item.node_id) }));
  } catch {
    return items;
  }
}

export async function fetchViewer(token: string): Promise<GitHubViewer> {
  return request<GitHubViewer>(token, '/user');
}
