import { describe, it, expect } from 'vitest';
import { hasAuthorInCondition } from './has_author_in';

describe('hasAuthorInCondition', () => {
  it('should return true when author is in the list', () => {
    const result = hasAuthorInCondition.evaluate(
      { users: ['junior1', 'junior2'] },
      { fromBranch: 'feature/test', author: 'junior1' }
    );
    expect(result).toBe(true);
  });

  it('should return false when author is not in the list', () => {
    const result = hasAuthorInCondition.evaluate(
      { users: ['junior1', 'junior2'] },
      { fromBranch: 'feature/test', author: 'senior1' }
    );
    expect(result).toBe(false);
  });

  it('should handle empty users list', () => {
    const result = hasAuthorInCondition.evaluate(
      { users: [] },
      { fromBranch: 'feature/test', author: 'anyone' }
    );
    expect(result).toBe(false);
  });

  it('should be case-sensitive', () => {
    const result = hasAuthorInCondition.evaluate(
      { users: ['User1'] },
      { fromBranch: 'feature/test', author: 'user1' }
    );
    expect(result).toBe(false);
  });
});
