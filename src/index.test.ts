import { describe, it, expect, beforeEach, vi } from "vitest";
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
        "approval-rules": JSON.stringify([
          { name: "default", if: {}, requires: { count: 2 } },
        ]),
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

  it("should handle unexpected errors", async () => {
    mockGetInput.mockImplementation(() => {
      throw new Error("Network error");
    });

    await import("./index");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetFailed).toHaveBeenCalledWith("Action failed: Network error");
  });
});
