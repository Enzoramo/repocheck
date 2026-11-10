import { analyzeSnapshot } from "./analyzer";

export const demoAnalysis = {
  ...analyzeSnapshot(
    {
      repository: {
        fullName: "demo/project-notes",
        description: "Um pequeno espaço para organizar ideias e projetos.",
        url: "https://github.com/demo/project-notes",
        branch: "main",
        stars: 0,
        language: "TypeScript",
        archived: false,
      },
      paths: [
        "README.md",
        "LICENSE",
        "package.json",
        "src/app.ts",
        "src/app.test.ts",
        ".github/workflows/checks.yml",
      ],
      truncated: false,
      readme: {
        path: "README.md",
        content: "# Project Notes\n\nUma aplicação para organizar ideias.",
      },
    },
    new Date("2026-11-10T12:00:00Z"),
  ),
  demo: true,
};
