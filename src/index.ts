import * as core from '@actions/core';
import type * as github from '@actions/github';
import { context, getOctokit } from '@actions/github';
import type { PullRequest, PullRequestReviewEvent } from '@octokit/webhooks-types';
import type { ApprovalRule } from './types';
import { validateApprovals } from './validator';

const parseContext = (context: typeof github.context): PullRequest | PullRequestReviewEvent => {
  if (context.eventName === 'pull_request' || context.eventName === 'pull_request_review') {
    return context.payload.pull_request as PullRequest;
  }
  throw new Error('Invalid context event name');
};

const run = async (): Promise<void> => {
  try {
    const token = core.getInput('github-token', { required: true });
    const approvalRules = core.getInput('approval-rules', { required: true });

    core.info(`eventName: ${context.eventName}`);

    const octokit = getOctokit(token);

    if (context.eventName === 'merge_group') {
      const octokit = getOctokit(token);
      const headSha = (context.payload.merge_group as { head_sha: string }).head_sha;

      await octokit.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha: headSha,
        state: 'success',
        context: 'PR Approval Check',
        description: 'Skipped (merge queue)',
      });

      core.info('Merge queue detected, auto-approved');
      return;
    }

    const parsedApprovalRules = JSON.parse(approvalRules) as ApprovalRule[];

    const payload = parseContext(context);

    const prMeta = {
      number: 'number' in payload ? payload.number : payload.pull_request?.number,
      headSha: 'head' in payload ? payload.head.sha : payload.pull_request?.head?.sha,
    };

    core.info(`prMeta: ${JSON.stringify(prMeta)}`);

    const [reviews, files] = await Promise.all([
      octokit.paginate(octokit.rest.pulls.listReviews, {
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prMeta.number,
      }),
      octokit.paginate(octokit.rest.pulls.listFiles, {
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prMeta.number,
      }),
    ]);

    const changedFiles = files.map((file) => file.filename);

    const satisfiedRule = parsedApprovalRules
      .map((rule) => {
        return validateApprovals({
          rule,
          reviews,
          payload,
          changedFiles,
        });
      })
      .find((result) => result != null);

    if (satisfiedRule != null) {
      core.info(`satisfiedRule: ${satisfiedRule.rule.name}`);
      await octokit.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha: prMeta.headSha,
        state: satisfiedRule.approved ? 'success' : 'pending',
        context: 'PR Approval Check',
        description: `${
          satisfiedRule.approved ? 'Approved' : 'Needs more approvals'
        } (${satisfiedRule.approvalCount}/${satisfiedRule.rule.requires.count})`,
      });
    } else {
      core.info('No satisfied rule found');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
};

run();
