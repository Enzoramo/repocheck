import { describe, expect, it } from "vitest";
import { AnalysisError, parseRepository } from "../repository";

describe("repository input", () => {
  it.each([
    "Enzoramo/repocheck",
    " https://github.com/Enzoramo/repocheck/ ",
    "https://github.com/Enzoramo/repocheck.git",
    "github.com/Enzoramo/repocheck",
  ])("accepts %s", (input) => {
    expect(parseRepository(input)).toEqual({
      owner: "Enzoramo",
      name: "repocheck",
    });
  });
  it.each([
    "https://github.com.evil.test/a/b",
    "https://evil.test/a/b",
    "http://github.com/a/b",
    "https://user:pass@github.com/a/b",
    "https://github.com/a/b?token=secret",
    "https://github.com/a/b#readme",
    "https://github.com:444/a/b",
    "https://github.com/a/b/tree/main",
    "a/..",
    "-a/b",
    "a/b/c",
    "",
    "https://",
  ])("rejects invalid or ambiguous input %s", (input) => {
    expect(() => parseRepository(input)).toThrow(AnalysisError);
  });
});
