import type { RuleCondition } from './types';

type FromBranchConfig = {
  pattern: string;
};

export const fromBranchCondition: RuleCondition<FromBranchConfig> = {
  name: 'from_branch',
  evaluate: (config, ctx) => new RegExp(config.pattern).test(ctx.fromBranch),
};
