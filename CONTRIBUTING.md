# Contributing

Contributions are welcome.

## Getting started

```bash
bun install
bun run dev
```

## Before submitting

- `bun run typecheck` must pass.
- `bun test` (Vitest unit tests) must pass.
- If you change the upload/prefill UI, run `bun run test:e2e` (Playwright).
- Generated report text must not introduce diagnostic or patient-specific
  language; the prohibited-phrase tests in `src/lib/interpretHrv.test.ts`
  describe the terminology rules.

By submitting a pull request you agree that your contribution may be distributed under the MIT License.
