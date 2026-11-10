# RepoCheck

[![Checks](https://github.com/Enzoramo/repocheck/actions/workflows/ci.yml/badge.svg)](https://github.com/Enzoramo/repocheck/actions/workflows/ci.yml)

**Turn your next commit into a better first impression.**

RepoCheck is a web application that checks how easy a public GitHub repository is to understand, run, and contribute to. Paste a repository URL to get practical suggestions backed by file evidence. The interface is in European Portuguese.

![RepoCheck interface with a clearly labeled fictional example](docs/preview.png)

## Features

- Analyze public GitHub repositories by URL or `owner/repository`.
- Check README, installation instructions, license, contribution guide, test files, CI configuration, and issue/PR templates.
- Inspect the evidence and open the relevant file on GitHub.
- Filter findings by documentation, collaboration, or automation.
- Export the complete report as Markdown.
- Explore a clearly labeled, fictional demo without making API requests.
- Use a responsive interface with keyboard controls and reduced-motion support.

No login, database, or AI API key is required.

## Getting started

Use Node.js **22 or newer** and npm.

```sh
git clone https://github.com/Enzoramo/repocheck.git
cd repocheck
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000), paste a public repository URL, and select **Analisar repositório**. You can also select **este projeto** to analyze RepoCheck itself.

### Optional GitHub token

Public analysis works without a token, subject to the [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api). For local development, an optional server-side token can be configured:

```sh
cp .env.example .env.local
```

Set `GITHUB_TOKEN` inside `.env.local`. Never prefix it with `NEXT_PUBLIC_`, commit it, or put it in browser code. Private repositories are rejected even if the configured token could access them.

## How findings work

RepoCheck reads the default branch's file tree and the README using the [GitHub REST API](https://docs.github.com/en/rest/git/trees). It never downloads and executes repository code.

| Check                | Evidence used                                                      |
| -------------------- | ------------------------------------------------------------------ |
| Project introduction | README in the root, `docs/`, or `.github/`                         |
| Local setup          | A recognized installation or getting-started heading in the README |
| License              | Root `LICENSE`, `LICENCE`, or `COPYING` file                       |
| Contributing         | `CONTRIBUTING` in the root, `docs/`, or `.github/`                 |
| Tests                | Recognized test filenames and directories                          |
| CI                   | GitHub Actions workflows or selected common CI configurations      |
| Issue/PR templates   | Recognized templates under `.github/`                              |

Each result is **found**, **needs improvement**, or **inconclusive**. If GitHub returns a truncated tree, missing files remain inconclusive. If the README cannot be read, its setup check remains inconclusive.

### Limitations

These are heuristics, not a code-quality score. File presence does not prove meaningful content, adequate test coverage, passing tests, or successful CI. Installation instructions in an unrecognized format and project-specific naming conventions may be missed. Only the default branch is checked. The file tree and repository metadata are read in separate requests, so a concurrent update can affect a report.

The initial version does not store reports or share analysis history. It performs two GitHub requests per analysis, plus one for a readable README. The local server has no multi-user quota system; add deployment-level rate limiting before operating a shared public instance with a token.

## Development

```sh
npm run typecheck
npm test
npm run build
npm start
```

The GitHub Actions workflow runs type checking, unit/integration tests with mocked GitHub responses, and a production build. Tests cover URL validation, rule evidence, truncated trees, empty repositories, private repository rejection, upstream errors, and Markdown export.

## Architecture

```text
src/app/page.tsx              Responsive client interface
src/app/api/analyze/route.ts  Validated server endpoint
src/lib/repository.ts        Input parsing and controlled errors
src/lib/github.ts            GitHub REST adapter, timeouts and rate-limit errors
src/lib/analyzer.ts          Deterministic rules, independent of the network
src/lib/markdown.ts          Portable report export
src/lib/demo.ts              Explicitly fictional example
src/lib/__tests__/           Rule, adapter and export tests
```

Built with Next.js App Router, React, TypeScript, Lucide icons, Manrope, and DM Sans. Tests use Vitest. Fonts are bundled locally.

## Roadmap

- [x] Responsive web interface and live GitHub analysis
- [x] Evidence-based checks and explicit incomplete-scan states
- [x] Markdown report export
- [x] Automated tests and GitHub Actions
- [ ] Browser regression tests
- [ ] Shareable report links and history
- [ ] Ecosystem-specific checks
- [ ] Multi-user rate limiting and deployment

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, and conventions. Bug reports should include the public repository URL and the finding's evidence where applicable.

## License

[MIT](LICENSE) © Enzo Ramo.
