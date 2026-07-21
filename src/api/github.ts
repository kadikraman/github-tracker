import type { GitHubSearchResponse, GitHubViewer, TrackedItem } from './types';

const BASE_URL = 'https://api.github.com';

export const SECTION_QUERIES = {
  review: 'is:open is:pr archived:false review-requested:@me',
  mentioned: 'is:open archived:false mentions:@me -author:@me',
  issues: 'is:open is:issue archived:false user:@me',
  authored: 'is:open is:pr archived:false author:@me',
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

async function request<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
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
    'advanced_search=true',
  ].join('&');
  const data = await request<GitHubSearchResponse>(token, `/search/issues?${params}`);
  return data.items;
}

export async function fetchViewer(token: string): Promise<GitHubViewer> {
  return request<GitHubViewer>(token, '/user');
}
