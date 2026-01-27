import { fromBranchCondition } from './from_branch';
import { hasAuthorInCondition } from './has_author_in';
import type { RuleCondition, RuleContext } from './types';

const conditions: RuleCondition[] = [fromBranchCondition, hasAuthorInCondition];

const conditionRegistry = new Map<string, RuleCondition>(conditions.map((c) => [c.name, c]));

export const evaluateConditions = (
  ruleIf: Record<string, unknown> | undefined,
  context: RuleContext
): boolean => {
  if (ruleIf == null) return true;

  for (const [key, config] of Object.entries(ruleIf)) {
    const condition = conditionRegistry.get(key);
    if (condition && !condition.evaluate(config, context)) {
      return false;
    }
  }
  return true;
};

export type { RuleContext, RuleCondition } from './types';
