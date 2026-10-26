import type { RuleCondition } from './types';

type HasLabelInConfig = {
  labels: string[];
};

export const hasLabelInCondition: RuleCondition<HasLabelInConfig> = {
  name: 'has_label_in',
  evaluate: (config, ctx) => config.labels.some((label) => ctx.labels.includes(label)),
};
