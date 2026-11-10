# RepoCheck

Evidence-based checks for public GitHub repositories.

RepoCheck helps maintainers make their projects easier to understand, run, and contribute to. Paste a GitHub repository URL and get actionable findings backed by file evidence.

## First milestone

- [ ] Responsive web interface in Portuguese
- [ ] Public repository analysis through the GitHub REST API
- [ ] README, installation, license, contribution, test and CI checks
- [ ] Explicit limitations for incomplete scans
- [ ] Markdown report export
- [ ] Automated tests and continuous integration

## Stack

Next.js App Router, React and TypeScript. A deterministic analysis engine; no AI API key required.

## Principles

File presence is evidence of configuration, not proof of code quality or passing tests. RepoCheck never executes code from the analyzed repository.
