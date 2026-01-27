export interface RuleContext {
  fromBranch: string;
  author: string;
}

export interface RuleCondition<T = unknown> {
  name: string;
  evaluate(config: T, context: RuleContext): boolean;
}
