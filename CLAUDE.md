# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that enforces conditional approval rules on pull requests. It validates PR reviews against configurable rules and creates commit statuses based on approval requirements.

## Common Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build the action (ncc bundles to dist/)
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm check            # Run biome lint and format check
pnpm lint             # Run biome lint only
pnpm format           # Auto-format code with biome
pnpm typecheck        # Run TypeScript type checking
```

To run a single test file:
```bash
pnpm vitest run src/validator.test.ts
```

## Architecture

The action is built with TypeScript and uses `@vercel/ncc` to bundle everything into a single `dist/index.js` file.

### Source Files (`src/`)

- **index.ts**: Entry point. Parses GitHub context (pull_request or pull_request_review events), fetches reviews via Octokit, runs rules through validation, and creates commit statuses.
- **validator.ts**: Core validation logic. Takes a rule, reviews, and PR payload; returns whether the rule is satisfied based on approval count and conditions (branch pattern, author list).
- **types.ts**: TypeScript types for `ApprovalRule`, `Review`, and `ValidationResult`.

### Rule Evaluation Flow

1. Rules are passed as JSON in the `approval-rules` input
2. Each rule is evaluated against the PR via `validateApprovals()`
3. The **first** satisfied rule (conditions match) determines the commit status
4. Rules with conditions (`if.from_branch`, `if.has_author_in`) return `null` if conditions don't match
5. Rules without conditions always match

### Approval Rule Structure

```typescript
{
  name: string;
  if?: {
    from_branch?: { pattern: string };  // regex pattern
    has_author_in?: { users: string[] };
  };
  requires: { count: number };
}
```

## Development Notes

- Pre-commit hooks run via lefthook: `pnpm check` and `pnpm build`
- Tests use Vitest with globals enabled
- Biome handles both linting and formatting (not ESLint/Prettier)
- Code style: single quotes, semicolons, 2-space indent, 100 char line width
