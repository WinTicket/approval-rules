import type { RuleCondition } from './types';

type OnlyChangedFilesConfig = {
  paths: string[];
};

export const onlyChangedFilesCondition: RuleCondition<OnlyChangedFilesConfig> = {
  name: 'only_changed_files',
  evaluate: (config, ctx) => {
    if (ctx.changedFiles.length === 0) return false;
    const pathRegexes = config.paths.map((path) => new RegExp(path));
    return ctx.changedFiles.every((file) => pathRegexes.some((regex) => regex.test(file)));
  },
};
