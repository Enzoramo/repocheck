# Contributing to RepoCheck

Small, focused contributions are welcome. Open an issue for larger changes before implementing them.

## Local setup

Use Node.js 22 or newer, then run `npm ci` and `npm run dev`.

## Before a pull request

Run:

```sh
npm run typecheck
npm test
npm run build
```

Explain the behavior being changed and the validation performed. For interface changes, check keyboard navigation and narrow screens. Keep UI text in European Portuguese and code identifiers in English.

For analysis changes, include tests for relevant file conventions and incomplete GitHub responses. A missing file in a truncated tree must stay inconclusive. File presence must never be presented as proof that tests pass or code is high quality.

Do not commit API tokens, `.env.local`, generated build files, or dependency directories. Never execute code fetched from an analyzed repository.
