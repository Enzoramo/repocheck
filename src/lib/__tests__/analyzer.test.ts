import { describe, expect, it } from "vitest";
import { analyzeSnapshot, type Snapshot } from "../analyzer";
import { toMarkdown } from "../markdown";

const base: Snapshot = {
  repository: {
    fullName: "owner/project",
    url: "https://github.com/owner/project",
    description: null,
    branch: "release/v1",
    stars: 0,
    language: "TypeScript",
    archived: false,
  },
  paths: [],
  truncated: false,
  readme: null,
};

describe("evidence-based analysis", () => {
  it("detects a documented repository across supported conventions", () => {
    const result = analyzeSnapshot({
      ...base,
      paths: [
        "docs/README.md",
        "LICENSE.txt",
        ".github/CONTRIBUTING.md",
        "src/parser.spec.ts",
        ".github/workflows/check.yml",
        ".github/ISSUE_TEMPLATE/bug.yml",
      ],
      readme: {
        path: "docs/README.md",
        content: "# Project\n## Instalação\nnpm ci",
      },
    });
    expect(result.checks.every((check) => check.status === "found")).toBe(true);
    expect(result.checks.find((check) => check.id === "tests")?.path).toBe(
      "src/parser.spec.ts",
    );
  });
  it("does not claim absence when the GitHub tree is truncated", () => {
    const result = analyzeSnapshot({
      ...base,
      paths: ["LICENSE"],
      truncated: true,
    });
    expect(result.checks.find((check) => check.id === "license")?.status).toBe(
      "found",
    );
    expect(
      result.checks
        .filter((check) => check.id !== "license")
        .every((check) => check.status === "unknown"),
    ).toBe(true);
  });
  it("keeps unreadable README content inconclusive while confirming its presence", () => {
    const result = analyzeSnapshot({
      ...base,
      paths: ["README.md"],
      readme: { path: "README.md", content: null },
    });
    expect(result.checks.find((check) => check.id === "readme")?.status).toBe(
      "found",
    );
    expect(
      result.checks.find((check) => check.id === "installation")?.status,
    ).toBe("unknown");
  });
  it("does not mistake commented examples or filenames for completed setup", () => {
    const result = analyzeSnapshot({
      ...base,
      paths: [
        "README.md",
        "contest.ts",
        "docs/tests.md",
        ".github/ISSUE_TEMPLATE/config.yml",
      ],
      readme: {
        path: "README.md",
        content:
          "# Project\n<!--\n## Installation\n-->\n```md\n## Getting started\n```",
      },
    });
    for (const id of ["installation", "tests", "templates"])
      expect(result.checks.find((check) => check.id === id)?.status).toBe(
        "missing",
      );
  });
  it("keeps known README content conclusive with an incomplete file tree", () => {
    const result = analyzeSnapshot({
      ...base,
      truncated: true,
      paths: ["README.md"],
      readme: { path: "README.md", content: "# Project\nDescription only." },
    });
    expect(
      result.checks.find((check) => check.id === "installation")?.status,
    ).toBe("missing");
  });
  it("exports findings, limitations and encoded evidence links", () => {
    const result = analyzeSnapshot(
      { ...base, paths: ["LICENSE"] },
      new Date("2026-11-10T12:00:00Z"),
    );
    const markdown = toMarkdown(result);
    expect(markdown).toContain(
      "https://github.com/owner/project/blob/release%2Fv1/LICENSE",
    );
    expect(markdown).toContain("Próximo passo:");
    expect(markdown).toContain("Não foi executado código");
    expect(markdown).toContain("2026-11-10T12:00:00.000Z");
  });
  it("marks demo exports as fictitious and omits fictitious evidence links", () => {
    const markdown = toMarkdown({ ...analyzeSnapshot(base), demo: true });
    expect(markdown).toContain("dados fictícios");
    expect(markdown).not.toContain("Repositório: https:");
  });
});
