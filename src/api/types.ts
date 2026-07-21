export type TrackedItem = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  updated_at: string;
  draft?: boolean;
  user: { login: string; avatar_url: string };
  pull_request?: { merged_at: string | null };
};

export type GitHubSearchResponse = {
  total_count: number;
  items: TrackedItem[];
};

export type GitHubViewer = {
  login: string;
};
