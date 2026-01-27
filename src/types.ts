import type { Endpoints } from '@octokit/types';

type ListPullRequestReviewsResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews']['response'];
export type Review = ListPullRequestReviewsResponse['data'][number];

export type ApprovalRule = {
  name: string;
  if?: {
    from_branch?: {
      pattern: string;
    };
    has_author_in?: {
      users: string[];
    };
  };
  requires: {
    count: number;
  };
};

export type ValidationResult = {
  approved: boolean;
  approvalCount: number;
  rule: ApprovalRule;
};
