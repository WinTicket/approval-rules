import type { RuleCondition } from './types';

type HasAuthorInConfig = {
  users: string[];
};

export const hasAuthorInCondition: RuleCondition<HasAuthorInConfig> = {
  name: 'has_author_in',
  evaluate: (config, ctx) => config.users.includes(ctx.author),
};
