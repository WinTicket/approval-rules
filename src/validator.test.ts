import { describe, it, expect } from "vitest";
import { validateApprovals } from "./validator";
import type { ApprovalRule, Review } from "./types";
import type { PullRequest } from "@octokit/webhooks-types";

const createMockReview = (overrides: Partial<Review> = {}): Review => ({
  id: 1,
  node_id: "node1",
  user: {
    login: "reviewer1",
    id: 1,
    node_id: "",
    avatar_url: "",
    gravatar_id: "",
    url: "",
    html_url: "",
    followers_url: "",
    following_url: "",
    gists_url: "",
    starred_url: "",
    subscriptions_url: "",
    organizations_url: "",
    repos_url: "",
    events_url: "",
    received_events_url: "",
    type: "User",
    site_admin: false,
  },
  body: "",
  state: "APPROVED",
  html_url: "",
  pull_request_url: "",
  submitted_at: "2024-01-01T10:00:00Z",
  commit_id: "abc123",
  author_association: "CONTRIBUTOR",
  _links: { html: { href: "" }, pull_request: { href: "" } },
  ...overrides,
});

const createMockPayload = (overrides: Partial<PullRequest> = {}): PullRequest =>
  ({
    head: { ref: "feature/test", sha: "abc123" },
    user: { login: "author1" },
    ...overrides,
  }) as PullRequest;

describe("validateApprovals", () => {
  describe("basic approval validation", () => {
    it("should approve when required count is met", () => {
      const rule: ApprovalRule = {
        name: "default",
        if: {},
        requires: { count: 2 },
      };
      const reviews: Review[] = [
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "APPROVED",
          submitted_at: "2024-01-01T10:00:00Z",
        }),
        createMockReview({
          user: { login: "reviewer2" } as Review["user"],
          state: "APPROVED",
          submitted_at: "2024-01-01T11:00:00Z",
        }),
      ];

      const result = validateApprovals({
        rule,
        reviews,
        payload: createMockPayload(),
        changedFiles: [],
      });

      expect(result?.approved).toBe(true);
      expect(result?.approvalCount).toBe(2);
    });

    it("should not approve when required count is not met", () => {
      const rule: ApprovalRule = {
        name: "default",
        if: {},
        requires: { count: 3 },
      };
      const reviews: Review[] = [
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "APPROVED",
        }),
        createMockReview({
          user: { login: "reviewer2" } as Review["user"],
          state: "APPROVED",
        }),
      ];

      const result = validateApprovals({
        rule,
        reviews,
        payload: createMockPayload(),
        changedFiles: [],
      });

      expect(result?.approved).toBe(false);
      expect(result?.approvalCount).toBe(2);
    });
  });

  describe("latest review per user", () => {
    it("should use only the latest review per user", () => {
      const rule: ApprovalRule = {
        name: "default",
        if: {},
        requires: { count: 2 },
      };
      const reviews: Review[] = [
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "APPROVED",
          submitted_at: "2024-01-01T10:00:00Z",
        }),
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "CHANGES_REQUESTED",
          submitted_at: "2024-01-01T11:00:00Z",
        }),
        createMockReview({
          user: { login: "reviewer2" } as Review["user"],
          state: "APPROVED",
          submitted_at: "2024-01-01T12:00:00Z",
        }),
      ];

      const result = validateApprovals({
        rule,
        reviews,
        payload: createMockPayload(),
        changedFiles: [],
      });

      expect(result?.approved).toBe(false);
      expect(result?.approvalCount).toBe(1);
    });

    it("should ignore COMMENTED state", () => {
      const rule: ApprovalRule = {
        name: "default",
        if: {},
        requires: { count: 1 },
      };
      const reviews: Review[] = [
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "APPROVED",
          submitted_at: "2024-01-01T10:00:00Z",
        }),
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "COMMENTED",
          submitted_at: "2024-01-01T11:00:00Z",
        }),
      ];

      const result = validateApprovals({
        rule,
        reviews,
        payload: createMockPayload(),
        changedFiles: [],
      });

      expect(result?.approved).toBe(true);
      expect(result?.approvalCount).toBe(1);
    });
  });

  describe("conditional rules integration", () => {
    it("should return null when conditions do not match", () => {
      const rule: ApprovalRule = {
        name: "release-rule",
        if: {
          from_branch: { pattern: "^release/.*" },
        },
        requires: { count: 1 },
      };
      const reviews: Review[] = [
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "APPROVED",
        }),
      ];

      const result = validateApprovals({
        rule,
        reviews,
        payload: createMockPayload({
          head: { ref: "feature/test" },
        } as Partial<PullRequest>),
        changedFiles: [],
      });

      expect(result).toBe(null);
    });
  });

  describe("no condition set", () => {
    it("should return count when if is not set", () => {
      const rule: ApprovalRule = {
        name: "default",
        if: {},
        requires: { count: 3 },
      };

      const reviews: Review[] = [
        createMockReview({
          user: { login: "reviewer1" } as Review["user"],
          state: "APPROVED",
        }),
      ];

      const result = validateApprovals({
        rule,
        reviews,
        payload: createMockPayload(),
        changedFiles: [],
      });

      expect(result?.approved).toBe(false);
      expect(result?.approvalCount).toBe(1);
      expect(result?.rule.requires.count).toBe(3);
    });
  });
});
