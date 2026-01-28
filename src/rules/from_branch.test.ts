import { describe, it, expect } from 'vitest';
import { fromBranchCondition } from './from_branch';

describe('fromBranchCondition', () => {
  it('should return true when branch matches pattern', () => {
    const result = fromBranchCondition.evaluate(
      { pattern: '^release/.*' },
      { fromBranch: 'release/v1.0', author: 'user1' }
    );
    expect(result).toBe(true);
  });

  it('should return false when branch does not match pattern', () => {
    const result = fromBranchCondition.evaluate(
      { pattern: '^release/.*' },
      { fromBranch: 'feature/test', author: 'user1' }
    );
    expect(result).toBe(false);
  });

  it('should support complex regex patterns', () => {
    const result = fromBranchCondition.evaluate(
      { pattern: '^(feature|bugfix)/.*' },
      { fromBranch: 'bugfix/issue-123', author: 'user1' }
    );
    expect(result).toBe(true);
  });

  it('should match exact branch names', () => {
    const result = fromBranchCondition.evaluate(
      { pattern: '^main$' },
      { fromBranch: 'main', author: 'user1' }
    );
    expect(result).toBe(true);
  });

  it('should not match partial when anchored', () => {
    const result = fromBranchCondition.evaluate(
      { pattern: '^main$' },
      { fromBranch: 'main-backup', author: 'user1' }
    );
    expect(result).toBe(false);
  });
});
