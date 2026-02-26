import { describe, expect, it } from 'vitest';
import { onlyChangedFilesCondition } from './only_changed_files';
import type { RuleContext } from './types';

const baseContext: RuleContext = {
  fromBranch: 'feature/test',
  author: 'author1',
  changedFiles: [],
};

describe('onlyChangedFilesCondition', () => {
  it('should return true when all files match a path pattern', () => {
    const result = onlyChangedFilesCondition.evaluate({ paths: ['^docs/', '^\\.github/'] }, {
      ...baseContext,
      changedFiles: ['docs/readme.md', 'docs/guide.md', '.github/workflows/ci.yml'],
    });
    expect(result).toBe(true);
  });

  it('should return false when a file does not match any path pattern', () => {
    const result = onlyChangedFilesCondition.evaluate({ paths: ['^docs/'] }, {
      ...baseContext,
      changedFiles: ['docs/readme.md', 'src/index.ts'],
    });
    expect(result).toBe(false);
  });

  it('should return false when changedFiles is empty', () => {
    const result = onlyChangedFilesCondition.evaluate({ paths: ['^docs/'] }, {
      ...baseContext,
      changedFiles: [],
    });
    expect(result).toBe(false);
  });

  it('should return true when single file matches single path pattern', () => {
    const result = onlyChangedFilesCondition.evaluate({ paths: ['^src/'] }, {
      ...baseContext,
      changedFiles: ['src/validator.ts'],
    });
    expect(result).toBe(true);
  });

  it('should support complex regex patterns', () => {
    const result = onlyChangedFilesCondition.evaluate({ paths: ['\\.md$', '\\.txt$'] }, {
      ...baseContext,
      changedFiles: ['docs/readme.md', 'CHANGELOG.md', 'notes.txt'],
    });
    expect(result).toBe(true);
  });

  it('should fail complex regex when a file does not match', () => {
    const result = onlyChangedFilesCondition.evaluate({ paths: ['\\.md$'] }, {
      ...baseContext,
      changedFiles: ['docs/readme.md', 'src/index.ts'],
    });
    expect(result).toBe(false);
  });
});
