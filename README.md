# Approval Rules GitHub Action

A GitHub Action that enforces conditional approval rules on pull requests. Require different approval counts based on branch names or PR authors.

## Features

- Define multiple approval rules
- Conditional rules (branch name patterns, author lists)
- Uses only the latest review status per user
- Creates Commit Status to show approval status

## Usage

```yaml
name: PR Approval Check

on:
  pull_request_review:
    types: [submitted, dismissed]
  pull_request:
    types: [opened, synchronize]

jobs:
  check-approvals:
    runs-on: ubuntu-latest
    steps:
      - name: Check Approval Rules
        uses: kazukitaninaka/approval-rules@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          approval-rules: |
            [
              {
                "name": "release-branch",
                "if": {
                  "from_branch": {
                    "pattern": "^release/.*"
                  }
                },
                "requires": {
                  "count": 3
                }
              },
              {
                "name": "junior-developer",
                "if": {
                  "has_author_in": {
                    "users": ["junior1", "junior2"]
                  }
                },
                "requires": {
                  "count": 2
                }
              },
              {
                "name": "default",
                "requires": {
                  "count": 1
                }
              }
            ]
```

## Inputs

| Input            | Description                   | Required | Default               |
| ---------------- | ----------------------------- | -------- | --------------------- |
| `github-token`   | GitHub token for API access   | No       | `${{ github.token }}` |
| `approval-rules` | JSON string of approval rules | Yes      | -                     |

## Approval Rules

Each rule has the following structure:

```json
{
  "name": "string",
  "if": {
    "from_branch": {
      "pattern": "string"
    },
    "has_author_in": {
      "users": ["string"]
    }
  },
  "requires": {
    "count": 0
  }
}
```

- `name`: Rule name (string)
- `if`: Conditions (optional, omit to match all PRs)
  - `from_branch.pattern`: Regex pattern for branch name
  - `has_author_in.users`: List of usernames
- `requires.count`: Required number of approvals

### Condition Behavior

- `if` omitted or empty: Matches all PRs
- `from_branch` only: Applies when branch name matches the pattern
- `has_author_in` only: Applies when PR author is in the list
- Both set: Applies when both conditions are met

Rules are evaluated in array order. The first rule that meets the approval condition creates a Commit Status.

### Examples

**Require 3 approvals for release branches:**

```json
{
  "name": "release",
  "if": {
    "from_branch": {
      "pattern": "^release/.*"
    }
  },
  "requires": {
    "count": 3
  }
}
```

**Require 2 approvals for specific users:**

```json
{
  "name": "junior",
  "if": {
    "has_author_in": {
      "users": ["intern1", "intern2"]
    }
  },
  "requires": {
    "count": 2
  }
}
```

**Default requires 1 approval:**

```json
{
  "name": "default",
  "requires": {
    "count": 1
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint & format check
pnpm check
```

## License

MIT
