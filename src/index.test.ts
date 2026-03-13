import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";

vi.mock("@actions/core");
vi.mock("@actions/github", () => ({
  getOctokit: vi.fn(),
  context: {
    eventName: "pull_request",
    payload: {
      pull_request: {
        number: 123,
        head: { sha: "abc123", ref: "feature/test" },
        base: { ref: "main" },
        user: { login: "author1" },
      },
    },
    repo: {
      owner: "test-owner",
      repo: "test-repo",
    },
  },
}));
vi.mock("./validator");

const defaultRules = [{ name: "default", if: {}, requires: { count: 2 } }];

const createMockGetContent = (content: unknown = defaultRules) =>
  vi.fn().mockResolvedValue({
    data: {
      type: "file",
      content: Buffer.from(JSON.stringify(content)).toString("base64"),
    },
  });

describe("GitHub Action main", () => {
  const mockGetInput = vi.mocked(core.getInput);
  const mockSetFailed = vi.mocked(core.setFailed);
  const mockGetOctokit = vi.mocked(github.getOctokit);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.GITHUB_REPOSITORY = "test-owner/test-repo";
    process.env.GITHUB_EVENT_NAME = "pull_request";

    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "github-token": "test-token",
      };
      return inputs[name] || "";
    });

    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          listReviews: vi.fn(),
        },
        repos: {
          createCommitStatus: vi.fn().mockResolvedValue({}),
          getContent: createMockGetContent(),
        },
      },
    };
    mockGetOctokit.mockReturnValue(mockOctokit as any);
  });

  it("should handle successful validation", async () => {
    const { validateApprovals } = await import("./validator");
    vi.mocked(validateApprovals).mockReturnValue({
      approved: true,
      approvalCount: 3,
      rule: { name: "default", if: {}, requires: { count: 2 } },
    });

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockGetOctokit("test-token").rest.repos.createCommitStatus).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      sha: "abc123",
      state: "success",
      context: "PR Approval Check",
      description: "Approved (3/2)",
    });

    expect(mockSetFailed).not.toHaveBeenCalled();
  });

  it("should fetch approval-rules.json from base branch", async () => {
    const { validateApprovals } = await import("./validator");
    vi.mocked(validateApprovals).mockReturnValue(null);

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockGetOctokit("test-token").rest.repos.getContent).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      path: "approval-rules.json",
      ref: "main",
    });
  });

  it("should fail when approval-rules.json is not found", async () => {
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          listReviews: vi.fn(),
        },
        repos: {
          createCommitStatus: vi.fn().mockResolvedValue({}),
          getContent: vi.fn().mockRejectedValue(new Error("Not Found")),
        },
      },
    };
    mockGetOctokit.mockReturnValue(mockOctokit as any);

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith("Action failed: Not Found");
  });

  it("should fail when approval-rules.json is not an array", async () => {
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: { listReviews: vi.fn() },
        repos: {
          createCommitStatus: vi.fn().mockResolvedValue({}),
          getContent: createMockGetContent({ not: "an array" }),
        },
      },
    };
    mockGetOctokit.mockReturnValue(mockOctokit as any);

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining("Invalid approval-rules.json"),
    );
    expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining("Expected Array"));
  });

  it("should fail when a rule is missing required fields", async () => {
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: { listReviews: vi.fn() },
        repos: {
          createCommitStatus: vi.fn().mockResolvedValue({}),
          getContent: createMockGetContent([{ name: "bad-rule" }]),
        },
      },
    };
    mockGetOctokit.mockReturnValue(mockOctokit as any);

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining("Invalid approval-rules.json"),
    );
    expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining("requires"));
  });

  it("should fail when if condition has unknown keys (e.g. typo)", async () => {
    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: { listReviews: vi.fn() },
        repos: {
          createCommitStatus: vi.fn().mockResolvedValue({}),
          getContent: createMockGetContent([
            {
              name: "typo-condition",
              if: { form_branch: { pattern: "main" } },
              requires: { count: 1 },
            },
          ]),
        },
      },
    };
    mockGetOctokit.mockReturnValue(mockOctokit as any);

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining("Invalid approval-rules.json"),
    );
    expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining("form_branch"));
  });

  it("should handle unexpected errors", async () => {
    mockGetInput.mockImplementation(() => {
      throw new Error("Network error");
    });

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith("Action failed: Network error");
  });
});

describe("GitHub Action with merge_group event", () => {
  const mockGetInput = vi.mocked(core.getInput);
  const mockSetFailed = vi.mocked(core.setFailed);
  const mockGetOctokit = vi.mocked(github.getOctokit);
  const mockContext = vi.mocked(github.context);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.GITHUB_REPOSITORY = "test-owner/test-repo";
    process.env.GITHUB_EVENT_NAME = "merge_group";

    // Modify context for merge_group event
    (mockContext as any).eventName = "merge_group";
    (mockContext as any).payload = {
      merge_group: {
        head_sha: "merge-queue-sha-456",
      },
    };

    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "github-token": "test-token",
      };
      return inputs[name] || "";
    });

    const mockOctokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          listReviews: vi.fn(),
        },
        repos: {
          createCommitStatus: vi.fn().mockResolvedValue({}),
          getContent: createMockGetContent(),
        },
      },
    };
    mockGetOctokit.mockReturnValue(mockOctokit as any);
  });

  afterEach(() => {
    // Reset context back to pull_request for other tests
    (mockContext as any).eventName = "pull_request";
    (mockContext as any).payload = {
      pull_request: {
        number: 123,
        head: { sha: "abc123", ref: "feature/test" },
        base: { ref: "main" },
        user: { login: "author1" },
      },
    };
  });

  it("should auto-approve on merge_group event", async () => {
    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockGetOctokit("test-token").rest.repos.createCommitStatus).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      sha: "merge-queue-sha-456",
      state: "success",
      context: "PR Approval Check",
      description: "Skipped (merge queue)",
    });

    expect(mockSetFailed).not.toHaveBeenCalled();
  });
});
