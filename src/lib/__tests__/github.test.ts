import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeRepository } from "../github";

const repo = {
  full_name: "owner/project",
  description: null,
  default_branch: "main",
  stargazers_count: 1,
  language: "TypeScript",
  archived: false,
  private: false,
  size: 0,
};
const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });
afterEach(() => vi.unstubAllEnvs());

describe("GitHub adapter", () => {
  it("reads a small repository even if GitHub reports its rounded size as zero", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(repo))
      .mockResolvedValueOnce(
        json({
          tree: [{ path: "README.md", type: "blob", size: 20, sha: "abc" }],
          truncated: false,
        }),
      )
      .mockResolvedValueOnce(
        json({
          encoding: "base64",
          content: Buffer.from("# App\n## Quickstart").toString("base64"),
          size: 20,
        }),
      );
    const result = await analyzeRepository("owner/project", fetcher);
    expect(
      result.checks.find((check) => check.id === "installation")?.status,
    ).toBe("found");
    expect(fetcher.mock.calls[2][0]).toBe(
      "https://api.github.com/repos/owner/project/git/blobs/abc",
    );
  });
  it("handles an empty repository without treating it as an outage", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(repo))
      .mockResolvedValueOnce(
        json({ message: "Git Repository is empty." }, 409),
      );
    const result = await analyzeRepository("owner/project", fetcher);
    expect(result.fileCount).toBe(0);
    expect(result.checks.every((check) => check.status === "missing")).toBe(
      true,
    );
  });
  it("does not expose private repositories even with a server token", async () => {
    vi.stubEnv("GITHUB_TOKEN", "test-token");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ ...repo, private: true }));
    await expect(
      analyzeRepository("owner/project", fetcher),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([429, 403])("reports rate limit status %i", async (status) => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({}, status, { "x-ratelimit-remaining": "0" }));
    await expect(
      analyzeRepository("owner/project", fetcher),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("maps missing repositories to actionable errors", async () => {
    await expect(
      analyzeRepository(
        "owner/project",
        vi.fn<typeof fetch>().mockResolvedValue(json({}, 404)),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("maps network failure to a controlled upstream error", async () => {
    await expect(
      analyzeRepository(
        "owner/project",
        vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
      ),
    ).rejects.toMatchObject({ status: 502 });
  });
  it("keeps failed README requests unknown without discarding other findings", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(repo))
      .mockResolvedValueOnce(
        json({
          tree: [{ path: "README.md", type: "blob", size: 20, sha: "abc" }],
          truncated: false,
        }),
      )
      .mockResolvedValueOnce(json({}, 500));
    const result = await analyzeRepository("owner/project", fetcher);
    expect(
      result.checks.find((check) => check.id === "installation")?.status,
    ).toBe("unknown");
  });
  it("rejects foreign hosts before sending any requests", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      analyzeRepository("https://example.com/a/b", fetcher),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
