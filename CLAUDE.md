# CLAUDE.md

Project context for Claude Code and other agents. Keep this file focused on things that are **not** obvious from reading the repo — anything you can grep for in five seconds doesn't belong here.

Markdown in this repo is not manually wrapped. Write one paragraph per line and let the editor soft-wrap.

## Layout

- [packages/vavite/](packages/vavite/) — the published library (`vavite` on npm). Built with tsdown. The package name is bare (unscoped) — an intentional exception that predates any "always scope under `@<org>/`" convention you may have seen in similar repos. The `@vavite` npm scope is owned by the maintainer and reserved for future companion packages, so new packages added here should go under `@vavite/<name>`; don't rename the existing bare-named `vavite` package.
- [examples/](examples/) — degit-cloneable consumer demos (Express, Fastify, Koa, Hapi, NestJS, Bun, ws, SSR React, etc.). Not published. Dependencies on workspace packages use real version pins, never `workspace:*`. The `./version` script keeps those pins in sync with the latest package version; pnpm still links them locally during dev because of `linkWorkspacePackages: true` in [pnpm-workspace.yaml](pnpm-workspace.yaml).
- [ci/](ci/) — internal, non-published workspace package (`@vavite/ci`) that runs the examples end-to-end with puppeteer + vitest. Invoked via `pnpm run ci` from the root. Not under `packages/*` because it's a test harness, not a publishable library.

The root [readme.md](readme.md) is a symlink into the package's readme. Edit the symlink target, not the symlink.

## Stack invariants

These are deliberate. Don't change them without a reason.

- **ESM only.** No CJS output, no `"type": "commonjs"`. tsdown is configured for `format: ["esm"]` and `platform: "node"`.
- **Strict TS** with `nodenext` module resolution, `noUncheckedIndexedAccess`, and `noImplicitOverride`.
- **Relative imports use `.ts` extensions**, not `.js`. Lint enforces this; tsconfigs allow it via `allowImportingTsExtensions`. The point is that source runs natively under Node's TS support and Deno, no transpile step required.
- **Tabs, 80 cols.** Markdown and `package.json` use 2-space indent (see [.prettierrc](.prettierrc)). Don't reformat with spaces.
- **Node**: the published source in [packages/vavite/src/](packages/vavite/src/) targets the lowest `engines.node` major. The support range covers every active LTS and every Current release. Dev tooling, build configs, and scripts (e.g. `tsdown.config.ts`, `ci/ci.test.ts`) can assume the latest minor of the most recent LTS — features that landed in recent LTS minors are fair game there; Current-only features aren't. Off-limits inside the package `src/`.
- **ESLint config** comes from `@cyco130/eslint-config/node`. Lint rules live there, not in-repo.
- **Vite peer range**: `~7.3 || 8`. The plugin uses Vite's environment API; older majors don't have it. Don't expand the peer range backwards without checking that runtime compatibility.

## Commands

Run from the repo root unless noted.

- `pnpm dev` — watch-build the package.
- `pnpm build` — build the package.
- `pnpm test` — runs every script matching `test:*` (uses pnpm's `/^test:/` pattern syntax). Adding a new `test:foo` script auto-joins the suite — no test runner registry to update.
- `pnpm run ci` — runs the end-to-end suite in [ci/](ci/) against the **built** package and every example under real Vite + puppeteer. Two gotchas: (a) the script does not auto-build, so a stale or missing `packages/vavite/dist/` will silently invalidate the run — `pnpm build` first; (b) must be spelled `pnpm run ci`, not `pnpm ci` — pnpm treats bare `pnpm ci` as a built-in alias for `pnpm install --frozen-lockfile`, which shadows this script. The bun-server example needs `bun` on PATH; the CI workflow installs it explicitly.
- `pnpm format` — Prettier write across the repo.

Inside [packages/vavite/](packages/vavite/), `pnpm test` fans out to `test:typecheck` (`tsc -p tsconfig.json`), `test:lint` (eslint), and `test:package` (publint). No unit tests inside the package — coverage lives in [ci/](ci/) instead.

## Versioning and publishing

- `./version <semver-arg>` (e.g. `./version patch`, `./version 1.2.0`) bumps the package's version, rewrites `examples/*` deps to drop the `workspace:` protocol so they pin to the new version, and reinstalls to update the lockfile. Run from a clean tree. Matches both the bare `vavite` package and any future `@vavite/*` packages.
- Publishing is wired up in [.github/workflows/publish.yml](.github/workflows/publish.yml).

## Tooling around the edges

- **husky + lint-staged** run on pre-commit. If a commit is being blocked, fix the underlying lint/format issue rather than bypassing the hook.
- **Renovate** config lives at [.github/renovate.json](.github/renovate.json).
- **VSCode** recommended extensions and settings live in [.vscode/](.vscode/).
