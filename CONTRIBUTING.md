# Contributing

zaly is a Bun workspace monorepo. Use Node.js 22.18.0 or newer and Bun.

## Development

Run from the repository root:

```sh
bun install --frozen-lockfile
bun z build
bun test                # Fast development loop
bun z test --bun        # Verify under both Node and Bun
bun z lint
bun z fmt
```

Use `bun z ...` for project tooling; running it inside a package limits supported
commands to that package. Root lint also requires `actionlint` on your PATH.

Keep changes focused and add tests for behavior changes. Import test APIs from
`vitest`, not `bun:test`, so tests work in both runtimes. Commit generated changes
when a build updates them. Use conventional commit messages such as `fix(tui): ...`
or `feat(agent): ...` for release notes.

## Documentation

Root `docs/` is for the user-facing documentation website. Package-specific
contributor and embedding guides live in `packages/<name>/docs/` where needed.

For versioning, CI publication, and recovery, see the
[release guide](./packages/dev/docs/releases.md). Versions and changelogs are managed
through release-please; don't bump package versions individually.
