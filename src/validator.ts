import type { PullRequest, PullRequestReviewEvent } from '@octokit/webhooks-types';
import { type RuleContext, evaluateConditions } from './rules';
import type { ApprovalRule, Review, ValidationResult } from './types';

export const validateApprovals = ({
  rule,
  reviews,
  payload,
}: {
  rule: ApprovalRule;
  reviews: Review[];
  payload: PullRequest | PullRequestReviewEvent;
}): ValidationResult | null => {
  // get the latest review status for each user
  const latestReviewByUser = new Map<string, { submittedAt: Date; state: string }>();
  for (const review of reviews) {
    // NOTE: ignore COMMENTED state since it's possible to comment after approval
    if (review.state === 'COMMENTED') {
      continue;
    }

    const submittedAt = new Date(review.submitted_at ?? '');
    const reviewer = review.user?.login ?? '';

    if (
      !latestReviewByUser.has(reviewer) ||
      new Date(latestReviewByUser.get(reviewer)?.submittedAt ?? '') < submittedAt
    ) {
      latestReviewByUser.set(reviewer, { submittedAt, state: review.state });
    }
  }

  const approvalCount = Array.from(latestReviewByUser.values()).filter(
    (review) => review.state === 'APPROVED'
  ).length;
  const approved = approvalCount >= rule.requires.count;

  const context: RuleContext = {
    fromBranch: 'head' in payload ? payload.head.ref : (payload.pull_request?.head?.ref ?? ''),
    author:
      'user' in payload ? (payload.user?.login ?? '') : (payload.pull_request?.user?.login ?? ''),
  };

  const isTarget = evaluateConditions(rule.if, context);

  // NOTE: matches nothing when if is set but none of the conditions are met
  if (rule.if != null && !isTarget) {
    return null;
  }

  return {
    approved,
    approvalCount,
    rule,
  };
};
