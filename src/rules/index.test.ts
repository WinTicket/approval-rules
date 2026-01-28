import { describe, it, expect } from 'vitest';
import { evaluateConditions } from './index';
import type { RuleContext } from './types';

describe('evaluateConditions', () => {
  const defaultContext: RuleContext = {
    fromBranch: 'feature/test',
    author: 'user1',
  };

  describe('when ruleIf is undefined or null', () => {
    it('should return true when ruleIf is undefined', () => {
      const result = evaluateConditions(undefined, defaultContext);
      expect(result).toBe(true);
    });

    it('should return true when ruleIf is null', () => {
      const result = evaluateConditions(null as unknown as undefined, defaultContext);
      expect(result).toBe(true);
    });
  });

  describe('when ruleIf is empty object', () => {
    it('should return true', () => {
      const result = evaluateConditions({}, defaultContext);
      expect(result).toBe(true);
    });
  });

  describe('single condition evaluation', () => {
    it('should return true when from_branch matches', () => {
      const result = evaluateConditions(
        { from_branch: { pattern: '^feature/.*' } },
        { fromBranch: 'feature/test', author: 'user1' }
      );
      expect(result).toBe(true);
    });

    it('should return false when from_branch does not match', () => {
      const result = evaluateConditions(
        { from_branch: { pattern: '^release/.*' } },
        { fromBranch: 'feature/test', author: 'user1' }
      );
      expect(result).toBe(false);
    });

    it('should return true when has_author_in matches', () => {
      const result = evaluateConditions(
        { has_author_in: { users: ['user1', 'user2'] } },
        { fromBranch: 'feature/test', author: 'user1' }
      );
      expect(result).toBe(true);
    });

    it('should return false when has_author_in does not match', () => {
      const result = evaluateConditions(
        { has_author_in: { users: ['user1', 'user2'] } },
        { fromBranch: 'feature/test', author: 'user3' }
      );
      expect(result).toBe(false);
    });
  });

  describe('multiple conditions (AND logic)', () => {
    it('should return true when all conditions match', () => {
      const result = evaluateConditions(
        {
          from_branch: { pattern: '^feature/.*' },
          has_author_in: { users: ['user1'] },
        },
        { fromBranch: 'feature/test', author: 'user1' }
      );
      expect(result).toBe(true);
    });

    it('should return false when one condition fails', () => {
      const result = evaluateConditions(
        {
          from_branch: { pattern: '^feature/.*' },
          has_author_in: { users: ['user2'] },
        },
        { fromBranch: 'feature/test', author: 'user1' }
      );
      expect(result).toBe(false);
    });

    it('should return false when first condition fails', () => {
      const result = evaluateConditions(
        {
          from_branch: { pattern: '^release/.*' },
          has_author_in: { users: ['user1'] },
        },
        { fromBranch: 'feature/test', author: 'user1' }
      );
      expect(result).toBe(false);
    });
  });

  describe('unknown condition keys', () => {
    it('should ignore unknown condition keys', () => {
      const result = evaluateConditions(
        { unknown_condition: { foo: 'bar' } },
        defaultContext
      );
      expect(result).toBe(true);
    });
  });
});
