import type { Endpoints } from '@octokit/types';
import * as v from 'valibot';

type ListPullRequestReviewsResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews']['response'];
export type Review = ListPullRequestReviewsResponse['data'][number];

export const ApprovalRuleSchema = v.strictObject({
  name: v.string(),
  if: v.optional(
    v.strictObject({
      from_branch: v.optional(v.strictObject({ pattern: v.string() })),
      has_author_in: v.optional(v.strictObject({ users: v.array(v.string()) })),
      only_changed_files: v.optional(v.strictObject({ paths: v.array(v.string()) })),
    })
  ),
  requires: v.strictObject({
    count: v.number(),
  }),
});

export const ApprovalRulesSchema = v.array(ApprovalRuleSchema);

export type ApprovalRule = v.InferOutput<typeof ApprovalRuleSchema>;

export type ValidationResult = {
  approved: boolean;
  approvalCount: number;
  rule: ApprovalRule;
};
