import { describe, it, expect } from 'vitest';
import { hasLabelInCondition } from './has_label_in';

describe('hasLabelInCondition', () => {
  it('should return true when a single specified label is present', () => {
    const result = hasLabelInCondition.evaluate(
      { labels: ['hotfix'] },
      { fromBranch: 'feature/test', author: 'user1', changedFiles: [], labels: ['hotfix'] }
    );
    expect(result).toBe(true);
  });

  it('should return true when any of multiple specified labels is present', () => {
    const result = hasLabelInCondition.evaluate(
      { labels: ['hotfix', 'urgent'] },
      {
        fromBranch: 'feature/test',
        author: 'user1',
        changedFiles: [],
        labels: ['bug', 'urgent'],
      }
    );
    expect(result).toBe(true);
  });

  it('should return false when none of the specified labels is present', () => {
    const result = hasLabelInCondition.evaluate(
      { labels: ['hotfix', 'urgent'] },
      { fromBranch: 'feature/test', author: 'user1', changedFiles: [], labels: ['bug'] }
    );
    expect(result).toBe(false);
  });

  it('should return false when there are no labels on the PR', () => {
    const result = hasLabelInCondition.evaluate(
      { labels: ['hotfix'] },
      { fromBranch: 'feature/test', author: 'user1', changedFiles: [], labels: [] }
    );
    expect(result).toBe(false);
  });

  it('should return false when the config specifies no labels', () => {
    const result = hasLabelInCondition.evaluate(
      { labels: [] },
      { fromBranch: 'feature/test', author: 'user1', changedFiles: [], labels: ['hotfix'] }
    );
    expect(result).toBe(false);
  });

  it('should be case-sensitive', () => {
    const result = hasLabelInCondition.evaluate(
      { labels: ['Hotfix'] },
      { fromBranch: 'feature/test', author: 'user1', changedFiles: [], labels: ['hotfix'] }
    );
    expect(result).toBe(false);
  });
});
